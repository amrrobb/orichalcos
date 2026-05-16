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
// Mainnet vs testnet explorer depends on CHAIN_ID env (set in .env.local + Vercel).
// 16661 = 0G Aristotle mainnet → chainscan.0g.ai
// 16602 = 0G Galileo testnet → chainscan-galileo.0g.ai
export const EXPLORER_URL =
  Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 16602) === 16661
    ? "https://chainscan.0g.ai"
    : "https://chainscan-galileo.0g.ai";

/**
 * Hyperliquid testnet trader wallet — the EOA that signs every perpetual
 * fill recorded by Strategy Agents. Judges can verify the live trading
 * history at https://app.hyperliquid-testnet.xyz/explorer/address/{this}.
 *
 * Hardcoded for hackathon demo; in production this would be looked up
 * per-strategy from on-chain metadata.
 */
export const HL_TRADER_WALLET = "0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d" as const;
export const HL_EXPLORER_URL = "https://app.hyperliquid-testnet.xyz/explorer";

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
    "0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7") as `0x${string}`,
  strategyINFT: (process.env.NEXT_PUBLIC_V3_STRATEGY_INFT ??
    "0x782CBD5313E3b99d9C94e4f5197B81a432cdE621") as `0x${string}`,
  insurancePool: (process.env.NEXT_PUBLIC_V3_INSURANCE_POOL ??
    "0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57") as `0x${string}`,
  tradeAttestation: (process.env.NEXT_PUBLIC_V3_TRADE_ATTESTATION ??
    "0x892872eF9490683604EE53B90c5c21e1B4E6eeda") as `0x${string}`,
  mockYieldVault: (process.env.NEXT_PUBLIC_V3_MOCK_YIELD_VAULT ??
    "0x5c16FeF4d883A489525469e5f61B222328022fE1") as `0x${string}`,
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

/**
 * Strategies hidden from the protocol grid.
 *
 * #1–#4 are legacy seeds with stuffed-oid placeholders instead of real
 * Hyperliquid L1 hashes; their TEE chatId and 0G Storage merkle root
 * are also placeholder bytes32; provenance links 404.
 *
 * #13–#15 are the diverse-owner mints (proof the trader-side mint+bond+
 * startEpoch path works for arbitrary EVM wallets, see
 * `agent/src/v3/mint-diverse-traders.ts` and chainscan). They are NOT
 * surfaced in the demo because v3 uses an EVM-wallet = HL-wallet pairing
 * model for trust — a trader signs both their bond/promise on 0G and
 * their fills on Hyperliquid testnet with the same identity. Those 3
 * derived EVM wallets don't have HL testnet accounts; sharing a single
 * HL wallet across multiple INFTs would break the verifiability story
 * (operator could mis-allocate fills between strategies). v3.5 derives
 * per-strategy HL execution keys inside 0G Compute TEE — see roadmap.
 *
 * Both groups remain queryable on chain via `getData(tokenId)`; the UI
 * filter just keeps the demo browse-grid coherent.
 */
export const LEGACY_STRATEGY_TOKEN_IDS = new Set<bigint>([
  1n, 2n, 3n, 4n,
  13n, 14n, 15n,
]);

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
