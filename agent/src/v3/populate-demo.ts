/**
 * populate-demo.ts — one-shot demo data populator for Orichalcos v3.
 *
 * What this does (in one tx-stream against Galileo):
 *   1. Deployer mints 4 Strategy Agents (Bold / Patient / Sharp / Stoic)
 *   2. Deployer (acting as trader) starts an epoch for each — bond 1000 USDC,
 *      drawdown 20%, epoch duration = 1 day (short enough to settle in demo)
 *   3. Deployer (acting as LP1+LP2 via impersonation NOT possible on Galileo —
 *      so LPs must deposit themselves OR we use the deployer's USDC). For demo
 *      we use deployer as the "pool seeder" by approving + depositing as deployer.
 *   4. Allocators A + B buy policies on strategies #1 and #2 respectively.
 *      (We CAN'T impersonate them on a live testnet — they need their own keys.
 *       For demo data, deployer takes the allocator role for ONE policy via
 *       a separate keypair... or we just record-attest fake trades and let the
 *       allocator-buy flow happen FROM THE FRONTEND.)
 *   5. Records ~10 attested trades per strategy, mostly winning, with one
 *      strategy ending in a clear drawdown breach.
 *
 * v3 demo simplification: this script only does steps 1, 2, 5. LP deposit
 * and allocator buyPolicy happen through the frontend so tomorrow you can
 * see them happen live in a browser.
 *
 * Run:
 *   PRIVATE_KEY=0x... MOCK_DEX=true ./node_modules/.bin/tsx src/v3/populate-demo.ts
 *
 *   With real Hyperliquid (after funding HL wallet):
 *   PRIVATE_KEY=0x... HL_TEST_PRIVATE_KEY=0x... MOCK_DEX=false ./node_modules/.bin/tsx src/v3/populate-demo.ts
 */

import { ethers } from "ethers";
import { placePerp, getEquity, closePerp, type Asset, type Side } from "./hyperliquid.js";

// ─────────────────────────── Config ───────────────────────────

const RPC_URL = process.env.RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 16602);
const MOCK_DEX = process.env.MOCK_DEX === "true";

const V3 = {
  mockUsdc:         process.env.V3_MOCK_USDC         ?? "0x2F7296aebCBc5a8D67A65FA6BF09dD74c70bC60f",
  strategyINFT:     process.env.V3_STRATEGY_INFT     ?? "0x349D286aF27501d4119C11709bb48f4Ef9f50450",
  insurancePool:    process.env.V3_INSURANCE_POOL    ?? "0xdAe6c8DCE82f848e3b5a21320F0b8eeB655a0E91",
  tradeAttestation: process.env.V3_TRADE_ATTESTATION ?? "0x30Fc834477B15B0B3720D61A169FF5dFe4D7C742",
};

// USDC has 6 decimals
const usdc = (n: number) => ethers.parseUnits(n.toString(), 6);

// ─────────────────────────── ABIs (minimal — only what we call) ───────────────────────────

const STRATEGY_ABI = [
  "function mint(address trader, uint8 archetype, bytes32 sealedSoulRoot, bytes32 metadataHash) external returns (uint256)",
  "function startEpoch(uint256 tokenId, uint256 bondAmount, uint256 maxDrawdownBps, uint256 epochDurationSecs) external returns (uint256)",
  "function getData(uint256 tokenId) external view returns (tuple(uint8,bytes32,bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8))",
  "event StrategyMinted(uint256 indexed tokenId, address indexed trader, uint8 archetype, bytes32 sealedSoulRoot)",
  "event EpochStarted(uint256 indexed tokenId, uint256 indexed epochId, uint256 bondAmount, uint256 maxDrawdownBps, uint256 epochEndTs)",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address) external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
];

const ATTESTATION_ABI = [
  "function recordTrade(uint256 strategyId, bytes32 chatId, bytes32 storageRoot, bytes32 hyperliquidTxHash, int256 pnlDelta, uint256 equityAfter) external returns (uint256)",
];

// ─────────────────────────── Trade plans per archetype ───────────────────────────

