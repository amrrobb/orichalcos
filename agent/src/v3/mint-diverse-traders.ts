/**
 * mint-diverse-traders.ts
 *
 * Generates 3 deterministic trader wallets, has each one:
 *   1. (operator funds them with native 0G for gas + MockUSDC for bond)
 *   2. mints their own Strategy Agent INFT (owner = trader address)
 *   3. approves InsurancePool / StrategyINFT for the bond
 *   4. calls startEpoch with their own bond
 *
 * After this script runs, the /protocol grid will show 3 NEW strategies
 * each owned by a DIFFERENT trader wallet — breaking the "all from one
 * deployer" appearance and making the market look pluralistic.
 *
 * Trader keys are derived from PRIVATE_KEY so they're reproducible:
 *   keccak256(PRIVATE_KEY || "trader-bold")
 *   keccak256(PRIVATE_KEY || "trader-patient")
 *   keccak256(PRIVATE_KEY || "trader-sharp")
 *
 * Run:
 *   PRIVATE_KEY=0x... ./node_modules/.bin/tsx src/v3/mint-diverse-traders.ts
 */
import "dotenv/config";
import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 16602);
const GAS_PRICE = ethers.parseUnits("5", "gwei");

const V3 = {
  mockUsdc:     "0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7",
  strategyINFT: "0x782CBD5313E3b99d9C94e4f5197B81a432cdE621",
};

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function mint(address,uint256)",
];
const STRATEGY_ABI = [
  "function mint(address,uint8,bytes32,bytes32) returns (uint256)",
  "function startEpoch(uint256,uint256,uint256,uint256) returns (uint256)",
  "function nextTokenId() view returns (uint256)",
  "function ownerOf(uint256) view returns (address)",
  "event StrategyMinted(uint256 indexed tokenId, address indexed trader, uint8 archetype, bytes32 sealedSoulRoot)",
];

const BOND = 1000n * 1_000_000n;            // 1000 USDC
const MAX_DRAWDOWN_BPS = 2000n;             // 20%
const EPOCH_DURATION_SECS = 24n * 60n * 60n; // 24 hours so they stay browsable
const ARCH = { Bold: 0, Patient: 1, Sharp: 2, Stoic: 3 };

const TRADERS = [
  { name: "Bold",    archetype: ARCH.Bold,    seed: "trader-bold" },
  { name: "Patient", archetype: ARCH.Patient, seed: "trader-patient" },
  { name: "Sharp",   archetype: ARCH.Sharp,   seed: "trader-sharp" },
];

