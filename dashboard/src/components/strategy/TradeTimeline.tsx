/**
 * Scrollable list of attested trades for a Strategy Agent.
 *
 * Each row: timestamp, signed pnlDelta (color-coded), equityAfter. Click a
 * row → opens TradeModal with the full attestation provenance.
 */
"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { USDC_DECIMALS } from "@/lib/contracts";
import type { Trade } from "@/hooks/v3/useTradesForStrategy";
import { relativeTime } from "@/lib/format";
import { TradeModal } from "./TradeModal";

interface Props {
  trades: readonly Trade[];
}

function fmtSignedUsdc(v: bigint): string {
  const sign = v < 0n ? "−" : "+";
  const abs = v < 0n ? -v : v;
  const num = Number(formatUnits(abs, USDC_DECIMALS));
  return `${sign}$${num.toFixed(2)}`;
}

function fmtUsdc(v: bigint): string {
  return `$${Number(formatUnits(v, USDC_DECIMALS)).toFixed(2)}`;
}

export function TradeTimeline({ trades }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (trades.length === 0) {
    return (
      <div
        className="border border-[var(--rule)] rounded-[var(--radius-lg)] p-8 text-center"
        style={{ background: "var(--surface-raised)" }}
      >
        <p className="caption text-[var(--ink-dim)] mb-1">No attested trades yet.</p>
        <p className="caption text-[var(--ink-faint)]" style={{ fontSize: "0.75rem" }}>
          The agent has not posted any TEE-signed trades for this epoch.
        </p>
      </div>
    );
  }

  // Show most-recent first.
  const ordered = [...trades]
    .map((t, i) => ({ trade: t, originalIdx: i }))
    .reverse();

  return (
    <>
      <div
        className="border border-[var(--rule)] rounded-[var(--radius-lg)] overflow-hidden"
        style={{ background: "var(--surface-raised)" }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-[80px_1fr_1fr_1fr_24px] gap-3 px-4 py-2.5 border-b border-[var(--rule)]"
          style={{ background: "var(--surface-locked)" }}
        >
          <span className="label" style={{ fontSize: "0.65rem" }}>#</span>
          <span className="label" style={{ fontSize: "0.65rem" }}>When</span>
          <span className="label text-right" style={{ fontSize: "0.65rem" }}>P&amp;L</span>
          <span className="label text-right" style={{ fontSize: "0.65rem" }}>Equity</span>
          <span />
        </div>

        {/* Rows — capped scroll height */}
        <div className="max-h-[420px] overflow-y-auto">
          {ordered.map(({ trade, originalIdx }) => {
            const isWin = trade.pnlDelta >= 0n;
            return (
              <button
                key={originalIdx}
                type="button"
                onClick={() => setActiveIdx(originalIdx)}
                className="w-full grid grid-cols-[80px_1fr_1fr_1fr_24px] gap-3 px-4 py-3 border-b border-[var(--rule)] last:border-b-0 text-left hover:bg-[var(--surface-locked)] transition-colors focus:outline-none focus-visible:bg-[var(--surface-locked)]"
              >
                <span
                  className="mono caption"
                  style={{ color: "var(--ink-faint)", fontSize: "0.75rem" }}
                >
                  #{originalIdx + 1}
                </span>
                <span
                  className="caption"
                  style={{ color: "var(--ink-dim)", fontSize: "0.8125rem" }}
                >
                  {relativeTime(trade.timestamp)}
                </span>
                <span
                  className="mono numeral text-right"
                  style={{
                    color: isWin ? "var(--win)" : "var(--loss)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {fmtSignedUsdc(trade.pnlDelta)}
                </span>
                <span
                  className="mono numeral text-right"
                  style={{ color: "var(--ink)", fontSize: "0.875rem" }}
                >
                  {fmtUsdc(trade.equityAfter)}
                </span>
                <span
                  className="caption text-right"
                  style={{ color: "var(--brass-dim)", fontSize: "0.875rem" }}
                  aria-hidden
                >
                  →
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeIdx !== null && trades[activeIdx] && (
        <TradeModal
          trade={trades[activeIdx]}
          index={activeIdx}
          onClose={() => setActiveIdx(null)}
        />
      )}
    </>
  );
}
