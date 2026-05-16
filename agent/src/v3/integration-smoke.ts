/**
 * integration-smoke.ts — end-to-end Orichalcos v3 lifecycle smoke test.
 *
 * Drives the FULL protocol lifecycle on 0G Galileo against the deployed contracts
 * and asserts on-chain state at each step. This is the mainnet-migration smoke:
 * on deploy day, run this against the new chain — same assertions verify ABI
 * compatibility, event emission, and contract wiring.
 *
 * Lifecycle covered:
 *   1. Connect & verify chainId
 *   2. mintStrategy (new INFT)
 *   3. startEpoch (bond, drawdown cap, duration)
 *   4. recordTrade x3 (operator path; fabricated trade data — MOCK_DEX semantics)
 *   5. buyPolicy from a different wallet (auto-derived allocator)
 *   6. markBreach
 *   7. settleEpoch
 *   8. settleClaim (allocator pulls payout)
 *   9. Final report
 *
 * Run:
 *   ./node_modules/.bin/tsx src/v3/integration-smoke.ts
 *   pnpm run v3:integration
 *
 * Env:
 *   PRIVATE_KEY          deployer / trader / operator (required)
 *   ALLOCATOR_PRIVATE_KEY optional — otherwise derived from keccak256(PRIVATE_KEY || "allocator")
 *   RPC_URL              default https://evmrpc-testnet.0g.ai
 *   CHAIN_ID             default 16602
 */

import "dotenv/config";
import { ethers } from "ethers";

// ─────────────────────────── Config ───────────────────────────

const RPC_URL = process.env.RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 16602);
const GAS_PRICE = ethers.parseUnits("5", "gwei");

const V3 = {
  mockUsdc:         "0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7",
  strategyINFT:     "0x782CBD5313E3b99d9C94e4f5197B81a432cdE621",
  insurancePool:    "0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57",
  tradeAttestation: "0x892872eF9490683604EE53B90c5c21e1B4E6eeda",
};

const BOND_USDC = 100n * 1_000_000n;        // 100 USDC
const MAX_DRAWDOWN_BPS = 2000n;             // 20%
const EPOCH_DURATION_SECS = 86400n;         // 1 day
const MAX_CLAIM = 50n * 1_000_000n;         // 50 USDC
const PREMIUM = (MAX_CLAIM * 1250n) / 10_000n; // 6.25 USDC

// ─────────────────────────── ABIs ───────────────────────────

const USDC_ABI = [
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function mint(address,uint256)",
  "function decimals() view returns (uint8)",
];

const STRATEGY_ABI = [
  "function mint(address trader, uint8 archetype, bytes32 sealedSoulRoot, bytes32 metadataHash) returns (uint256)",
  "function startEpoch(uint256 tokenId, uint256 bondAmount, uint256 maxDrawdownBps, uint256 epochDurationSecs) returns (uint256)",
  "function markBreach(uint256 tokenId)",
  "function settleEpoch(uint256 tokenId)",
  "function ownerOf(uint256) view returns (address)",
  "function nextTokenId() view returns (uint256)",
  "function getData(uint256) view returns (tuple(uint8,bytes32,bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8))",
  "event StrategyMinted(uint256 indexed tokenId, address indexed trader, uint8 archetype, bytes32 sealedSoulRoot)",
  "event EpochStarted(uint256 indexed tokenId, uint256 indexed epochId, uint256 bondAmount, uint256 maxDrawdownBps, uint256 epochEndTs)",
  "event BreachMarked(uint256 indexed tokenId, uint256 indexed epochId, uint256 equityAtBreach, uint256 threshold)",
  "event EpochSettled(uint256 indexed tokenId, uint256 indexed epochId, uint256 toAllocators, uint256 toTrader)",
];

const ATTEST_ABI = [
  "function recordTrade(uint256,bytes32,bytes32,bytes32,int256,uint256) returns (uint256)",
  "function tradeCount(uint256) view returns (uint256)",
];

const POOL_ABI = [
  "function buyPolicy(uint256 strategyId, uint256 maxClaim) returns (uint256)",
  "function settleClaim(uint256 policyId) returns (uint256)",
  "function nextPolicyId() view returns (uint256)",
  "function allocatedCoverage(uint256,uint256) view returns (uint256)",
  "function getPolicy(uint256) view returns (tuple(uint256,uint256,address,uint256,uint256,uint8))",
  "function premiumBps() view returns (uint16)",
  "event PolicyBought(uint256 indexed policyId, uint256 indexed strategyId, uint256 indexed epochId, address allocator, uint256 premium, uint256 maxClaim)",
  "event PolicyClaimed(uint256 indexed policyId, address indexed allocator, uint256 paidOut)",
];

