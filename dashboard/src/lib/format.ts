/**
 * Display formatters. All numerals via JetBrains Mono `tnum` per
 * docs/DESIGN_SYSTEM.md §3.
 */
import { APPRENTICE_TYPES, TITLES, DIRECTIONS } from "./contracts";

/** 0x77C0…8812 — used in address chips */
export function formatAddress(addr: string | undefined): string {
  if (!addr || addr.length < 10) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** 0xa7b258…bbc404 — used in tellRoot / attestationHash chips */
export function formatHash(hash: string | undefined): string {
  if (!hash || hash.length < 14) return "—";
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function formatElo(n: number | bigint | undefined): string {
  if (n === undefined || n === null) return "—";
  const num = typeof n === "bigint" ? Number(n) : n;
  return num.toString();
}

export function formatStake(weiOrEth: bigint | undefined, decimals: number = 4): string {
  if (weiOrEth === undefined) return "—";
  const ether = Number(weiOrEth) / 1e18;
  return `${ether.toFixed(decimals)} OG`;
}

/** Pyth price — int64 with -8 expo => USD (e.g. 60000_00000000 -> 60000.00) */
export function formatPythPrice(priceE8: bigint | number | undefined): string {
  if (priceE8 === undefined || priceE8 === null) return "—";
  const v = typeof priceE8 === "bigint" ? Number(priceE8) : priceE8;
  return (v / 1e8).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function typeLabel(t: number | undefined): (typeof APPRENTICE_TYPES)[number] | "Unknown" {
  if (t === undefined || t < 0 || t >= APPRENTICE_TYPES.length) return "Unknown";
  return APPRENTICE_TYPES[t];
}

export function titleLabel(t: number | undefined): (typeof TITLES)[number] | "Unknown" {
  if (t === undefined || t < 0 || t >= TITLES.length) return "Unknown";
  return TITLES[t];
}

export function directionLabel(d: number | undefined): (typeof DIRECTIONS)[number] | "—" {
  if (d === undefined || d < 0 || d >= DIRECTIONS.length) return "—";
  return DIRECTIONS[d];
}

export function relativeTime(ts: bigint | number | Date | undefined): string {
  if (ts === undefined || ts === null) return "—";
  const target = typeof ts === "bigint" ? Number(ts) * 1000 : ts instanceof Date ? ts.getTime() : ts * 1000;
  const diff = Math.floor((Date.now() - target) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
