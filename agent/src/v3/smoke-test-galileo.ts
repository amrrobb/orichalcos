/**
 * smoke-test-galileo.ts — verify the Galileo deployment is healthy.
 *
 * Reads basic state from all 4 v3 contracts to confirm they're alive and wired.
 * No writes. Safe to run anytime.
 *
 * Run:
 *   ./node_modules/.bin/tsx src/v3/smoke-test-galileo.ts
 */

import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 16602);

const V3 = {
  mockUsdc:         "0x2F7296aebCBc5a8D67A65FA6BF09dD74c70bC60f",
  strategyINFT:     "0x349D286aF27501d4119C11709bb48f4Ef9f50450",
  insurancePool:    "0xdAe6c8DCE82f848e3b5a21320F0b8eeB655a0E91",
  tradeAttestation: "0x30Fc834477B15B0B3720D61A169FF5dFe4D7C742",
};

const ACTORS = {
  deployer:   "0x77C037fbF42e85dB1487B390b08f58C00f438812",
  allocatorA: "0x000000000000000000000000000000000000bEEF",
  allocatorB: "0x000000000000000000000000000000000000BEe9",
  lp1:        "0x000000000000000000000000000000000000c0DE",
  lp2:        "0x000000000000000000000000000000000000C0d3",
};

const USDC_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)", "function totalSupply() view returns (uint256)"];
const STRATEGY_ABI = [
  "function nextTokenId() view returns (uint256)",
  "function tradeAttestation() view returns (address)",
  "function insurancePool() view returns (address)",
  "function owner() view returns (address)",
];
const POOL_ABI = [
  "function totalAssets() view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function premiumBps() view returns (uint16)",
  "function strategyINFT() view returns (address)",
];
const ATTEST_ABI = [
  "function operator() view returns (address)",
  "function strategyINFT() view returns (address)",
];

function fmt(n: bigint, decimals = 6) {
  return ethers.formatUnits(n, decimals);
}

async function main() {
  console.log(`[smoke] connecting to ${RPC_URL} chainId=${CHAIN_ID}`);
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const net = await provider.getNetwork();
  console.log(`[smoke] connected. chainId=${net.chainId} blockNumber=${await provider.getBlockNumber()}`);

  // USDC
  console.log("\n=== MockUSDC ===");
  const usdc = new ethers.Contract(V3.mockUsdc, USDC_ABI, provider);
  console.log(`  addr:         ${V3.mockUsdc}`);
  console.log(`  decimals:     ${await usdc.decimals()}`);
  console.log(`  totalSupply:  ${fmt(await usdc.totalSupply())} USDC`);
  for (const [name, addr] of Object.entries(ACTORS)) {
    const bal = await usdc.balanceOf(addr);
    console.log(`  ${name.padEnd(11)} ${addr}  bal=${fmt(bal)} USDC`);
  }

  // StrategyINFT
  console.log("\n=== StrategyINFT ===");
  const strategy = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, provider);
  console.log(`  addr:             ${V3.strategyINFT}`);
  console.log(`  owner:            ${await strategy.owner()}`);
  console.log(`  nextTokenId:      ${await strategy.nextTokenId()} (first mint will be id=1)`);
  console.log(`  tradeAttestation: ${await strategy.tradeAttestation()}`);
  console.log(`  insurancePool:    ${await strategy.insurancePool()}`);

  const taOk = (await strategy.tradeAttestation()).toLowerCase() === V3.tradeAttestation.toLowerCase();
  const ipOk = (await strategy.insurancePool()).toLowerCase() === V3.insurancePool.toLowerCase();
  console.log(`  wires:            tradeAttestation=${taOk ? "✓" : "✗"} insurancePool=${ipOk ? "✓" : "✗"}`);

  // InsurancePool
  console.log("\n=== InsurancePool ===");
  const pool = new ethers.Contract(V3.insurancePool, POOL_ABI, provider);
  console.log(`  addr:         ${V3.insurancePool}`);
  console.log(`  strategyINFT: ${await pool.strategyINFT()}`);
  console.log(`  totalAssets:  ${fmt(await pool.totalAssets())} USDC`);
  console.log(`  totalShares:  ${fmt(await pool.totalShares())} shares`);
  console.log(`  premiumBps:   ${await pool.premiumBps()} (${Number(await pool.premiumBps()) / 100}%)`);

  // TradeAttestation
  console.log("\n=== TradeAttestation ===");
  const attest = new ethers.Contract(V3.tradeAttestation, ATTEST_ABI, provider);
  console.log(`  addr:         ${V3.tradeAttestation}`);
  console.log(`  operator:     ${await attest.operator()}`);
  console.log(`  strategyINFT: ${await attest.strategyINFT()}`);

  const opOk = (await attest.operator()).toLowerCase() === ACTORS.deployer.toLowerCase();
  console.log(`  operator is deployer: ${opOk ? "✓" : "✗"}`);

  // Final
  console.log("\n=== Summary ===");
  const allWired = taOk && ipOk && opOk;
  console.log(`  All wires correct: ${allWired ? "✓ HEALTHY" : "✗ BROKEN"}`);
  if (allWired) {
    console.log("  Ready to run populate-demo.ts");
  } else {
    console.log("  Re-deploy needed (run script/v3/DeployGalileo.s.sol)");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[smoke] FATAL:", err);
  process.exit(1);
});
