/**
 * demo-scenarios.ts — runs Scenarios A, B, C end-to-end on Galileo testnet.
 *
 * Scenario A: trader keeps promise (clean settle, premium splits 60/40).
 * Scenario B: trader breaks promise (breach path, allocator paid from bond).
 * Scenario C: LP deposit + withdraw against InsurancePool.
 *
 * All HL fills are real (MOCK_DEX=false implicitly — we call placePerp directly).
 * Each tx hash is captured and printed at the end as a markdown table.
 *
 * Run:
 *   PRIVATE_KEY=0x... HL_TEST_PRIVATE_KEY=0x... \
 *     ./node_modules/.bin/tsx src/v3/demo-scenarios.ts [scenario]
 *
 *   scenario = "A" | "B" | "C" | "all" (default: all)
 */

import "dotenv/config";
import { ethers } from "ethers";
import { placePerp, closePerp, type Side } from "./hyperliquid.js";

const RPC_URL = process.env.RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 16602);
const GAS_PRICE = ethers.parseUnits("5", "gwei");

const V3 = {
  mockUsdc:         "0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7",
  strategyINFT:     "0x782CBD5313E3b99d9C94e4f5197B81a432cdE621",
  insurancePool:    "0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57",
  tradeAttestation: "0x892872eF9490683604EE53B90c5c21e1B4E6eeda",
  mockYieldVault:   "0x5c16FeF4d883A489525469e5f61B222328022fE1",
};

const USDC_ABI = [
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function mint(address,uint256)",
];
const STRATEGY_ABI = [
  "function mint(address,uint8,bytes32,bytes32) returns (uint256)",
  "function startEpoch(uint256,uint256,uint256,uint256) returns (uint256)",
  "function markBreach(uint256)",
  "function settleEpoch(uint256)",
  "function ownerOf(uint256) view returns (address)",
  "function nextTokenId() view returns (uint256)",
  "function getData(uint256) view returns (tuple(uint8,bytes32,bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8))",
  "event StrategyMinted(uint256 indexed tokenId, address indexed trader, uint8 archetype, bytes32 sealedSoulRoot)",
  "event EpochSettled(uint256 indexed tokenId, uint256 indexed epochId, uint256 toAllocators, uint256 toTrader)",
];
const ATTEST_ABI = [
  "function recordTrade(uint256,bytes32,bytes32,bytes32,int256,uint256) returns (uint256)",
  "function tradeCount(uint256) view returns (uint256)",
];
const POOL_ABI = [
  "function buyPolicy(uint256,uint256) returns (uint256)",
  "function deposit(uint256) returns (uint256)",
  "function withdraw(uint256) returns (uint256)",
  "function totalAssets() view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function lpShares(address) view returns (uint256)",
  "function nextPolicyId() view returns (uint256)",
  "function getPolicy(uint256) view returns (tuple(uint256,uint256,address,uint256,uint256,uint8))",
  "event PolicyBought(uint256 indexed policyId, uint256 indexed strategyId, uint256 indexed epochId, address allocator, uint256 premium, uint256 maxClaim)",
  "event PolicyExpired(uint256 indexed policyId, uint256 premiumToLP, uint256 premiumToTrader)",
  "event PolicyClaimed(uint256 indexed policyId, address indexed allocator, uint256 paidOut)",
];

const BOND_USDC = 100n * 1_000_000n;
const MAX_DRAWDOWN_BPS = 2000n;
const EPOCH_DURATION_SECS = 600n; // 10 minutes
const MAX_CLAIM = 50n * 1_000_000n;
const PREMIUM = (MAX_CLAIM * 1250n) / 10_000n;
const LP_DEPOSIT = 1000n * 1_000_000n;

const ARCH = { Bold: 0, Patient: 1, Sharp: 2, Stoic: 3 };

function rb32(): string { return ethers.hexlify(ethers.randomBytes(32)); }
function usdc(n: bigint): string { return `${ethers.formatUnits(n, 6)} USDC`; }
function assert(c: boolean, m: string): asserts c { if (!c) throw new Error(m); }

