/**
 * v3-specific formatters. USDC has 6 decimals — keep this isolated so the
 * v2 `format.ts` (18-decimal OG) stays untouched.
 */
import { formatUnits, parseUnits } from "viem";
import { USDC_DECIMALS, ARCHETYPE_LABELS, STRATEGY_ARCHETYPES } from "./contracts";

/** "1,234.56" — no $ prefix; pair with a "USDC" suffix in JSX. */
export function formatUsdc(v: bigint | undefined, dp: number = 2): string {
  if (v === undefined) return "—";
  const s = formatUnits(v, USDC_DECIMALS);
  const n = Number(s);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

/** Parse user-facing string ("100", "1234.5") into 6-decimal bigint. */
export function parseUsdcInput(input: string): bigint | null {
  if (!input.trim()) return null;
  if (!/^\d+(\.\d{1,6})?$/.test(input.trim())) return null;
  try {
    return parseUnits(input.trim(), USDC_DECIMALS);
  } catch {
    return null;
  }
}

/** "20.00%" from raw bps (2000 -> "20.00%"). */
export function formatBps(bps: bigint | number | undefined, dp: number = 2): string {
  if (bps === undefined) return "—";
  const n = typeof bps === "bigint" ? Number(bps) : bps;
  return `${(n / 100).toFixed(dp)}%`;
}

export function archetypeMeta(archetype: number) {
  if (archetype < 0 || archetype >= STRATEGY_ARCHETYPES.length) {
    return { name: "Unknown", label: "Unknown", tagline: "" };
  }
  const name = STRATEGY_ARCHETYPES[archetype];
  return { name, ...ARCHETYPE_LABELS[name] };
}

/** "5d 3h" — a coarse remaining-time chip used on epoch end timestamps. */
export function formatRemaining(endTs: bigint | undefined): string {
  if (!endTs) return "—";
  const remainSec = Number(endTs) - Math.floor(Date.now() / 1000);
  if (remainSec <= 0) return "Expired";
  const d = Math.floor(remainSec / 86400);
  const h = Math.floor((remainSec % 86400) / 3600);
  const m = Math.floor((remainSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