interface TradePlan {
  archetype: number;            // 0=Bold, 1=Patient, 2=Sharp, 3=Stoic
  archetypeName: string;
  // Sequence of equity deltas in USDC (signed). Sum determines breach/no-breach.
  equityCurve: number[];
  willBreach: boolean;
}

// Bond = 1000 USDC, threshold = 800 (20% drawdown)
const BOND = 1000;

// Curves are *cumulative equity*, not deltas. equityAfter[i] is what gets attested.
const PLANS: TradePlan[] = [
  {
    archetype: 0, archetypeName: "Bold / Momentum",
    equityCurve: [1015, 1030, 1052, 1041, 1063, 1078, 1095, 1102, 1118, 1135],
    willBreach: false,
  },
  {
    archetype: 1, archetypeName: "Patient / Mean-Reversion",
    equityCurve: [990, 1005, 998, 1012, 1023, 1018, 1031, 1042, 1038, 1055],
    willBreach: false,
  },
  {
    archetype: 2, archetypeName: "Sharp / Microstructure",
    equityCurve: [1008, 1015, 1011, 1019, 1024, 1022, 1029, 1033, 1038, 1041],
    willBreach: false,
  },
  {
    archetype: 3, archetypeName: "Stoic / Grid (BREACHES)",
    // Drops from 1000 → 950 → 880 → 820 → 790 (breach at trade 4: 790 ≤ 800)
    equityCurve: [978, 950, 920, 880, 845, 820, 805, 790, 790, 790],
    willBreach: true,
  },
];

// ─────────────────────────── helpers ───────────────────────────

function randomBytes32(): string {
  return "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
}

async function placeRealOrMockTrade(
  hlPrivateKey: string | undefined,
  asset: Asset,
  side: Side,
  sizeUsdc: number
): Promise<{ txHash: string; fillPrice: number }> {
  if (MOCK_DEX || !hlPrivateKey) {
    return {
      txHash: randomBytes32(),
      fillPrice: asset === "BTC" ? 60_000 + (Math.random() - 0.5) * 200 : 3_000 + (Math.random() - 0.5) * 20,
    };
  }
  return placePerp(hlPrivateKey, asset, side, sizeUsdc);
}