interface TxRow { scenario: string; step: string; hash: string; gas?: bigint; note?: string; }
const TX_LOG: TxRow[] = [];

async function send(
  scenario: string,
  step: string,
  txp: Promise<ethers.ContractTransactionResponse>,
  note?: string,
): Promise<ethers.ContractTransactionReceipt> {
  const resp = await txp;
  const rcpt = await resp.wait();
  if (!rcpt) throw new Error(`${step}: no receipt`);
  TX_LOG.push({ scenario, step, hash: rcpt.hash, gas: rcpt.gasUsed, note });
  console.log(`  ✓ ${step}: ${rcpt.hash}${note ? ` (${note})` : ""}`);
  return rcpt;
}

async function placeHlFill(side: Side, sizeUsdc: number, scenario: string, label: string): Promise<{ ok: boolean; hash: string }> {
  const hl = process.env.HL_TEST_PRIVATE_KEY;
  if (!hl) return { ok: false, hash: rb32() };
  try {
    const open = await placePerp(hl, "BTC", side, sizeUsdc);
    try { await closePerp(hl, "BTC"); } catch {}
    if (open.txHash && open.txHash.startsWith("0x") && open.txHash.length === 66) {
      console.log(`  ✓ HL ${label}: ${side} $${sizeUsdc} → ${open.txHash}`);
      TX_LOG.push({ scenario, step: `HL-${label}`, hash: open.txHash, note: `${side} $${sizeUsdc}` });
      return { ok: true, hash: open.txHash };
    }
    console.log(`  ⚠ HL ${label}: returned non-hash ${open.txHash} — using random bytes32 for attestation`);
    return { ok: false, hash: rb32() };
  } catch (err: any) {
    console.log(`  ⚠ HL ${label} failed: ${err.message?.slice(0, 120)} — using random bytes32`);
    return { ok: false, hash: rb32() };
  }
}

async function ensureUsdc(usdcD: ethers.Contract, target: string, minBal: bigint, scenario: string, label: string) {
  const bal: bigint = await usdcD.balanceOf(target);
  if (bal < minBal) {
    const need = minBal * 2n;
    console.log(`  minting ${usdc(need)} → ${target.slice(0, 10)}`);
    await send(scenario, `mint(usdc→${label})`, usdcD.mint(target, need, { gasPrice: GAS_PRICE }));
  }
}

async function ensureNative(provider: ethers.JsonRpcProvider, deployer: ethers.Wallet, target: string, min: bigint, scenario: string, label: string) {
  const bal = await provider.getBalance(target);
  if (bal < min) {
    console.log(`  funding native → ${target.slice(0, 10)}`);
    const r = await deployer.sendTransaction({ to: target, value: ethers.parseEther("0.01"), gasPrice: GAS_PRICE });
    const rc = await r.wait();
    if (rc) TX_LOG.push({ scenario, step: `fund-native(${label})`, hash: rc.hash, gas: rc.gasUsed });
  }
}

// ───────────────────────────────────────────────────────────────
// Scenario A — trader keeps promise (kept-promise settle)
// ───────────────────────────────────────────────────────────────

