import { ethers } from "ethers";
import { createRequire } from "module";
import dotenv from "dotenv";
dotenv.config();

const require = createRequire(import.meta.url);
const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");

async function discover() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  console.log("Wallet:", wallet.address);
  console.log("Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "OG");
  console.log("\nDiscovering 0G Compute providers...\n");

  const broker = await createZGComputeNetworkBroker(wallet);

  const services = await broker.inference.listService();
  console.log(`Found ${services.length} services:\n`);

  for (const s of services) {
    console.log(`  Provider: ${s[0]}`);
    console.log(`  Type: ${s[1]}`);
    console.log(`  URL: ${s[2]}`);
    console.log(`  Model: ${s[6]}`);
    console.log(`  TEE: ${s[10]}`);
    console.log();
  }

  // Check ledger
  try {
    const ledger = await broker.ledger.getLedger();
    console.log("Ledger balance:", ledger[1]?.toString(), "available:", ledger[2]?.toString());
  } catch (e: any) {
    console.log("No ledger yet:", e.message?.slice(0, 80));
  }
}

discover().catch(console.error);
