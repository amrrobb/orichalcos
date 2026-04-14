import dotenv from "dotenv";
import type { AgentConfig } from "./types.js";

dotenv.config();

function env(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export function loadConfig(): AgentConfig {
  return {
    privateKey: env("PRIVATE_KEY"),
    rpcUrl: env("RPC_URL", "https://evmrpc-testnet.0g.ai"),
    computeProviderAddress: env("COMPUTE_PROVIDER_ADDRESS", "0x8e60d466FD16798Bec4868aa4CE38586D5590049"),
    storageIndexerUrl: env("STORAGE_INDEXER_URL", "https://indexer-storage-testnet-turbo.0g.ai"),
    vaultAddress: env("VAULT_ADDRESS"),
    pairAddress: env("PAIR_ADDRESS"),
    inftAddress: env("INFT_ADDRESS"),
    wethAddress: env("WETH_ADDRESS"),
    usdcAddress: env("USDC_ADDRESS"),
    pollInterval: parseInt(env("POLL_INTERVAL", "30000")),
    maxTradeAmount: env("MAX_TRADE_AMOUNT", "1000000000000000000"), // 1 WETH default
  };
}
