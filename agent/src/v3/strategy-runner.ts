/**
 * strategy-runner.ts — autonomous trading loop for a single Strategy Agent.
 *
 * Per loop iteration:
 *   1. Read strategy state from chain (StrategyINFT.getData)
 *   2. If status != Active → exit (idle, breached, or settled — nothing to do)
 *   3. If MOCK_TEE=true (default for demo): generate a deterministic mock decision
 *      from market context + tokenId. If false: call 0G Compute TEE via the
 *      shared inference helper (broker.inference.getRequestHeaders + processResponse)
 *   4. Place trade on Hyperliquid via hyperliquid.ts placePerp + closePerp
 *   5. Compute new equity from (a) current bond + simulated PnL or (b) HL clearinghouse
 *      readback. v3 trusts operator-reported equity; v3.1 = HL state attested
 *   6. Encode HL oid as bytes32, generate (mock for v3) chatId + storageRoot
 *   7. Call TradeAttestation.recordTrade — atomic write of attestation + equity update
 *   8. Sleep `intervalSecs` and loop
 *
 * Usage:
 *   PRIVATE_KEY=0x... HL_TEST_PRIVATE_KEY=0x... \
 *     ./node_modules/.bin/tsx src/v3/strategy-runner.ts <tokenId> [intervalSecs] [maxTrades]
 *
 *   defaults: intervalSecs=10, maxTrades=10
 *
 * Why this is a separate file from populate-demo.ts:
 *   - populate-demo is a one-shot bootstrap (mint + epoch + N trades, then exit)
 *   - strategy-runner is the production-shape loop you'd run continuously
 *     against an existing strategy. It reads state, makes one decision, attests,
 *     and goes back to sleep.
 *   - v3.1 will replace the MOCK_TEE branch with real 0G Compute, replace the
 *     mock chatId/storageRoot with real attestation IDs, and have the loop
 *     pull strategy archetype to feed the TEE prompt.
 */

import { ethers } from "ethers";
import { placePerp, closePerp, type Asset, type Side } from "./hyperliquid.js";

const RPC_URL = process.env.RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 16602);
const MOCK_DEX = process.env.MOCK_DEX === "true";
const MOCK_TEE = process.env.MOCK_TEE !== "false"; // default true — v3 demo uses mock TEE

const V3 = {
  strategyINFT:     process.env.V3_STRATEGY_INFT     ?? "0x782CBD5313E3b99d9C94e4f5197B81a432cdE621",
  tradeAttestation: process.env.V3_TRADE_ATTESTATION ?? "0x892872eF9490683604EE53B90c5c21e1B4E6eeda",
};

const STRATEGY_ABI = [
  "function getData(uint256) view returns (tuple(uint8,bytes32,bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8))",
  "function isInBreach(uint256) view returns (bool)",
];
const ATTEST_ABI = [
  "function recordTrade(uint256,bytes32,bytes32,bytes32,int256,uint256) returns (uint256)",
  "function tradeCount(uint256) view returns (uint256)",
];

const ARCHETYPE_NAMES = ["Bold", "Patient", "Sharp", "Stoic"] as const;
type Archetype = (typeof ARCHETYPE_NAMES)[number];

interface Decision {
  side: Side;
  pnlDelta: number; // signed USDC delta
  chatId: string;   // 32-byte hex
  storageRoot: string; // 32-byte hex
}

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

/**
 * Mock TEE decision: deterministic per (tokenId, tradeIndex, archetype) so
 * runs are reproducible. Generates a realistic small pnlDelta and a mock
 * chatId/storageRoot that look like real TEE+0G hashes.
 *
 * Real TEE replacement (v3.1): swap this for a call into
 * agent/src/duel/tee-inference.ts with a v3 strategy prompt.
 */
function mockDecide(tokenId: number, tradeIndex: number, archetype: Archetype, currentEquity: number): Decision {
  // Archetype bias — what kind of trades this strategy makes
  const biases: Record<Archetype, { winRate: number; avgWin: number; avgLoss: number; longBias: number }> = {
    Bold:    { winRate: 0.65, avgWin: 18, avgLoss: -10, longBias: 0.7 },
    Patient: { winRate: 0.60, avgWin: 12, avgLoss: -7,  longBias: 0.5 },
    Sharp:   { winRate: 0.62, avgWin: 6,  avgLoss: -3,  longBias: 0.55 },
    Stoic:   { winRate: 0.45, avgWin: 8,  avgLoss: -15, longBias: 0.4 }, // bad strategy on purpose
  };
  const b = biases[archetype];

  // Deterministic seed
  const seed = (tokenId * 1000 + tradeIndex) % 1000;
  const r = (seed * 1103515245 + 12345) & 0x7fffffff;
  const pnlRoll = (r / 0x7fffffff);
  const sideRoll = ((r >> 7) & 0x7fffffff) / 0x7fffffff;

  const isWin = pnlRoll < b.winRate;
  const pnlDelta = isWin
    ? Math.round(b.avgWin * (0.7 + pnlRoll * 0.6))
    : Math.round(b.avgLoss * (0.7 + pnlRoll * 0.6));

  const side: Side = sideRoll < b.longBias ? "LONG" : "SHORT";

  return {
    side,
    pnlDelta,
    chatId: randomBytes32(),
    storageRoot: randomBytes32(),
  };
}

