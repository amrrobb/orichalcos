/**
 * settle-only.ts — call settleEpoch on a token whose epoch has ended.
 * Reads pool balances pre/post and decodes PolicyExpired + EpochSettled.
 *
 * Usage: tsx src/v3/settle-only.ts <tokenId>
 */
import "dotenv/config";
import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 16602);
const GAS_PRICE = ethers.parseUnits("5", "gwei");

const V3 = {
  mockUsdc:      "0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7",
  strategyINFT:  "0x782CBD5313E3b99d9C94e4f5197B81a432cdE621",
  insurancePool: "0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57",
};
const STRATEGY_ABI = [
  "function settleEpoch(uint256)",
  "function getData(uint256) view returns (tuple(uint8,bytes32,bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8))",
];
const USDC_ABI = ["function balanceOf(address) view returns (uint256)"];

const usdc = (n: bigint) => `${ethers.formatUnits(n, 6)} USDC`;

async function main() {
  const tokenId = BigInt(process.argv[2] ?? "");
  if (!tokenId) throw new Error("tokenId arg required");
  const pk = process.env.PRIVATE_KEY!;
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const deployer = new ethers.Wallet(pk, provider);
  const allocPk = ethers.keccak256(ethers.toUtf8Bytes((pk.startsWith("0x") ? pk : "0x" + pk) + "allocator"));
  const allocator = new ethers.Wallet(allocPk, provider);

  const strategy = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, deployer);
  const usdcC = new ethers.Contract(V3.mockUsdc, USDC_ABI, provider);

  const d = await strategy.getData(tokenId);
  const now = Math.floor(Date.now() / 1000);
  console.log(`tokenId=${tokenId} status=${d[12]} epochEndTs=${d[10]} now=${now} (Δ=${Number(d[10]) - now}s)`);
  if (Number(d[10]) > now) {
    const wait = Number(d[10]) - now + 5;
    console.log(`waiting ${wait}s for epoch end...`);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }

  const allocPre = await usdcC.balanceOf(allocator.address);
  const traderPre = await usdcC.balanceOf(deployer.address);
  console.log(`allocator pre-settle: ${usdc(allocPre)}`);
  console.log(`trader pre-settle:    ${usdc(traderPre)}`);

  const tx = await strategy.settleEpoch(tokenId, { gasPrice: GAS_PRICE });
  const r = await tx.wait();
  if (!r) throw new Error("no receipt");
  console.log(`settleEpoch tx: ${r.hash}`);

  const allocPost = await usdcC.balanceOf(allocator.address);
  const traderPost = await usdcC.balanceOf(deployer.address);
  console.log(`allocator Δ = ${usdc(allocPost - allocPre)}`);
  console.log(`trader Δ    = ${usdc(traderPost - traderPre)}`);

  const polExpTopic = ethers.id("PolicyExpired(uint256,uint256,uint256)");
  const epochSettledTopic = ethers.id("EpochSettled(uint256,uint256,uint256,uint256)");
  for (const log of r.logs) {
    if (log.topics?.[0] === polExpTopic) {
      const dec = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "uint256"], log.data);
      console.log(`EVENT PolicyExpired: premiumToLP=${usdc(dec[0])} premiumToTrader=${usdc(dec[1])}`);
    }
    if (log.topics?.[0] === epochSettledTopic) {
      const dec = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "uint256"], log.data);
      console.log(`EVENT EpochSettled: toAllocators=${usdc(dec[0])} toTrader=${usdc(dec[1])}`);
    }
  }
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