function rb32(): string { return ethers.hexlify(ethers.randomBytes(32)); }
function usdc(n: bigint): string { return `${ethers.formatUnits(n, 6)} USDC`; }

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY required");

  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const operator = new ethers.Wallet(pk, provider);
  console.log(`[setup] operator/funder = ${operator.address}`);
  console.log(`[setup] chainId=${(await provider.getNetwork()).chainId} block=${await provider.getBlockNumber()}\n`);

  const usdcOp = new ethers.Contract(V3.mockUsdc, USDC_ABI, operator);
  const stratOp = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, operator);

  const txOpts = { gasPrice: GAS_PRICE };
  const results: { name: string; address: string; tokenId: string; mintTx: string; epochTx: string }[] = [];

  for (const trader of TRADERS) {
    console.log(`═══════════════ Trader: ${trader.name} ═══════════════`);

    // 1. Derive the trader wallet
    const seed = (pk.startsWith("0x") ? pk : "0x" + pk) + trader.seed;
    const traderPk = ethers.keccak256(ethers.toUtf8Bytes(seed));
    const traderWallet = new ethers.Wallet(traderPk, provider);
    console.log(`  trader address: ${traderWallet.address}`);

    // 2. Fund trader with native 0G if needed (~0.005 0G is plenty)
    const nativeBal = await provider.getBalance(traderWallet.address);
    const minNative = ethers.parseEther("0.005");
    if (nativeBal < minNative) {
      console.log(`  funding trader with 0.01 native 0G...`);
      const tx = await operator.sendTransaction({
        to: traderWallet.address,
        value: ethers.parseEther("0.01"),
        gasPrice: GAS_PRICE,
      });
      const r = await tx.wait();
      console.log(`    funded native: ${r?.hash}`);
    }

    // 3. Mint MockUSDC to the trader for the bond
    const usdcBal: bigint = await usdcOp.balanceOf(traderWallet.address);
    if (usdcBal < BOND) {
      const mintAmt = BOND * 2n;
      const tx = await usdcOp.mint(traderWallet.address, mintAmt, txOpts);
      const r = await tx.wait();
      console.log(`  minted ${usdc(mintAmt)} → trader: ${r?.hash}`);
    }

    // 4. OPERATOR mints the INFT with trader = traderWallet.address as the owner
    // (mint() is callable by anyone; the `trader` argument controls ownership)
    const soul = rb32();
    const meta = rb32();
    const nextIdBefore: bigint = await stratOp.nextTokenId();
    const mintTx = await stratOp.mint(traderWallet.address, trader.archetype, soul, meta, txOpts);
    const mintRcpt = await mintTx.wait();
    const tokenId = nextIdBefore;
    console.log(`  ✓ mint tokenId=${tokenId} owned-by ${traderWallet.address}: ${mintRcpt?.hash}`);

    // Verify ownership
    const owner = await stratOp.ownerOf(tokenId);
    if (owner.toLowerCase() !== traderWallet.address.toLowerCase()) {
      throw new Error(`ownership wrong: expected ${traderWallet.address}, got ${owner}`);
    }

    // 5. TRADER (not operator) approves USDC spend + calls startEpoch
    const usdcTrader = new ethers.Contract(V3.mockUsdc, USDC_ABI, traderWallet);
    const stratTrader = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, traderWallet);

    const allowance: bigint = await usdcTrader.allowance(traderWallet.address, V3.strategyINFT);
    if (allowance < BOND) {
      const tx = await usdcTrader.approve(V3.strategyINFT, BOND * 10n, txOpts);
      const r = await tx.wait();
      console.log(`  ✓ trader approved StrategyINFT: ${r?.hash}`);
    }

    const epochTx = await stratTrader.startEpoch(tokenId, BOND, MAX_DRAWDOWN_BPS, EPOCH_DURATION_SECS, txOpts);
    const epochRcpt = await epochTx.wait();
    console.log(`  ✓ TRADER signs startEpoch (bond=${usdc(BOND)}, drawdown=20%, dur=24h): ${epochRcpt?.hash}\n`);

    results.push({
      name: trader.name,
      address: traderWallet.address,
      tokenId: tokenId.toString(),
      mintTx: mintRcpt!.hash,
      epochTx: epochRcpt!.hash,
    });
  }

  console.log("\n═══════════════ FINAL ═══════════════");
  console.log("| Trader | Address | tokenId | mint tx | startEpoch tx |");
  console.log("|---|---|---|---|---|");
  for (const r of results) {
    console.log(`| ${r.name} | ${r.address} | #${r.tokenId} | [${r.mintTx.slice(0,12)}...](https://chainscan-galileo.0g.ai/tx/${r.mintTx}) | [${r.epochTx.slice(0,12)}...](https://chainscan-galileo.0g.ai/tx/${r.epochTx}) |`);
  }
  console.log("\nNote: 3 distinct trader wallets, each is the on-chain owner of their INFT and signed their own startEpoch tx. Verify with:");
  for (const r of results) {
    console.log(`  cast call 0x782CBD5313E3b99d9C94e4f5197B81a432cdE621 "ownerOf(uint256)(address)" ${r.tokenId} --rpc-url ${RPC_URL}`);
  }
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
