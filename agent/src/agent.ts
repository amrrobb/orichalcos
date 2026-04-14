import { ethers } from "ethers";
import { initCompute, setupComputeProvider, getTradeSignal } from "./compute.js";
import { initStorage, storeAttestation } from "./storage.js";
import { getMarketContext } from "./market.js";
import { executeTrade, registerAttestation } from "./executor.js";
import { mintAgentINFT, updateINFTPerformance } from "./inft.js";
import type { AgentConfig, AttestationData } from "./types.js";

let running = true;
let tradeCount = 0;
let configRootHash = "";

export async function runAgent(config: AgentConfig) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  console.log(`[agent] Starting Orichalcos agent...`);
  console.log(`[agent] Wallet: ${wallet.address}`);
  console.log(`[agent] Vault: ${config.vaultAddress}`);
  console.log(`[agent] Pair: ${config.pairAddress}`);

  const mockMode = process.env.MOCK_COMPUTE === "true";

  // Initialize 0G services
  if (!mockMode) {
    await initCompute(wallet, config.computeProviderAddress);
  } else {
    console.log("[agent] Running in MOCK COMPUTE mode (no 0G Compute calls)");
  }
  initStorage(config.rpcUrl, wallet, config.storageIndexerUrl);

  // Setup compute provider (ledger + fund + acknowledge)
  if (!mockMode) {
    await setupComputeProvider(config.computeProviderAddress);
  }

  // Mint agent as INFT
  try {
    const strategyConfig = {
      name: "Orichalcos Agent",
      strategy: "TEE-sealed autonomous trading",
      pair: `${config.wethAddress}/${config.usdcAddress}`,
      maxTradeAmount: config.maxTradeAmount,
      pollInterval: config.pollInterval,
      createdAt: new Date().toISOString(),
    };
    await mintAgentINFT(wallet, config.inftAddress, strategyConfig);
    configRootHash = ethers.ZeroHash; // Will be set properly after first storage upload
  } catch (e: any) {
    console.log(`[agent] INFT minting failed (continuing without): ${e.message?.slice(0, 100)}`);
  }

  // Main loop
  console.log(`[agent] Entering trading loop (interval: ${config.pollInterval}ms)...`);

  while (running) {
    try {
      await tradingCycle(wallet, config);
    } catch (e: any) {
      console.error(`[agent] Cycle error: ${e.message}`);
    }

    // Wait for next cycle
    await sleep(config.pollInterval);
  }

  console.log("[agent] Agent stopped.");
}

async function tradingCycle(wallet: ethers.Wallet, config: AgentConfig) {
  // 1. Read market state
  const provider = wallet.provider!;
  const context = await getMarketContext(provider, config.pairAddress, config.vaultAddress);

  console.log(`\n[agent] === Cycle ${tradeCount + 1} ===`);
  console.log(`[agent] Price: ${context.price.toFixed(2)} | Vault: ${ethers.formatUnits(context.vaultBalance0, 18)} token0, ${ethers.formatUnits(context.vaultBalance1, 6)} token1`);

  // 2. Get trade signal via 0G Compute (TEE)
  const signal = await getTradeSignal(config.computeProviderAddress, context);

  // 3. If hold, skip
  if (signal.decision.action === "hold") {
    console.log("[agent] Decision: HOLD — skipping trade");
    return;
  }

  // 4. Execute trade on-chain
  const { tradeId, amountOut } = await executeTrade(wallet, config.vaultAddress, signal.decision);

  // 5. Store attestation on 0G Storage
  const attestationData: AttestationData = {
    tradeId,
    model: signal.attestation.model,
    inputHash: signal.attestation.inputHash,
    outputHash: signal.attestation.outputHash,
    timestamp: signal.attestation.timestamp,
    chatId: signal.attestation.chatId,
    isValid: signal.attestation.isValid,
    decision: signal.decision,
    marketContext: context,
  };

  let rootHash: string;
  try {
    rootHash = await storeAttestation(attestationData);
  } catch (e: any) {
    console.error(`[agent] Storage upload failed: ${e.message?.slice(0, 100)}`);
    rootHash = ethers.ZeroHash;
  }

  // 6. Register attestation on-chain
  if (rootHash !== ethers.ZeroHash) {
    try {
      await registerAttestation(wallet, config.vaultAddress, tradeId, rootHash);
    } catch (e: any) {
      console.error(`[agent] On-chain attestation registration failed: ${e.message?.slice(0, 100)}`);
    }
  }

  tradeCount++;
  console.log(`[agent] Trade #${tradeCount} complete. PnL tracking: amountOut=${amountOut}`);

  // 7. Update INFT every 5 trades
  if (tradeCount % 5 === 0) {
    const performanceSummary = {
      totalTrades: tradeCount,
      lastUpdated: new Date().toISOString(),
      lastTradeId: tradeId,
    };
    await updateINFTPerformance(wallet, config.inftAddress, performanceSummary, configRootHash);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[agent] Shutting down...");
  running = false;
});

process.on("SIGTERM", () => {
  running = false;
});
