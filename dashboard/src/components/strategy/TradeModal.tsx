/**
 * Modal for a single attested trade. Surfaces the full provenance chain:
 *   chatId      → 0G Compute TEE attestation id
 *   storageRoot → 0G Storage merkle root (link to chainscan address page;
 *                 a real 0G Storage explorer hookup can replace this later)
 *   hyperliquidTxHash → Hyperliquid order id (hashed; see HYPERLIQUID_NOTES.md
 *                 — explorer link is best-effort, demo trades hash mock oids).
 *
 * No portal — rendered inline as a fixed overlay. Esc/backdrop click closes.
 */
"use client";

import { useEffect } from "react";
import { formatUnits } from "viem";
import { EXPLORER_URL, USDC_DECIMALS } from "@/lib/contracts";
import type { Trade } from "@/hooks/v3/useTradesForStrategy";

interface Props {
  trade: Trade;
  index: number;
  onClose: () => void;
}

function fmtSignedUsdc(v: bigint): string {
  const sign = v < 0n ? "-" : "+";
  const abs = v < 0n ? -v : v;
  const num = Number(formatUnits(abs, USDC_DECIMALS));
  return `${sign}$${num.toFixed(2)}`;
}

function fmtUsdc(v: bigint): string {
  return `$${Number(formatUnits(v, USDC_DECIMALS)).toFixed(2)}`;
}

function fmtTs(ts: bigint): string {
  if (ts === 0n) return "—";
  const d = new Date(Number(ts) * 1000);
  return d.toUTCString();
}

export function TradeModal({ trade, index, onClose }: Props) {
  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isWin = trade.pnlDelta >= 0n;
  // bytes32 is 0x + 64 hex chars. The hashed Hyperliquid oid won't dereference
  // on the testnet explorer, so primary display is raw bytes; explorer link is
  // a best-effort secondary affordance.
  const hlExplorerUrl = `https://app.hyperliquid-testnet.xyz/explorer/order/${trade.hyperliquidTxHash}`;
  const storageExplorerUrl = `${EXPLORER_URL}/address/${trade.storageRoot}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full rounded-[var(--radius-card)] border border-[var(--rule)] p-6 max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--surface-raised)",
          boxShadow: "var(--shadow-modal)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="label mb-1">Attested trade #{index + 1}</p>
            <h2
              className="display-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Provenance
            </h2>
            <p className="caption text-[var(--ink-faint)] mt-1">{fmtTs(trade.timestamp)}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--ink-dim)] hover:text-[var(--brass-bright)] transition-colors text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>

        {/* P&L summary */}
        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-[var(--rule)]">
          <div>
            <p className="label mb-1">P&L delta</p>
            <p
              className="mono numeral"
              style={{
                fontSize: "1.5rem",
                color: isWin ? "var(--win)" : "var(--loss)",
                lineHeight: 1,
              }}
            >
              {fmtSignedUsdc(trade.pnlDelta)}
            </p>
          </div>
          <div>
            <p className="label mb-1">Equity after</p>
            <p
              className="mono numeral"
              style={{ fontSize: "1.5rem", color: "var(--ink)", lineHeight: 1 }}
            >
              {fmtUsdc(trade.equityAfter)}
            </p>
          </div>
        </div>

        {/* Provenance fields */}
        <ProvenanceField
          label="0G Compute TEE attestation"
          subtitle="Inference signed inside the trusted enclave (chatId)"
          value={trade.chatId}
        />

        <ProvenanceField
          label="0G Storage merkle root"
          subtitle="Content-addressed reasoning bundle (explorer pending)"
          value={trade.storageRoot}
          href={storageExplorerUrl}
          hrefLabel="View on chainscan"
        />

        <ProvenanceField
          label="Hyperliquid order"
          subtitle="On-chain perp fill (oid hashed to bytes32 — see HYPERLIQUID_NOTES.md)"
          value={trade.hyperliquidTxHash}
          href={hlExplorerUrl}
          hrefLabel="View on Hyperliquid"
        />

        <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-[var(--rule)]">
          <Meta label="Strategy ID" value={`#${trade.strategyId.toString()}`} />
          <Meta label="Epoch ID" value={`#${trade.epochId.toString()}`} />
        </div>
      </div>
    </div>
  );
}

function ProvenanceField({
  label,
  subtitle,
  value,
  href,
  hrefLabel,
}: {
  label: string;
  subtitle: string;
  value: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="label">{label}</p>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="caption text-[var(--brass-dim)] hover:text-[var(--brass-bright)] underline-offset-4 hover:underline"
            style={{ fontSize: "0.7rem" }}
          >
            {hrefLabel ?? "View ↗"}
          </a>
        )}
      </div>
      <p className="caption text-[var(--ink-faint)] mb-2 italic" style={{ fontSize: "0.7rem" }}>
        {subtitle}
      </p>
      <p
        className="mono text-xs break-all p-2 rounded-sm border border-[var(--rule)]"
        style={{ background: "var(--surface-locked)", color: "var(--brass-dim)" }}
      >
        {value}
      </p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label mb-1" style={{ fontSize: "0.65rem" }}>{label}</p>
      <p className="mono caption" style={{ color: "var(--ink-dim)" }}>{value}</p>
    </div>
  );
}