async function runScenarioA(deployer: ethers.Wallet, allocator: ethers.Wallet, provider: ethers.JsonRpcProvider): Promise<bigint> {
  console.log("\n═══════════════ SCENARIO A — kept promise ═══════════════");
  const usdcD = new ethers.Contract(V3.mockUsdc, USDC_ABI, deployer);
  const strategyD = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, deployer);
  const attestD = new ethers.Contract(V3.tradeAttestation, ATTEST_ABI, deployer);
  const poolA_alloc = new ethers.Contract(V3.insurancePool, POOL_ABI, allocator);
  const usdcA_alloc = new ethers.Contract(V3.mockUsdc, USDC_ABI, allocator);

  // Mint Sharp archetype (small wins, stays above threshold)
  console.log("\n[A1] mint Sharp strategy");
  const mintRcpt = await send("A", "mint", strategyD.mint(deployer.address, ARCH.Sharp, rb32(), rb32(), { gasPrice: GAS_PRICE }));
  const mintTopic = ethers.id("StrategyMinted(uint256,address,uint8,bytes32)");
  const mintLog = mintRcpt.logs.find((l: any) => l.topics?.[0] === mintTopic);
  assert(!!mintLog, "no StrategyMinted");
  const tokenId = BigInt(mintLog!.topics[1]);
  console.log(`  tokenId=${tokenId}`);

  // Approve + start epoch
  await ensureUsdc(usdcD, deployer.address, BOND_USDC * 3n, "A", "deployer");
  const allowance: bigint = await usdcD.allowance(deployer.address, V3.strategyINFT);
  if (allowance < BOND_USDC) {
    await send("A", "approve(strategyINFT)", usdcD.approve(V3.strategyINFT, BOND_USDC * 10n, { gasPrice: GAS_PRICE }));
  }
  console.log(`\n[A2] startEpoch bond=${usdc(BOND_USDC)} drawdown=20% dur=${EPOCH_DURATION_SECS}s`);
  await send("A", "startEpoch", strategyD.startEpoch(tokenId, BOND_USDC, MAX_DRAWDOWN_BPS, EPOCH_DURATION_SECS, { gasPrice: GAS_PRICE }));
  const data1: any[] = await strategyD.getData(tokenId);
  const epochId: bigint = data1[5];
  const epochEndTs: bigint = data1[10];
  const epochStartTs: bigint = data1[9];
  console.log(`  epochId=${epochId} ends @ ${epochEndTs} (in ${epochEndTs - epochStartTs}s)`);

  // Real HL fills + record three small wins (+5, +3, +4 = +12 → equity 112, stays above 80)
  console.log("\n[A3] 3 real HL fills + recordTrade attestations (small wins)");
  const aDeltas = [5_000_000n, 3_000_000n, 4_000_000n];
  let eq = BOND_USDC;
  for (let i = 0; i < aDeltas.length; i++) {
    const delta = aDeltas[i];
    eq += delta;
    const side: Side = delta >= 0n ? "LONG" : "SHORT";
    const fill = await placeHlFill(side, 12, "A", `trade${i + 1}`);
    await send("A", `recordTrade#${i + 1}`,
      attestD.recordTrade(tokenId, rb32(), rb32(), fill.hash, delta, eq, { gasPrice: GAS_PRICE }),
      `Δ=${ethers.formatUnits(delta, 6)} equity=${usdc(eq)}${fill.ok ? " HL-real" : " HL-mock-fallback"}`);
  }

  // Allocator buys policy
  console.log("\n[A4] allocator buys policy");
  await ensureNative(provider, deployer, allocator.address, ethers.parseEther("0.005"), "A", "allocator");
  await ensureUsdc(usdcD, allocator.address, PREMIUM * 4n, "A", "allocator");
  const apl: bigint = await usdcA_alloc.allowance(allocator.address, V3.insurancePool);
  if (apl < PREMIUM) {
    await send("A", "approve(pool)", usdcA_alloc.approve(V3.insurancePool, PREMIUM * 10n, { gasPrice: GAS_PRICE }));
  }
  const polBefore: bigint = await poolA_alloc.nextPolicyId();
  await send("A", "buyPolicy", poolA_alloc.buyPolicy(tokenId, MAX_CLAIM, { gasPrice: GAS_PRICE }),
    `policyId=${polBefore} premium=${usdc(PREMIUM)} maxClaim=${usdc(MAX_CLAIM)}`);
  const policyId = polBefore;

  // Wait for epoch end then settleEpoch (kept promise = expirePolicy 60/40 split)
  const nowSec = Math.floor(Date.now() / 1000);
  const remaining = Number(epochEndTs) - nowSec + 10;
  if (remaining > 0) {
    console.log(`\n[A5] waiting ${remaining}s for epoch to expire (kept promise path)...`);
    console.log(`     ${new Date(Number(epochEndTs) * 1000).toISOString()} target`);
    await new Promise((r) => setTimeout(r, remaining * 1000));
  }

  console.log(`\n[A6] settleEpoch(${tokenId}) — clean settle, expirePolicy splits premium 60/40`);
  const allocBalPre: bigint = await usdcA_alloc.balanceOf(allocator.address);
  const deployerBalPre: bigint = await usdcD.balanceOf(deployer.address);
  const settleRcpt = await send("A", "settleEpoch", strategyD.settleEpoch(tokenId, { gasPrice: GAS_PRICE }));
  // Find PolicyExpired event for premium split detail
  const polExpTopic = ethers.id("PolicyExpired(uint256,uint256,uint256)");
  const polExpLog = settleRcpt.logs.find((l: any) => l.topics?.[0] === polExpTopic);
  if (polExpLog) {
    const dec = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "uint256"], polExpLog.data);
    const toLP: bigint = dec[0];
    const toTrader: bigint = dec[1];
    console.log(`  PolicyExpired: premiumToLP=${usdc(toLP)} premiumToTrader=${usdc(toTrader)}`);
    TX_LOG.push({ scenario: "A", step: "EVENT:PolicyExpired", hash: settleRcpt.hash, note: `LP=${usdc(toLP)} Trader=${usdc(toTrader)}` });
  }
  const allocBalPost: bigint = await usdcA_alloc.balanceOf(allocator.address);
  const deployerBalPost: bigint = await usdcD.balanceOf(deployer.address);
  console.log(`  allocator Δ = ${usdc(allocBalPost - allocBalPre)} (policy expired worthless)`);
  console.log(`  trader Δ    = ${usdc(deployerBalPost - deployerBalPre)} (bond back + 60% premium)`);

  return tokenId;
}

