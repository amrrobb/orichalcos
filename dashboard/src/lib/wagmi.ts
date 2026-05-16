import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const zgMainnet = defineChain({
  id: 16661,
  name: "0G Aristotle Mainnet",
  nativeCurrency: { name: "0G", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "0G Chainscan", url: "https://chainscan.0g.ai" },
  },
  testnet: false,
});

export const zgTestnet = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "0G Chainscan (Galileo)", url: "https://chainscan-galileo.0g.ai" },
  },
  testnet: true,
});

// Pick the active chain based on the public env. Mainnet by default; Galileo when explicitly set.
// `NEXT_PUBLIC_CHAIN_ID=16661` → mainnet only (production, prod recording).
// `NEXT_PUBLIC_CHAIN_ID=16602` → testnet only (local Galileo demos).
// Unset → both, mainnet listed first so RainbowKit defaults to it.
const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 0);
const chains =
  envChainId === 16661
    ? ([zgMainnet] as const)
    : envChainId === 16602
      ? ([zgTestnet] as const)
      : ([zgMainnet, zgTestnet] as const);

export const config = getDefaultConfig({
  appName: "Orichalcos",
  projectId: "orichalcos-hackathon", // WalletConnect project ID (demo)
  chains,
  ssr: true,
});