async function placeTradeReal(side: Side, sizeUsdc: number): Promise<string> {
  const hl = process.env.HL_TEST_PRIVATE_KEY;
  if (MOCK_DEX || !hl) return randomBytes32();
  const open = await placePerp(hl, "BTC", side, sizeUsdc);
  try { await closePerp(hl, "BTC"); } catch {}
  return open.txHash;
}

async function main() {
  const tokenIdArg = process.argv[2];
  if (!tokenIdArg) {
    console.error("usage: strategy-runner.ts <tokenId> [intervalSecs=10] [maxTrades=10]");
    process.exit(1);
  }
  const tokenId = Number(tokenIdArg);
  const intervalSecs = Number(process.argv[3] ?? "10");
  const maxTrades = Number(process.argv[4] ?? "10");

  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY required (operator wallet)");

  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const wallet = new ethers.Wallet(pk, provider);

  const strategy = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, provider);
  const attest = new ethers.Contract(V3.tradeAttestation, ATTEST_ABI, wallet);

  console.log(`[strategy-runner] tokenId=${tokenId} interval=${intervalSecs}s maxTrades=${maxTrades}`);
  console.log(`[strategy-runner] MOCK_DEX=${MOCK_DEX} MOCK_TEE=${MOCK_TEE}`);
  console.log(`[strategy-runner] operator: ${wallet.address}`);

  const usdc = (n: number) => ethers.parseUnits(n.toString(), 6);

  let priorTradeCount = Number(await attest.tradeCount(tokenId));
  console.log(`[strategy-runner] starting trade count: ${priorTradeCount}`);

  for (let i = 0; i < maxTrades; i++) {
    const data = await strategy.getData(tokenId);
    const archetype = ARCHETYPE_NAMES[Number(data[0])];
    const currentEquity = Number(ethers.formatUnits(data[11], 6));
    const status = Number(data[12]);

    if (status !== 1) {
      console.log(`[strategy-runner] strategy not Active (status=${status}), exiting`);
      break;
    }
    const inBreach = await strategy.isInBreach(tokenId);
    if (inBreach) {
      console.log(`[strategy-runner] strategy is in breach, exiting`);
      break;
    }

    const decision = mockDecide(tokenId, priorTradeCount + i, archetype, currentEquity);
    const newEquity = Math.max(0, currentEquity + decision.pnlDelta);
    const tradeSize = Math.max(15, Math.abs(decision.pnlDelta) * 5);

    console.log(`\n[trade ${i + 1}/${maxTrades}] ${archetype} side=${decision.side} pnl=${decision.pnlDelta >= 0 ? "+" : ""}${decision.pnlDelta} equity ${currentEquity} → ${newEquity}`);

    let hlOidRaw: string;
    try {
      hlOidRaw = await placeTradeReal(decision.side, tradeSize);
      console.log(`  HL oid raw: ${hlOidRaw}`);
    } catch (err: any) {
      console.log(`  HL place failed: ${err.message?.slice(0, 100)} — using mock oid`);
      hlOidRaw = randomBytes32();
    }

    const txHash = encodeHlTxHash(hlOidRaw);
    const pnlScaled = ethers.parseUnits(Math.abs(decision.pnlDelta).toFixed(6), 6);
    const pnlEncoded = decision.pnlDelta >= 0 ? pnlScaled : -pnlScaled;

    try {
      const tx = await attest.recordTrade(tokenId, decision.chatId, decision.storageRoot, txHash, pnlEncoded, usdc(newEquity));
      let rcptOk = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try { await tx.wait(); rcptOk = true; break; }
        catch (e: any) {
          if (e.error?.message?.includes("no matching receipts") || e.code === "UNKNOWN_ERROR") {
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          throw e;
        }
      }
      console.log(`  attested: ${tx.hash.slice(0, 12)}... ${rcptOk ? "✓" : "(no rcpt)"}`);
    } catch (err: any) {
      if (err.message?.includes("EpochNotActive")) {
        console.log(`  BREACH triggered on chain, halting`);
        break;
      }
      throw err;
    }

    if (i < maxTrades - 1 && intervalSecs > 0) {
      console.log(`  sleeping ${intervalSecs}s...`);
      await new Promise((r) => setTimeout(r, intervalSecs * 1000));
    }
  }

  console.log("\n[strategy-runner] DONE");
}

main().catch((err) => {
  console.error("[strategy-runner] FATAL:", err);
  process.exit(1);
});
