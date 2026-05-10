/**
 * Per-Type metadata: hover signatures (anti-uniformity rule §9.5.9),
 * element colors, archetype descriptions.
 */
import type { ApprenticeType } from "./contracts";

export interface TypeMeta {
  label: string;
  colorVar: string;        // CSS variable name for Champion-only element color
  shortDescription: string;
  hoverClass: string;      // Tailwind utility composition for the per-Type hover signature
  championName: string;
}

export const TYPE_META: Record<ApprenticeType, TypeMeta> = {
  Bold: {
    label: "Bold",
    colorVar: "--agni",
    shortDescription: "High-conviction momentum trader. Loves volatility. Hates ranges.",
    // Eager: lifts and tilts +1deg
    hoverClass: "transition-transform duration-200 hover:-translate-y-1 hover:rotate-[1deg]",
    championName: "Agni",
  },
  Patient: {
    label: "Patient",
    colorVar: "--tirta",
    shortDescription: "Mean-reversion adaptive. Fades extremes. Counter-trends.",
    // Deliberate: descends 2px
    hoverClass: "transition-transform duration-200 hover:translate-y-[2px]",
    championName: "Tirta",
  },
  Sharp: {
    label: "Sharp",
    colorVar: "--bayu",
    shortDescription: "Scalper. Tiny edges, near-instant exits. Micro-timeframe.",
    // Instant: flickers brass-bright once then settles. Use a one-shot hover keyframe.
    hoverClass: "transition-[box-shadow] duration-75 hover:[box-shadow:0_0_24px_rgba(230,201,135,0.35)]",
    championName: "Bayu",
  },
  Stoic: {
    label: "Stoic",
    colorVar: "--pertiwi",
    shortDescription: "Defensive, drawdown-averse. Slow accumulation. Capital preservation.",
    // Defensive: grows a 1px outer ring
    hoverClass: "transition-shadow duration-200 hover:shadow-[0_0_0_1px_var(--brass-dim)]",
    championName: "Pertiwi",
  },
};

export const TYPE_BY_INDEX: ApprenticeType[] = ["Bold", "Patient", "Sharp", "Stoic"];

/** Pyth feed IDs per docs/SYSTEM_ARCHITECTURE.md §11 — used on mainnet.
 *  On Galileo testnet we use the MockPyth-only test feed 0x...01. */
export const PYTH_FEED_IDS = {
  BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  SOL_USD: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  MOCK: "0x0000000000000000000000000000000000000000000000000000000000000001",
} as const;

export function pythFeedLabel(feedId: string): string {
  if (feedId === PYTH_FEED_IDS.BTC_USD) return "BTC/USD";
  if (feedId === PYTH_FEED_IDS.ETH_USD) return "ETH/USD";
  if (feedId === PYTH_FEED_IDS.SOL_USD) return "SOL/USD";
  if (feedId === PYTH_FEED_IDS.MOCK) return "BTC/USD (mock)";
  return `${feedId.slice(0, 10)}…`;
}