// ─────────────────────────── main ───────────────────────────

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY env var required");

  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const wallet = new ethers.Wallet(pk, provider);
  console.log(`[populate-demo] deployer/operator: ${wallet.address}`);
  console.log(`[populate-demo] MOCK_DEX=${MOCK_DEX}`);

  const strategy = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, wallet);
  const usdcC    = new ethers.Contract(V3.mockUsdc, USDC_ABI, wallet);
  const attest   = new ethers.Contract(V3.tradeAttestation, ATTESTATION_ABI, wallet);

  // Idempotency guard: don't mint more strategies if 4+ already exist on this contract.
  // Override with FORCE_REMINT=true.
  const STRATEGY_READ_ABI = ["function nextTokenId() view returns (uint256)"];
  const sRead = new ethers.Contract(V3.strategyINFT, STRATEGY_READ_ABI, provider);
  const nextId = await sRead.nextTokenId();
  const existingStrategies = Number(nextId) - 1;
  if (existingStrategies >= 4 && process.env.FORCE_REMINT !== "true") {
    console.error(`[populate-demo] ABORT: ${existingStrategies} strategies already on chain.`);
    console.error(`Re-running would mint duplicates. Either:`);
    console.error(`  1. Use src/v3/force-breach.ts <tokenId> to trigger a fresh breach on existing strategy`);
    console.error(`  2. Set FORCE_REMINT=true to mint anyway (creates parallel set, not recommended)`);
    console.error(`  3. Re-deploy contracts (forge script script/v3/DeployGalileo.s.sol)`);
    process.exit(1);
  }

  const usdcBal = await usdcC.balanceOf(wallet.address);
  console.log(`[populate-demo] deployer USDC: ${ethers.formatUnits(usdcBal, 6)}`);

  // Approve strategy contract to pull bond × 4 strategies
  console.log("[populate-demo] approving StrategyINFT to pull USDC...");
  const approveTx = await usdcC.approve(V3.strategyINFT, usdc(BOND * 4));
  await approveTx.wait();

  const tokenIds: number[] = [];

  // 1) Mint + startEpoch for each of the 4 strategies
  for (const plan of PLANS) {
    console.log(`\n[populate-demo] minting ${plan.archetypeName}...`);
    const soul = randomBytes32();
    const meta = randomBytes32();
    const mintTx = await strategy.mint(wallet.address, plan.archetype, soul, meta);
    const mintRcpt = await mintTx.wait();
    // Parse StrategyMinted event for tokenId
    const mintLog = mintRcpt!.logs.find((l: any) => l.topics?.[0] === ethers.id("StrategyMinted(uint256,address,uint8,bytes32)"));
    const tokenId = Number(BigInt(mintLog!.topics[1]));
    tokenIds.push(tokenId);
    console.log(`  tokenId=${tokenId}, tx=${mintRcpt!.hash}`);

    console.log(`[populate-demo] starting epoch (bond=${BOND}, drawdown=20%, dur=1day)...`);
    const startTx = await strategy.startEpoch(tokenId, usdc(BOND), 2000, 24 * 60 * 60);
    const startRcpt = await startTx.wait();
    console.log(`  epoch started, tx=${startRcpt!.hash}`);
  }

  // 2) Record ~10 trades per strategy from the plan
  console.log("\n[populate-demo] recording attested trades...");
  for (let i = 0; i < PLANS.length; i++) {
    const plan = PLANS[i];
    const tokenId = tokenIds[i];
    console.log(`\n--- ${plan.archetypeName} (tokenId=${tokenId}) ---`);

    let prevEquity = BOND;
    for (let t = 0; t < plan.equityCurve.length; t++) {
      const equityAfter = plan.equityCurve[t];
      const pnlDelta = equityAfter - prevEquity;
      const side: Side = pnlDelta >= 0 ? "LONG" : "SHORT";
      const tradeSize = Math.max(10, Math.abs(pnlDelta) * 5);

      const hlResult = await placeRealOrMockTrade(process.env.HL_TEST_PRIVATE_KEY, "BTC", side, tradeSize);

      // chatId, storageRoot are mock for v3 demo populator (real flow has TEE + 0G Storage)
      const chatId = randomBytes32();
      const storageRoot = randomBytes32();
      // Encode pnlDelta as int256 with 6 decimals
      const pnlScaled = ethers.parseUnits(pnlDelta.toFixed(6), 6);
      // Negate manually for negatives via BigInt math
      const pnlEncoded = pnlDelta >= 0 ? pnlScaled : -pnlScaled;

      try {
        const txHash = hlResult.txHash.startsWith("0x") && hlResult.txHash.length === 66
          ? hlResult.txHash
          : ethers.keccak256(ethers.toUtf8Bytes(hlResult.txHash)); // hash oid string to bytes32

        const tx = await attest.recordTrade(
          tokenId, chatId, storageRoot, txHash, pnlEncoded, usdc(equityAfter)
        );
        await tx.wait();
        console.log(`  trade ${t + 1}/10: equity ${prevEquity} → ${equityAfter} (pnl ${pnlDelta >= 0 ? "+" : ""}${pnlDelta}) tx=${tx.hash.slice(0, 10)}...`);
      } catch (err: any) {
        // If breach already fired (status != Active), stop trading on this strategy
        if (err.message?.includes("EpochNotActive") || err.message?.includes("0x7c97c5d8")) {
          console.log(`  trade ${t + 1}/10: BREACH detected by contract, halting trades for this strategy ✓`);
          break;
        }
        throw err;
      }
      prevEquity = equityAfter;
    }
  }

  console.log("\n[populate-demo] DONE.");
  console.log("Token IDs:", tokenIds);
  console.log("Open the frontend to interact with these strategies.");
}

main().catch((err) => {
  console.error("[populate-demo] FATAL:", err);
  process.exit(1);
});