// ───────────────────────────────────────────────────────────────
// Scenario B — trader breaks promise (breach)
// ───────────────────────────────────────────────────────────────

async function runScenarioB(deployer: ethers.Wallet, allocator: ethers.Wallet, provider: ethers.JsonRpcProvider): Promise<bigint> {
  console.log("\n═══════════════ SCENARIO B — broken promise (breach) ═══════════════");
  const usdcD = new ethers.Contract(V3.mockUsdc, USDC_ABI, deployer);
  const strategyD = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, deployer);
  const attestD = new ethers.Contract(V3.tradeAttestation, ATTEST_ABI, deployer);
  const poolB_alloc = new ethers.Contract(V3.insurancePool, POOL_ABI, allocator);
  const usdcB_alloc = new ethers.Contract(V3.mockUsdc, USDC_ABI, allocator);

  console.log("\n[B1] mint Stoic strategy (bad-on-purpose archetype)");
  const mintRcpt = await send("B", "mint", strategyD.mint(deployer.address, ARCH.Stoic, rb32(), rb32(), { gasPrice: GAS_PRICE }));
  const mintTopic = ethers.id("StrategyMinted(uint256,address,uint8,bytes32)");
  const mintLog = mintRcpt.logs.find((l: any) => l.topics?.[0] === mintTopic);
  const tokenId = BigInt(mintLog!.topics[1]);
  console.log(`  tokenId=${tokenId}`);

  await ensureUsdc(usdcD, deployer.address, BOND_USDC * 3n, "B", "deployer");
  console.log(`\n[B2] startEpoch bond=${usdc(BOND_USDC)} drawdown=20% dur=${EPOCH_DURATION_SECS}s`);
  await send("B", "startEpoch", strategyD.startEpoch(tokenId, BOND_USDC, MAX_DRAWDOWN_BPS, EPOCH_DURATION_SECS, { gasPrice: GAS_PRICE }));

  // 3 real HL fills, then drive equity below threshold via -100 final loss
  console.log("\n[B3] 3 real HL fills + recordTrade (drive equity to 10 USDC, below 80 threshold)");
  const bDeltas = [5_000_000n, 5_000_000n, -100_000_000n];
  let eq = BOND_USDC;
  for (let i = 0; i < bDeltas.length; i++) {
    const delta = bDeltas[i];
    const next = eq + delta;
    eq = next < 0n ? 0n : next;
    const side: Side = delta >= 0n ? "LONG" : "SHORT";
    const size = delta < 0n ? 25 : 12; // capped for HL budget
    const fill = await placeHlFill(side, size, "B", `trade${i + 1}`);
    await send("B", `recordTrade#${i + 1}`,
      attestD.recordTrade(tokenId, rb32(), rb32(), fill.hash, delta, eq, { gasPrice: GAS_PRICE }),
      `Δ=${ethers.formatUnits(delta, 6)} equity=${usdc(eq)}${fill.ok ? " HL-real" : " HL-mock-fallback"}`);
  }

  // Allocator buys
  console.log("\n[B4] allocator buys policy on the failing strategy");
  await ensureNative(provider, deployer, allocator.address, ethers.parseEther("0.005"), "B", "allocator");
  await ensureUsdc(usdcD, allocator.address, PREMIUM * 4n, "B", "allocator");
  const apl: bigint = await usdcB_alloc.allowance(allocator.address, V3.insurancePool);
  if (apl < PREMIUM) {
    await send("B", "approve(pool)", usdcB_alloc.approve(V3.insurancePool, PREMIUM * 10n, { gasPrice: GAS_PRICE }));
  }
  const polBefore: bigint = await poolB_alloc.nextPolicyId();
  await send("B", "buyPolicy", poolB_alloc.buyPolicy(tokenId, MAX_CLAIM, { gasPrice: GAS_PRICE }),
    `policyId=${polBefore} premium=${usdc(PREMIUM)}`);

  console.log(`\n[B5] markBreach(${tokenId})`);
  await send("B", "markBreach", strategyD.markBreach(tokenId, { gasPrice: GAS_PRICE }));

  console.log(`\n[B6] settleEpoch(${tokenId}) — breach path, allocator paid from bond`);
  const allocBalPre: bigint = await usdcB_alloc.balanceOf(allocator.address);
  const settleRcpt = await send("B", "settleEpoch", strategyD.settleEpoch(tokenId, { gasPrice: GAS_PRICE }));
  const settledTopic = ethers.id("EpochSettled(uint256,uint256,uint256,uint256)");
  const settledLog = settleRcpt.logs.find((l: any) => l.topics?.[0] === settledTopic);
  if (settledLog) {
    const dec = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "uint256"], settledLog.data);
    console.log(`  EpochSettled: toAllocators=${usdc(dec[0])} toTrader=${usdc(dec[1])}`);
    TX_LOG.push({ scenario: "B", step: "EVENT:EpochSettled", hash: settleRcpt.hash, note: `Alloc=${usdc(dec[0])} Trader=${usdc(dec[1])}` });
  }
  const allocBalPost: bigint = await usdcB_alloc.balanceOf(allocator.address);
  console.log(`  allocator Δ = ${usdc(allocBalPost - allocBalPre)} (claim paid out)`);
  return tokenId;
}

