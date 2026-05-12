/**
 * resume-trades.ts — fill in trades on an EXISTING strategy from where it left off.
 *
 * Use case: populate-demo crashed mid-run (Galileo RPC flake), some strategies
 * have partial trade counts. This resumes the equity curve from current state.
 *
 * Usage:
 *   PRIVATE_KEY=0x... HL_TEST_PRIVATE_KEY=0x... MOCK_DEX=false \
 *     ./node_modules/.bin/tsx src/v3/resume-trades.ts <tokenId> [archetypeName]
 *
 * The archetype determines the equity curve (matches PLANS in populate-demo.ts).
 * If omitted, derives from the on-chain archetype field.
 */

import { ethers } from "ethers";
import { placePerp, closePerp, type Asset, type Side } from "./hyperliquid.js";

const RPC = "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = 16602;
const MOCK_DEX = process.env.MOCK_DEX === "true";

const V3 = {
  strategyINFT:     "0x349D286aF27501d4119C11709bb48f4Ef9f50450",
  tradeAttestation: "0x30Fc834477B15B0B3720D61A169FF5dFe4D7C742",
};

const STRATEGY_ABI = [
  "function getData(uint256) view returns (tuple(uint8,bytes32,bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8))",
];
const ATTEST_ABI = [
  "function recordTrade(uint256,bytes32,bytes32,bytes32,int256,uint256) returns (uint256)",
  "function tradeCount(uint256) view returns (uint256)",
];

// Curves matching populate-demo.ts PLANS
const CURVES: Record<string, number[]> = {
  Bold:    [1015, 1030, 1052, 1041, 1063, 1078, 1095, 1102, 1118, 1135],
  Patient: [990, 1005, 998, 1012, 1023, 1018, 1031, 1042, 1038, 1055],
  Sharp:   [1008, 1015, 1011, 1019, 1024, 1022, 1029, 1033, 1038, 1041],
  Stoic:   [978, 950, 920, 880, 845, 820, 805, 790, 790, 790],
};

const ARCHETYPE_NAMES = ["Bold", "Patient", "Sharp", "Stoic"] as const;

function randomBytes32(): string {
  return "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
}

function encodeHlTxHash(raw: string): string {
  if (raw.startsWith("0x") && raw.length === 66) return raw;
  try {
    const oid = BigInt(raw);
    return "0x" + oid.toString(16).padStart(64, "0");
  } catch {
    return ethers.keccak256(ethers.toUtf8Bytes(raw));
  }
}

async function placeRealOrMock(asset: Asset, side: Side, sizeUsdc: number): Promise<{ txHash: string }> {
  const hl = process.env.HL_TEST_PRIVATE_KEY;
  if (MOCK_DEX || !hl) return { txHash: randomBytes32() };
  const open = await placePerp(hl, asset, side, sizeUsdc);
  try { await closePerp(hl, asset); } catch {}
  return open;
}

async function main() {
  const tokenIdArg = process.argv[2];
  if (!tokenIdArg) { console.error("usage: resume-trades.ts <tokenId>"); process.exit(1); }
  const tokenId = BigInt(tokenIdArg);

  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY required");

  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);
  const wallet = new ethers.Wallet(pk, provider);

  const strategy = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, provider);
  const attest = new ethers.Contract(V3.tradeAttestation, ATTEST_ABI, wallet);

  const data = await strategy.getData(tokenId);
  const archetype = ARCHETYPE_NAMES[Number(data[0])];
  const startingBond = data[6];
  const currentEquity = data[11];
  const status = Number(data[12]);
  const tradeCountBn = await attest.tradeCount(tokenId);
  const currentCount = Number(tradeCountBn);

  console.log(`Strategy #${tokenId} archetype=${archetype} status=${["Idle","Active","Breached","Settled"][status]} trades=${currentCount}/10 equity=${ethers.formatUnits(currentEquity, 6)}`);

  if (status !== 1) { console.error("Strategy not Active, can't append trades."); process.exit(1); }

  const curve = CURVES[archetype];
  if (currentCount >= curve.length) { console.log("Already at full trade count."); return; }

  let prevEquity = currentCount === 0 ? Number(ethers.formatUnits(startingBond, 6)) : curve[currentCount - 1];
  console.log(`Resuming from trade ${currentCount + 1}, prevEquity=${prevEquity}`);

  const usdc = (n: number) => ethers.parseUnits(n.toString(), 6);

  for (let t = currentCount; t < curve.length; t++) {
    const equityAfter = curve[t];
    const pnlDelta = equityAfter - prevEquity;
    const side: Side = pnlDelta >= 0 ? "LONG" : "SHORT";
    // HL requires minimum $10 notional; floor at 15 to avoid slippage rejection
    const tradeSize = Math.max(15, Math.abs(pnlDelta) * 5);

    const hlResult = await placeRealOrMock("BTC", side, tradeSize);

    const chatId = randomBytes32();
    const storageRoot = randomBytes32();
    // Lossless encoding of HL oid (numeric string) to bytes32 hex
    const txHash = encodeHlTxHash(hlResult.txHash);

    const pnlScaled = ethers.parseUnits(Math.abs(pnlDelta).toFixed(6), 6);
    const pnlEncoded = pnlDelta >= 0 ? pnlScaled : -pnlScaled;

    try {
      const tx = await attest.recordTrade(tokenId, chatId, storageRoot, txHash, pnlEncoded, usdc(equityAfter));
      let rcptOk = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try { await tx.wait(); rcptOk = true; break; } catch (e: any) {
          if (e.error?.message?.includes("no matching receipts") || e.code === "UNKNOWN_ERROR") {
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          throw e;
        }
      }
      console.log(`  trade ${t + 1}/${curve.length}: equity ${prevEquity} → ${equityAfter} (pnl ${pnlDelta >= 0 ? "+" : ""}${pnlDelta}) tx=${tx.hash.slice(0, 10)} ${rcptOk ? "✓" : "(no rcpt)"}`);
    } catch (e: any) {
      if (e.message?.includes("EpochNotActive") || e.message?.includes("0x7c97c5d8")) {
        console.log(`  trade ${t + 1}: BREACH triggered on chain, halting ✓`);
        break;
      }
      throw e;
    }
    prevEquity = equityAfter;
  }
  console.log("\n[resume-trades] DONE");
}

main().catch((e) => { console.error(e); process.exit(1); });
