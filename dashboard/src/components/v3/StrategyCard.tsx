/**
 * Card representation of an active Strategy Agent on the /protocol page.
 * Compact: archetype, equity vs starting bond, drawdown threshold, action.
 */
"use client";

import Link from "next/link";
import { useAllocatedCoverage } from "@/hooks/v3/useAllPolicies";
import type { StrategyEntry } from "@/hooks/v3/useStrategies";
import { CoverageMeter } from "./CoverageMeter";
import { archetypeMeta, formatBps, formatRemaining, formatUsdc } from "@/lib/v3format";
import { formatAddress } from "@/lib/format";

interface Props {
  entry: StrategyEntry;
}

export function StrategyCard({ entry }: Props) {
  const { tokenId, data, statusLabel } = entry;
  const meta = archetypeMeta(data.archetype);
  const allocatedQ = useAllocatedCoverage(tokenId, data.currentEpochId);
  const allocated = (allocatedQ.data as bigint | undefined) ?? 0n;

  // Promise floor: equity below this triggers breach.
  // startingBond * (1 - maxDrawdownBps/10000)
  const drawdownBps = data.maxDrawdownBps;
  const drawdownPct = Number(drawdownBps) / 100;
  const floor =
    (data.startingBond * (10_000n - drawdownBps)) / 10_000n;

  // Headroom: how far above the floor the trader's equity sits, as a % of bond.
  // > 0 = above floor (healthy), 0 = at floor (about to breach), < 0 = breached.
  const headroomPct =
    data.startingBond === 0n
      ? 0
      : Number(
          ((data.currentEquity > floor ? data.currentEquity - floor : 0n) *
            10000n) /
            data.startingBond,
        ) / 100;

  // Bar fills from floor (left, red) up to current equity (right) — visually
  // shows how far the trader has yet to fall before breach.
  const equityPct =
    data.startingBond === 0n
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            Number((data.currentEquity * 10000n) / data.startingBond) / 100,
          ),
        );
  const floorPct = 100 - drawdownPct; // e.g. drawdown 20% -> floor at 80%

  const aboveFloor = equityPct >= floorPct;
  const closenessToFloor = aboveFloor
    ? (equityPct - floorPct) / drawdownPct // 0..1+, larger = safer
    : -1;
  const equityColor =
    closenessToFloor < 0
      ? "var(--loss)"
      : closenessToFloor < 0.33
        ? "var(--brass-bright)"
        : "var(--win)";

  const headroomLabel = aboveFloor
    ? `+${headroomPct.toFixed(1)}% above floor`
    : "below floor";

  return (
    <div
      className="bg-[var(--surface-raised)] border border-[var(--rule)] rounded-[var(--radius-lg)] p-5 hover:border-[var(--brass-dim)] transition-colors flex flex-col gap-4"
      style={{ minHeight: 340 }}
    >
      {/* Header — eyebrow: archetype + token id ; headline: THE PROMISE */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label mb-1.5">
            Wager #{tokenId.toString()}
          </p>
          <h3
            className="display-3 leading-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Won't drop more than {formatBps(drawdownBps, 0)}
          </h3>
          <p className="caption text-[var(--ink-dim)] mt-1 mono">
            over the next {formatRemaining(data.epochEndTs)}
          </p>
        </div>
        <span
          className="label inline-block rounded-sm px-2 py-[3px]"
          style={{
            color: "var(--brass)",
            background: "var(--surface-locked)",
            border: "1px solid var(--brass-dim)",
            letterSpacing: "0.16em",
          }}
        >
          {statusLabel.toUpperCase()}
        </span>
      </div>

      {/* Headroom-to-breach bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="label">Headroom to breach</span>
          <span
            className="mono text-xs"
            style={{
              color: aboveFloor ? "var(--ink-dim)" : "var(--loss)",
            }}
          >
            {headroomLabel}
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden border border-[var(--rule)] relative"
          style={{ background: "var(--surface-locked)" }}
        >
          {/* equity fill */}
          <div
            className="h-full transition-all"
            style={{
              width: `${equityPct}%`,
              background: equityColor,
            }}
          />
          {/* floor marker */}
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${floorPct}%`,
              background: "var(--loss)",
              opacity: 0.7,
            }}
            title={`Breach floor: ${formatUsdc(floor)} USDC`}
          />
        </div>
        <p className="caption text-[var(--ink-faint)] mt-1 mono">
          Floor at {formatUsdc(floor)} · current {formatUsdc(data.currentEquity)} USDC
        </p>
      </div>

      {/* TEE-attested trader style (decorative — promise above is what's enforced) */}
      <p className="caption text-[var(--ink-faint)] mono" style={{ fontSize: "0.65rem", letterSpacing: "0.04em" }}>
        Trader self-asserts: {meta.tagline} · sealed in TEE
      </p>

      {/* Underwriting stats */}
      <div className="grid grid-cols-2 gap-3 text-center pt-1">
        <Stat label="Bond at risk" value={`${formatUsdc(data.bondAmount)} USDC`} small />
        <Stat
          label="Available coverage"
          value={`${formatUsdc(data.bondAmount > allocated ? data.bondAmount - allocated : 0n)} USDC`}
          small
        />
      </div>

      {/* Coverage meter */}
      <CoverageMeter bondAmount={data.bondAmount} allocated={allocated} />

      {/* Footer */}
      <div className="pt-2 mt-auto flex items-center justify-between border-t border-[var(--rule)]">
        <span className="caption text-[var(--ink-faint)] mono">
          {formatAddress(data.mintedBy)}
        </span>
        <Link
          href={`/strategies/${tokenId.toString()}/insure`}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{
            background: "var(--brass)",
            color: "var(--surface-base)",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
          }}
        >
          Buy claim on breach →
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div>
      <p className="label" style={{ fontSize: "0.6rem" }}>
        {label}
      </p>
      <p
        className="mono numeral mt-0.5"
        style={{
          color: "var(--brass-bright)",
          fontSize: small ? "0.95rem" : "1.15rem",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
    </div>
  );
}
