/**
 * One-time bootstrap for 0G Compute on mainnet.
 *
 * Mainnet requires a pre-funded ledger sub-account before TEE inference works.
 * Minimums (per SDK v0.6.x): 3 0G to ledger, 1 0G per provider via transferFund.
 *
 * Run once after mainnet deploy:
 *   PRIVATE_KEY=0x... ./node_modules/.bin/tsx src/v3/bootstrap-mainnet-compute.ts
 */
import "dotenv/config";
import { ethers } from "ethers";

const RPC = process.env.RPC_URL ?? "https://evmrpc.0g.ai";
const PK = process.env.PRIVATE_KEY!;
const PROVIDER = process.env.COMPUTE_PROVIDER_ADDRESS ?? "0x4415ef5CBb415347bb18493af7cE01f225Fc0868";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PK, provider);
  console.log(`[bootstrap] wallet=${wallet.address}`);
  console.log(`[bootstrap] balance=${ethers.formatEther(await provider.getBalance(wallet.address))} 0G`);

  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");
  const broker = await createZGComputeNetworkBroker(wallet);

  // Step 1: create ledger (3 0G minimum)
  console.log("[bootstrap] addLedger(3 0G)...");
  try {
    await broker.ledger.addLedger(3);
    console.log("  ✓ ledger created");
  } catch (e: any) {
    if (e.message?.includes("already")) {
      console.log("  ledger already exists, continuing");
    } else {
      console.log(`  ledger error (proceeding): ${e.message?.slice(0, 200)}`);
    }
  }

  // Step 2: acknowledge provider
  console.log(`[bootstrap] acknowledgeProviderSigner(${PROVIDER})...`);
  try {
    await broker.inference.acknowledgeProviderSigner(PROVIDER);
    console.log("  ✓ acknowledged");
  } catch (e: any) {
    if (e.message?.includes("already")) {
      console.log("  already acknowledged");
    } else {
      console.log(`  ack error: ${e.message?.slice(0, 200)}`);
    }
  }

  // Step 3: transfer fund (1 0G to inference subaccount)
  console.log(`[bootstrap] transferFund(${PROVIDER}, 1 0G, "inference")...`);
  try {
    const amount = ethers.parseEther("1.0");
    await broker.ledger.transferFund(PROVIDER, "inference", amount);
    console.log("  ✓ funded");
  } catch (e: any) {
    console.log(`  transferFund error: ${e.message?.slice(0, 200)}`);
  }

  // Step 4: verify
  try {
    const meta = await broker.inference.getServiceMetadata(PROVIDER);
    console.log(`[bootstrap] ✓ provider service: ${meta.model} @ ${meta.endpoint}`);
  } catch (e: any) {
    console.log(`[bootstrap] getServiceMetadata error: ${e.message?.slice(0, 200)}`);
  }

  console.log(`\n[bootstrap] balance after=${ethers.formatEther(await provider.getBalance(wallet.address))} 0G`);
  console.log("[bootstrap] DONE — TEE inference on mainnet should now work for this wallet.");
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