// ───────────────────────────────────────────────────────────────
// Scenario C — LP deposit + withdraw
// ───────────────────────────────────────────────────────────────

async function runScenarioC(deployer: ethers.Wallet, provider: ethers.JsonRpcProvider): Promise<void> {
  console.log("\n═══════════════ SCENARIO C — LP deposit + withdraw ═══════════════");
  const usdcD = new ethers.Contract(V3.mockUsdc, USDC_ABI, deployer);
  const poolD = new ethers.Contract(V3.insurancePool, POOL_ABI, deployer);

  // Fresh LP wallet: derive from deployer key + "lp-scenarioC" seed
  const pk = process.env.PRIVATE_KEY!;
  const lpPk = ethers.keccak256(ethers.toUtf8Bytes((pk.startsWith("0x") ? pk : "0x" + pk) + "lp-scenarioC"));
  const lp = new ethers.Wallet(lpPk, provider);
  console.log(`[C0] LP wallet = ${lp.address}`);

  await ensureNative(provider, deployer, lp.address, ethers.parseEther("0.005"), "C", "lp");
  await ensureUsdc(usdcD, lp.address, LP_DEPOSIT * 2n, "C", "lp");

  const usdcLP = new ethers.Contract(V3.mockUsdc, USDC_ABI, lp);
  const poolLP = new ethers.Contract(V3.insurancePool, POOL_ABI, lp);

  // Snapshot pool
  const taBefore: bigint = await poolD.totalAssets();
  const tsBefore: bigint = await poolD.totalShares();
  console.log(`\n[C1] pool snapshot BEFORE deposit: totalAssets=${usdc(taBefore)}, totalShares=${ethers.formatUnits(tsBefore, 6)}`);

  // Approve + deposit
  await send("C", "approve(pool)", usdcLP.approve(V3.insurancePool, LP_DEPOSIT * 10n, { gasPrice: GAS_PRICE }));
  console.log(`\n[C2] deposit ${usdc(LP_DEPOSIT)}`);
  await send("C", "deposit", poolLP.deposit(LP_DEPOSIT, { gasPrice: GAS_PRICE }));
  const shares: bigint = await poolD.lpShares(lp.address);
  const taAfter: bigint = await poolD.totalAssets();
  console.log(`  shares received = ${ethers.formatUnits(shares, 6)}`);
  console.log(`  pool totalAssets ${usdc(taBefore)} → ${usdc(taAfter)} (Δ=${usdc(taAfter - taBefore)})`);

  // Partial withdraw — 50% of shares
  const halfShares = shares / 2n;
  console.log(`\n[C3] withdraw 50% shares (${ethers.formatUnits(halfShares, 6)})`);
  const balPre: bigint = await usdcD.balanceOf(lp.address);
  await send("C", "withdraw", poolLP.withdraw(halfShares, { gasPrice: GAS_PRICE }));
  const balPost: bigint = await usdcD.balanceOf(lp.address);
  console.log(`  LP USDC Δ = ${usdc(balPost - balPre)} (burn-ratio: half-shares back to ~half-deposit)`);
}