// ─────────────────────────── helpers ───────────────────────────

function randomBytes32(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

function usdc(n: bigint): string {
  return `${ethers.formatUnits(n, 6)} USDC`;
}

function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

interface StepCtx {
  txCount: number;
  totalGas: bigint;
}

async function send<T extends ethers.ContractTransactionResponse>(
  ctx: StepCtx,
  label: string,
  tx: Promise<T>,
): Promise<ethers.ContractTransactionReceipt> {
  const resp = await tx;
  const rcpt = await resp.wait();
  if (!rcpt) throw new Error(`${label}: no receipt`);
  ctx.txCount += 1;
  ctx.totalGas += rcpt.gasUsed;
  return rcpt;
}

// ─────────────────────────── main ───────────────────────────

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY env required");

  const ctx: StepCtx = { txCount: 0, totalGas: 0n };

  // ───── Step 1: Setup ─────
  console.log(`[step 1] connecting to ${RPC_URL}, expecting chainId=${CHAIN_ID}...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const deployer = new ethers.Wallet(pk, provider);
  const net = await provider.getNetwork();
  assert(net.chainId === BigInt(CHAIN_ID), `[step 1] expected chainId ${CHAIN_ID}, got ${net.chainId}`);

  // Derive allocator
  const allocPk = process.env.ALLOCATOR_PRIVATE_KEY
    ?? ethers.keccak256(ethers.toUtf8Bytes((pk.startsWith("0x") ? pk : "0x" + pk) + "allocator"));
  const allocator = new ethers.Wallet(allocPk, provider);
  console.log(`[step 1] deployer/trader/operator = ${deployer.address}`);
  console.log(`[step 1] allocator                = ${allocator.address}`);
  console.log(`[step 1] ✓ connected to chainId=${net.chainId} block=${await provider.getBlockNumber()}`);

  // Contracts bound to deployer
  const usdcD = new ethers.Contract(V3.mockUsdc, USDC_ABI, deployer);
  const strategyD = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, deployer);
  const attestD = new ethers.Contract(V3.tradeAttestation, ATTEST_ABI, deployer);
  const poolD = new ethers.Contract(V3.insurancePool, POOL_ABI, deployer);

  // Contracts bound to allocator
  const usdcA = new ethers.Contract(V3.mockUsdc, USDC_ABI, allocator);
  const poolA = new ethers.Contract(V3.insurancePool, POOL_ABI, allocator);

  const txOpts = { gasPrice: GAS_PRICE };

  // Fund allocator with native gas if needed (~0.005 0G is plenty for 3 txs at 5gwei)
  const allocNative = await provider.getBalance(allocator.address);
  const minNative = ethers.parseEther("0.003");
  if (allocNative < minNative) {
    console.log(`[step 1] allocator native bal=${ethers.formatEther(allocNative)} 0G — funding...`);
    const fundTx = await deployer.sendTransaction({
      to: allocator.address,
      value: ethers.parseEther("0.01"),
      gasPrice: GAS_PRICE,
    });
    const fundRcpt = await fundTx.wait();
    if (!fundRcpt) throw new Error("[step 1] fund tx no receipt");
    ctx.txCount += 1;
    ctx.totalGas += fundRcpt.gasUsed;
    console.log(`[step 1] funded allocator with 0.01 0G, tx=${fundRcpt.hash}`);
  }

  // ───── Step 2: Mint a new strategy ─────
  console.log(`\n[step 2] minting Stoic (archetype=3) strategy...`);
  const nextIdBefore: bigint = await strategyD.nextTokenId();
  const soul = randomBytes32();
  const meta = randomBytes32();
  const mintRcpt = await send(ctx, "mint", strategyD.mint(deployer.address, 3, soul, meta, txOpts));
  const mintedTopic = ethers.id("StrategyMinted(uint256,address,uint8,bytes32)");
  const mintLog = mintRcpt.logs.find((l: any) => l.topics?.[0] === mintedTopic);
  assert(!!mintLog, `[step 2] no StrategyMinted event in tx ${mintRcpt.hash}`);
  const tokenId = BigInt(mintLog!.topics[1]);
  const nextIdAfter: bigint = await strategyD.nextTokenId();
  const ownerAddr: string = await strategyD.ownerOf(tokenId);
  assert(
    ownerAddr.toLowerCase() === deployer.address.toLowerCase(),
    `[step 2] ownerOf(${tokenId}) = ${ownerAddr}, expected ${deployer.address}`,
  );
  assert(
    nextIdAfter === nextIdBefore + 1n,
    `[step 2] nextTokenId did not increment by 1: ${nextIdBefore} → ${nextIdAfter}`,
  );
  console.log(`[step 2] ✓ minted tokenId=${tokenId} (nextTokenId ${nextIdBefore} → ${nextIdAfter}) tx=${mintRcpt.hash}`);

  // ───── Step 3: Start epoch ─────
  console.log(`\n[step 3] startEpoch bond=${usdc(BOND_USDC)} drawdown=${MAX_DRAWDOWN_BPS}bps dur=${EPOCH_DURATION_SECS}s`);
  // Approve if needed
  const allowance: bigint = await usdcD.allowance(deployer.address, V3.strategyINFT);
  if (allowance < BOND_USDC) {
    const apRcpt = await send(ctx, "approve(strategyINFT)", usdcD.approve(V3.strategyINFT, BOND_USDC, txOpts));
    console.log(`[step 3]   approved StrategyINFT for bond, tx=${apRcpt.hash}`);
  }
  // Make sure deployer has USDC
  const dBal: bigint = await usdcD.balanceOf(deployer.address);
  if (dBal < BOND_USDC) {
    console.log(`[step 3]   minting ${usdc(BOND_USDC * 2n)} to deployer (current ${usdc(dBal)})`);
    const mRcpt = await send(ctx, "mint(usdc→deployer)", usdcD.mint(deployer.address, BOND_USDC * 2n, txOpts));
    console.log(`[step 3]   tx=${mRcpt.hash}`);
  }
  const startRcpt = await send(
    ctx,
    "startEpoch",
    strategyD.startEpoch(tokenId, BOND_USDC, MAX_DRAWDOWN_BPS, EPOCH_DURATION_SECS, txOpts),
  );
  const data1: any[] = await strategyD.getData(tokenId);
  const status1 = Number(data1[12]);
  const epochId: bigint = data1[5];
  const bondAmount: bigint = data1[7];
  const epochStartTs: bigint = data1[9];
  const epochEndTs: bigint = data1[10];
  assert(status1 === 1, `[step 3] expected status=Active(1), got ${status1}`);
  assert(bondAmount === BOND_USDC, `[step 3] bondAmount ${bondAmount} != ${BOND_USDC}`);
  assert(epochEndTs > epochStartTs, `[step 3] epochEndTs ${epochEndTs} not > epochStartTs ${epochStartTs}`);
  console.log(`[step 3] ✓ epoch ${epochId} Active, bond=${usdc(bondAmount)}, ends in ${epochEndTs - epochStartTs}s tx=${startRcpt.hash}`);

  // ───── Step 4: Record 3 trades ─────
  console.log(`\n[step 4] recording 3 trades (+5, +5, -100) to drive equity below threshold...`);
  const startingEquity = BOND_USDC; // 100 USDC
  const threshold = (BOND_USDC * (10_000n - MAX_DRAWDOWN_BPS)) / 10_000n; // 80 USDC
  const tradeDeltas = [5_000_000n, 5_000_000n, -100_000_000n];
  let runningEquity = startingEquity;
  const tcBefore: bigint = await attestD.tradeCount(tokenId);

  for (let i = 0; i < tradeDeltas.length; i++) {
    const delta = tradeDeltas[i];
    runningEquity = runningEquity + delta;
    // Floor at 0 since equityAfter is uint256
    const equityAfter = runningEquity < 0n ? 0n : runningEquity;
    const chatId = randomBytes32();
    const sroot = randomBytes32();
    const hlHash = randomBytes32();
    const tRcpt = await send(
      ctx,
      `recordTrade#${i + 1}`,
      attestD.recordTrade(tokenId, chatId, sroot, hlHash, delta, equityAfter, txOpts),
    );
    const tc: bigint = await attestD.tradeCount(tokenId);
    const expectedTc = tcBefore + BigInt(i + 1);
    assert(
      tc === expectedTc,
      `[step 4] expected tradeCount === ${expectedTc}, got ${tc} — TradeAttestation.recordTrade may have silently failed (caller is not operator?)`,
    );
    console.log(`[step 4]   trade #${i + 1}: Δ=${ethers.formatUnits(delta, 6)} equity→${usdc(equityAfter)} tradeCount=${tc} tx=${tRcpt.hash}`);
  }
  // Final equity check
  const data2: any[] = await strategyD.getData(tokenId);
  const finalEquity: bigint = data2[11];
  assert(
    finalEquity <= threshold,
    `[step 4] expected final equity ≤ threshold ${usdc(threshold)}, got ${usdc(finalEquity)} — last trade did not drive below threshold`,
  );
  console.log(`[step 4] ✓ final equity ${usdc(finalEquity)} ≤ threshold ${usdc(threshold)} (breach-ready)`);

  // ───── Step 5: Allocator buys policy ─────
  console.log(`\n[step 5] allocator buying policy maxClaim=${usdc(MAX_CLAIM)} premium=${usdc(PREMIUM)}`);
  // Mint USDC to allocator
  const allocBalBefore: bigint = await usdcA.balanceOf(allocator.address);
  if (allocBalBefore < PREMIUM) {
    // Use deployer to mint for allocator (one less native tx burden)
    const mRcpt = await send(ctx, "mint(usdc→allocator)", usdcD.mint(allocator.address, PREMIUM * 2n, txOpts));
    console.log(`[step 5]   minted ${usdc(PREMIUM * 2n)} to allocator, tx=${mRcpt.hash}`);
  }
  // Allocator approves pool
  const aApRcpt = await send(ctx, "approve(pool)", usdcA.approve(V3.insurancePool, PREMIUM, txOpts));
  console.log(`[step 5]   allocator approved pool, tx=${aApRcpt.hash}`);

  const nextPolBefore: bigint = await poolA.nextPolicyId();
  const allocBalPre: bigint = await usdcA.balanceOf(allocator.address);
  const buyRcpt = await send(ctx, "buyPolicy", poolA.buyPolicy(tokenId, MAX_CLAIM, txOpts));
  const nextPolAfter: bigint = await poolA.nextPolicyId();
  const policyId = nextPolBefore;
  const coverage: bigint = await poolA.allocatedCoverage(tokenId, epochId);
  const allocBalPost: bigint = await usdcA.balanceOf(allocator.address);
  assert(
    nextPolAfter === nextPolBefore + 1n,
    `[step 5] nextPolicyId did not increment: ${nextPolBefore} → ${nextPolAfter}`,
  );
  assert(
    coverage === MAX_CLAIM,
    `[step 5] allocatedCoverage(${tokenId},${epochId}) = ${coverage}, expected ${MAX_CLAIM}`,
  );
  assert(
    allocBalPre - allocBalPost === PREMIUM,
    `[step 5] allocator balance Δ = ${allocBalPre - allocBalPost}, expected ${PREMIUM}`,
  );
  console.log(`[step 5] ✓ policyId=${policyId} coverage=${usdc(coverage)} premium paid=${usdc(allocBalPre - allocBalPost)} tx=${buyRcpt.hash}`);

  // ───── Step 6: Mark breach ─────
  console.log(`\n[step 6] markBreach(${tokenId})...`);
  const breachRcpt = await send(ctx, "markBreach", strategyD.markBreach(tokenId, txOpts));
  const breachTopic = ethers.id("BreachMarked(uint256,uint256,uint256,uint256)");
  const breachLog = breachRcpt.logs.find((l: any) => l.topics?.[0] === breachTopic);
  assert(!!breachLog, `[step 6] no BreachMarked event`);
  const data3: any[] = await strategyD.getData(tokenId);
  const status3 = Number(data3[12]);
  assert(status3 === 2, `[step 6] expected status=Breached(2), got ${status3}`);
  console.log(`[step 6] ✓ status→Breached(2) tx=${breachRcpt.hash}`);

  // ───── Step 7: Settle epoch ─────
  // NOTE: per StrategyINFT.settleEpoch, the breach path internally calls
  // InsurancePool.settleClaim for each policy in the epoch — so the allocator
  // is paid out atomically during settleEpoch (push-on-settle). After settlement
  // the status is reset to Idle(0) (not Settled) to allow re-bonding on the next
  // epoch. Our asserts match the actual contract semantics.
  console.log(`\n[step 7] settleEpoch(${tokenId})...`);
  const allocBalPreSettle: bigint = await usdcA.balanceOf(allocator.address);
  const settleRcpt = await send(ctx, "settleEpoch", strategyD.settleEpoch(tokenId, txOpts));
  const settledTopic = ethers.id("EpochSettled(uint256,uint256,uint256,uint256)");
  const settledLog = settleRcpt.logs.find((l: any) => l.topics?.[0] === settledTopic);
  assert(!!settledLog, `[step 7] no EpochSettled event in tx ${settleRcpt.hash}`);
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "uint256"], settledLog!.data);
  const toAllocators: bigint = decoded[0];
  const toTrader: bigint = decoded[1];
  const data4: any[] = await strategyD.getData(tokenId);
  const status4 = Number(data4[12]);
  const bondAfter: bigint = data4[7];
  // settleEpoch resets to Idle(0) after distribution (re-bond-friendly design).
  assert(status4 === 0, `[step 7] expected status=Idle(0) after settle reset, got ${status4}`);
  assert(bondAfter === 0n, `[step 7] bondAmount after settle = ${bondAfter}, expected 0`);
  assert(
    toAllocators >= MAX_CLAIM,
    `[step 7] EpochSettled.toAllocators = ${toAllocators}, expected ≥ ${MAX_CLAIM}`,
  );
  assert(toTrader === 0n, `[step 7] EpochSettled.toTrader = ${toTrader}, expected 0 (breach path)`);
  console.log(`[step 7] ✓ Settled (status→Idle, bond=0). toAllocators=${usdc(toAllocators)} toTrader=${usdc(toTrader)} tx=${settleRcpt.hash}`);

  // ───── Step 8: Verify claim was settled atomically ─────
  // settleEpoch already invoked InsurancePool.settleClaim for our policy. We
  // verify the side effects: policy status === Claimed AND allocator balance
  // increased by maxClaim during the settleEpoch tx. A manual settleClaim()
  // call here would revert (policy not Active) — that's the contract working.
  console.log(`\n[step 8] verifying atomic claim payout from settleEpoch...`);
  const allocBalPostSettle: bigint = await usdcA.balanceOf(allocator.address);
  const policy: any[] = await poolA.getPolicy(policyId);
  const policyStatus = Number(policy[5]);
  const claimDelta = allocBalPostSettle - allocBalPreSettle;
  assert(policyStatus === 1, `[step 8] expected Policy.status=Claimed(1), got ${policyStatus}`);
  assert(
    claimDelta === MAX_CLAIM,
    `[step 8] allocator USDC Δ across settleEpoch = ${claimDelta}, expected ${MAX_CLAIM}`,
  );
  // Confirm a second settleClaim would revert (defense-in-depth: status check works)
  try {
    await poolA.settleClaim.staticCall(policyId);
    throw new Error(`[step 8] expected settleClaim(${policyId}) to revert (already Claimed) but it succeeded`);
  } catch (e: any) {
    if (e.message?.startsWith("[step 8] expected")) throw e;
    // Any revert is fine — contract rejects double-claim
  }
  console.log(`[step 8] ✓ policy ${policyId} status→Claimed, allocator received ${usdc(claimDelta)} atomically; double-claim correctly reverts`);

  // ───── Step 9: Report ─────
  const finalAllocBal: bigint = await usdcA.balanceOf(allocator.address);
  const pnl = MAX_CLAIM - PREMIUM; // 43.75 USDC profit
  console.log(`\n═══════════════ FINAL REPORT ═══════════════`);
  console.log(`tokenId:             ${tokenId}`);
  console.log(`policyId:            ${policyId}`);
  console.log(`epochId:             ${epochId}`);
  console.log(`tx count:            ${ctx.txCount}`);
  console.log(`total gas used:      ${ctx.totalGas}`);
  console.log(`final equity:        ${usdc(finalEquity)}`);
  console.log(`breach threshold:    ${usdc(threshold)}`);
  console.log(`toAllocators paid:   ${usdc(toAllocators)}`);
  console.log(`toTrader paid:       ${usdc(toTrader)}`);
  console.log(`allocator P&L:       +${usdc(pnl)} (claim ${usdc(MAX_CLAIM)} - premium ${usdc(PREMIUM)})`);
  console.log(`allocator final bal: ${usdc(finalAllocBal)}`);
  console.log(`settleEpoch tx hash: ${settleRcpt.hash}`);
  console.log(`═══════════════════════════════════════════`);
  console.log(`✓ ALL 9 STEPS PASSED — v3 lifecycle wired correctly on chainId=${CHAIN_ID}`);
}

main().catch((err) => {
  console.error("\n[integration-smoke] FAILED:");
  console.error(err?.stack || err);
  process.exit(1);
});
