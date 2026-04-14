import { ethers } from "ethers";
import { createRequire } from "module";
import dotenv from "dotenv";
dotenv.config();

const require = createRequire(import.meta.url);
const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");

async function setup() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const providerAddress = process.env.COMPUTE_PROVIDER_ADDRESS!;

  console.log("Wallet:", wallet.address);
  console.log("Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "OG");
  console.log("Provider:", providerAddress);
  console.log();

  const broker = await createZGComputeNetworkBroker(wallet);

  // 1. Create ledger (3 OG minimum)
  console.log("Step 1: Creating ledger with 3 OG...");
  try {
    await broker.ledger.addLedger(3);
    console.log("  Ledger created!");
  } catch (e: any) {
    if (e.message?.includes("execution reverted")) {
      console.log("  Ledger already exists, skipping");
    } else {
      console.error("  Error:", e.message?.slice(0, 100));
    }
  }

  // 2. Transfer to provider
  console.log("\nStep 2: Transferring 1 OG to provider...");
  try {
    await broker.ledger.transferFund(providerAddress, "inference", ethers.parseEther("1.0"));
    console.log("  Transferred!");
  } catch (e: any) {
    console.error("  Error:", e.message?.slice(0, 100));
  }

  // 3. Acknowledge provider signer
  console.log("\nStep 3: Acknowledging provider signer...");
  try {
    await broker.inference.acknowledgeProviderSigner(providerAddress);
    console.log("  Acknowledged!");
  } catch (e: any) {
    if (e.message?.includes("execution reverted")) {
      console.log("  Already acknowledged, skipping");
    } else {
      console.error("  Error:", e.message?.slice(0, 100));
    }
  }

  // 4. Verify
  console.log("\nStep 4: Verifying setup...");
  try {
    const ledger = await broker.ledger.getLedger();
    console.log("  Ledger total:", ledger[1]?.toString());
    console.log("  Ledger available:", ledger[2]?.toString());
  } catch (e: any) {
    console.error("  Error:", e.message?.slice(0, 100));
  }

  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
  console.log("  Endpoint:", endpoint);
  console.log("  Model:", model);

  console.log("\n  Setup complete! You can now run the agent with MOCK_COMPUTE=false");

  // Check remaining balance
  const bal = await provider.getBalance(wallet.address);
  console.log("  Remaining balance:", ethers.formatEther(bal), "OG");
}

setup().catch(console.error);
