/**
 * force-breach.ts — record a single attested trade that drops a strategy
 * into breach state (equity ≤ threshold).
 *
 * Use case: demo recovery when populate-demo was run multiple times and the
 * original breach state got overwritten. Also useful for live demo recording —
 * trigger a breach on a specific strategy moments before settling.
 *
 * Usage:
 *   PRIVATE_KEY=0x... ./node_modules/.bin/tsx src/v3/force-breach.ts <tokenId> [equity]
 *   defaults: equity = startingBond * (10000 - drawdownBps) / 10000 - 10
 */

import { ethers } from "ethers";

const V3 = {
  strategyINFT:     "0x349D286aF27501d4119C11709bb48f4Ef9f50450",
  tradeAttestation: "0x30Fc834477B15B0B3720D61A169FF5dFe4D7C742",
};

const STRATEGY_ABI = [
  "function getData(uint256) view returns (tuple(uint8,bytes32,bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8))",
];
const ATTEST_ABI = [
  "function recordTrade(uint256,bytes32,bytes32,bytes32,int256,uint256) returns (uint256)",
];

function randomBytes32(): string {
  return "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
}

async function main() {
  const tokenIdArg = process.argv[2];
  const equityArg = process.argv[3];
  if (!tokenIdArg) {
    console.error("usage: force-breach.ts <tokenId> [equityAfter]");
    process.exit(1);
  }
  const tokenId = BigInt(tokenIdArg);

  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY required");

  const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai", 16602);
  const wallet = new ethers.Wallet(pk, provider);

  const strategy = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, provider);
  const attest = new ethers.Contract(V3.tradeAttestation, ATTEST_ABI, wallet);

  const data = await strategy.getData(tokenId);
  // Tuple positions: (0)archetype (1)soulRoot (2)metaHash (3)mintedBy (4)mintedAt
  //                  (5)currentEpochId (6)startingBond (7)bondAmount (8)maxDrawdownBps
  //                  (9)epochStartTs (10)epochEndTs (11)currentEquity (12)status
  const startingBond = data[6];
  const drawdownBps = Number(data[8]);
  const currentEquity = data[11];
  const status = Number(data[12]);
  const statusName = ["Idle", "Active", "Breached", "Settled"][status];

  console.log(`Strategy #${tokenId} status=${statusName} startingBond=${ethers.formatUnits(startingBond, 6)} drawdown=${drawdownBps}bps currentEquity=${ethers.formatUnits(currentEquity, 6)}`);

  if (status !== 1) {
    console.error(`Strategy #${tokenId} is ${statusName}, must be Active to force breach.`);
    process.exit(1);
  }

  const threshold = (startingBond * BigInt(10_000 - drawdownBps)) / 10_000n;
  let target: bigint;
  if (equityArg) {
    target = ethers.parseUnits(equityArg, 6);
  } else {
    // Drop equity to threshold - 10 USDC
    target = threshold - 10_000_000n;
  }

  if (target > threshold) {
    console.error(`Target equity ${ethers.formatUnits(target, 6)} > threshold ${ethers.formatUnits(threshold, 6)} — would not trigger breach.`);
    process.exit(1);
  }

  const pnlDelta = target - currentEquity; // signed
  console.log(`\nForcing equity ${ethers.formatUnits(currentEquity, 6)} → ${ethers.formatUnits(target, 6)} (pnl ${pnlDelta >= 0n ? "+" : ""}${ethers.formatUnits(pnlDelta, 6)})`);
  console.log(`Breach threshold: ${ethers.formatUnits(threshold, 6)} → ${target <= threshold ? "✓ will trigger breach" : "✗ will NOT trigger breach"}`);

  const chatId = randomBytes32();
  const storageRoot = randomBytes32();
  const txHash = randomBytes32();

  console.log("\nSending recordTrade...");
  const tx = await attest.recordTrade(tokenId, chatId, storageRoot, txHash, pnlDelta, target);
  console.log(`tx: ${tx.hash}`);
  const rcpt = await tx.wait();
  console.log(`mined in block ${rcpt!.blockNumber}`);
  console.log(`\nStrategy #${tokenId} should now be in BREACH state. Call markBreach() from the frontend.`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