// ───────────────────────────────────────────────────────────────
// main
// ───────────────────────────────────────────────────────────────

async function main() {
  const which = (process.argv[2] ?? "all").toUpperCase();
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY required");

  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const deployer = new ethers.Wallet(pk, provider);
  const allocPk = ethers.keccak256(ethers.toUtf8Bytes((pk.startsWith("0x") ? pk : "0x" + pk) + "allocator"));
  const allocator = new ethers.Wallet(allocPk, provider);
  console.log(`[setup] deployer/trader  = ${deployer.address}`);
  console.log(`[setup] allocator        = ${allocator.address}`);
  console.log(`[setup] chainId=${(await provider.getNetwork()).chainId} block=${await provider.getBlockNumber()}`);

  const ran: string[] = [];
  let scenAToken: bigint | null = null;
  let scenBToken: bigint | null = null;

  if (which === "A" || which === "ALL") {
    scenAToken = await runScenarioA(deployer, allocator, provider);
    ran.push(`A (tokenId=${scenAToken})`);
  }
  if (which === "B" || which === "ALL") {
    scenBToken = await runScenarioB(deployer, allocator, provider);
    ran.push(`B (tokenId=${scenBToken})`);
  }
  if (which === "C" || which === "ALL") {
    await runScenarioC(deployer, provider);
    ran.push("C");
  }

  // Final report
  console.log("\n\n═══════════════ TX LOG (markdown) ═══════════════");
  console.log("| Scenario | Step | Tx Hash | Note |");
  console.log("|---|---|---|---|");
  for (const r of TX_LOG) {
    const link = r.hash.startsWith("0x") && r.hash.length === 66 && r.step.startsWith("HL-")
      ? `[${r.hash.slice(0, 12)}...](https://app.hyperliquid-testnet.xyz/explorer/tx/${r.hash})`
      : r.hash.startsWith("0x") && r.hash.length === 66
        ? `[${r.hash.slice(0, 12)}...](https://chainscan-galileo.0g.ai/tx/${r.hash})`
        : r.hash;
    console.log(`| ${r.scenario} | ${r.step} | ${link} | ${r.note ?? ""} |`);
  }
  console.log(`\nScenarios run: ${ran.join(", ")}`);
  console.log(`Total tx logged: ${TX_LOG.length}`);
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});
