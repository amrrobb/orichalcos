/**
 * v2 contract addresses + enum mappings for Orichalcos Scrying Duel.
 *
 * Addresses come from NEXT_PUBLIC_*_V2 env vars (see .env.local.example).
 * Defaults are the deployed Galileo testnet addresses from deployments-v2.json,
 * so the app works locally without env config.
 *
 * ABIs live in src/lib/abi/ — Unit 2 wires them into wagmi hooks.
 */

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 16602);
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
export const EXPLORER_URL = "https://chainscan-galileo.0g.ai";

export const ADDRESSES = {
  apprenticeINFT: (process.env.NEXT_PUBLIC_APPRENTICE_INFT_V2 ??
    "0x7fb2a815fa88c2096960999ec8371bccdf147874") as `0x${string}`,
  codex: (process.env.NEXT_PUBLIC_CODEX_V2 ??
    "0x24b1ca69816247ef9666277714fada8b1f2d901e") as `0x${string}`,
  scryingDuel: (process.env.NEXT_PUBLIC_SCRYING_DUEL_V2 ??
    "0x74078bc45e3e208beb4b74522ab193dcf071d93f") as `0x${string}`,
  mockPyth: (process.env.NEXT_PUBLIC_MOCK_PYTH_V2 ??
    "0xc2cc2835219a55a27c5184eaacd9b8fccef00f85") as `0x${string}`,
} as const;

export const STORAGE_INDEXER_URL =
  process.env.NEXT_PUBLIC_STORAGE_INDEXER_URL ??
  "https://indexer-storage-testnet-turbo.0g.ai";

// Apprentice Type / Title enum order — must match contracts/src/ApprenticeINFT.sol
export const APPRENTICE_TYPES = ["Bold", "Patient", "Sharp", "Stoic"] as const;
export type ApprenticeType = (typeof APPRENTICE_TYPES)[number];

export const TITLES = ["Initiate", "Apprentice", "Adept", "Master", "Sage"] as const;
export type Title = (typeof TITLES)[number];

// Direction enum — must match ScryingDuel.sol
export const DIRECTIONS = ["LONG", "SHORT"] as const;
export type Direction = (typeof DIRECTIONS)[number];

// ════════════════════════════════════════════════════════════════════════
// v3 — Risk-Management Protocol (Galileo testnet, deployed 2026-05-12)
// ════════════════════════════════════════════════════════════════════════

export const V3_ADDRESSES = {
  mockUsdc: (process.env.NEXT_PUBLIC_V3_MOCK_USDC ??
    "0x2F7296aebCBc5a8D67A65FA6BF09dD74c70bC60f") as `0x${string}`,
  strategyINFT: (process.env.NEXT_PUBLIC_V3_STRATEGY_INFT ??
    "0x349D286aF27501d4119C11709bb48f4Ef9f50450") as `0x${string}`,
  insurancePool: (process.env.NEXT_PUBLIC_V3_INSURANCE_POOL ??
    "0xdAe6c8DCE82f848e3b5a21320F0b8eeB655a0E91") as `0x${string}`,
  tradeAttestation: (process.env.NEXT_PUBLIC_V3_TRADE_ATTESTATION ??
    "0x30Fc834477B15B0B3720D61A169FF5dFe4D7C742") as `0x${string}`,
} as const;

// Archetype enum — must match v3/StrategyINFT.sol
// Display names map to strategy archetypes per PIVOT.md naming section.
export const STRATEGY_ARCHETYPES = ["Bold", "Patient", "Sharp", "Stoic"] as const;
export type StrategyArchetype = (typeof STRATEGY_ARCHETYPES)[number];

export const ARCHETYPE_LABELS: Record<StrategyArchetype, { label: string; tagline: string }> = {
  Bold:    { label: "Momentum",       tagline: "Bold momentum scalper" },
  Patient: { label: "Mean-Reversion", tagline: "Patient counter-trend" },
  Sharp:   { label: "Microstructure", tagline: "Sharp scalper" },
  Stoic:   { label: "Grid",           tagline: "Stoic range trader" },
};

// EpochStatus enum — must match v3/StrategyINFT.sol
export const EPOCH_STATUSES = ["Idle", "Active", "Breached", "Settled"] as const;
export type EpochStatus = (typeof EPOCH_STATUSES)[number];

// PolicyStatus enum — must match v3/InsurancePool.sol
export const POLICY_STATUSES = ["Active", "Claimed", "Expired"] as const;
export type PolicyStatus = (typeof POLICY_STATUSES)[number];

// Configurable: premiumBps default at deploy is 1250 (12.5%)
export const V3_PREMIUM_BPS_DEFAULT = 1250;

// USDC has 6 decimals
export const USDC_DECIMALS = 6;
