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

  const equityPct =
    data.startingBond === 0n
      ? 100
      : Math.max(
          0,
          Math.min(
            150,
            Number((data.currentEquity * 10000n) / data.startingBond) / 100,
          ),
        );

  // Color the equity bar by health vs threshold.
  const drawdownPct = Number(data.maxDrawdownBps) / 100;
  const equityHealth = 100 - equityPct;
  const equityColor =
    equityHealth >= drawdownPct
      ? "var(--loss)"
      : equityHealth >= drawdownPct * 0.66
        ? "var(--brass-bright)"
        : "var(--win)";

  return (
    <div
      className="bg-[var(--surface-raised)] border border-[var(--rule)] rounded-[var(--radius-lg)] p-5 hover:border-[var(--brass-dim)] transition-colors flex flex-col gap-4"
      style={{ minHeight: 320 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label mb-1.5">{meta.tagline}</p>
          <h3
            className="display-3 leading-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            {meta.label}{" "}
            <span className="mono text-[var(--ink-faint)] text-base ml-1">
              #{tokenId.toString()}
            </span>
          </h3>
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

      {/* Equity bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="label">Equity vs bond</span>
          <span className="mono text-xs text-[var(--ink-dim)]">
            {formatUsdc(data.currentEquity)} / {formatUsdc(data.startingBond)}
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden border border-[var(--rule)]"
          style={{ background: "var(--surface-locked)" }}
        >
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.min(100, equityPct)}%`,
              background: equityColor,
            }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 text-center pt-1">
        <Stat label="Drawdown cap" value={formatBps(data.maxDrawdownBps)} />
        <Stat label="Bond left" value={`${formatUsdc(data.bondAmount)}`} small />
        <Stat label="Epoch ends" value={formatRemaining(data.epochEndTs)} small />
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
          Get Protected Exposure →
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
