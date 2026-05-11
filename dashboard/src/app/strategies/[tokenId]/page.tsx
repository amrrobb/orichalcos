/**
 * Strategy Agent detail — `/strategies/[tokenId]`.
 *
 * The Risk-Management Protocol's headline page. Shows everything a judge needs
 * to see in 30 seconds:
 *   - Header: archetype label, tokenId, owner
 *   - StatusBadge: Idle / Active / Breached / Settled
 *   - Vault stats: bond, equity, threshold, drawdown bps, epoch countdown
 *   - Sealed soul hash chip (TEE provenance)
 *   - Equity sparkline with breach threshold dashed line
 *   - Trade timeline → modal with full attestation
 *
 * v3-only — does NOT touch v2 routes (`/apprentices/*`, `/trials/*`).
 */
"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { formatUnits } from "viem";
import {
  ARCHETYPE_LABELS,
  EXPLORER_URL,
  STRATEGY_ARCHETYPES,
  USDC_DECIMALS,
  V3_ADDRESSES,
  type StrategyArchetype,
} from "@/lib/contracts";
import { formatAddress } from "@/lib/format";
import { Mark } from "@/components/ui/Mark";
import { StatusBadge } from "@/components/strategy/StatusBadge";
import { PnlSparkline } from "@/components/strategy/PnlSparkline";
import { TradeTimeline } from "@/components/strategy/TradeTimeline";
import {
  useStrategyData,
  useStrategyOwner,
  useStrategyBreachThreshold,
} from "@/hooks/v3/useStrategyData";
import { useTradesForStrategy } from "@/hooks/v3/useTradesForStrategy";
import { BreachBanner } from "@/components/v3/BreachBanner";

export default function StrategyDetail() {
  const params = useParams<{ tokenId: string }>();
  const idStr = params.tokenId;
  const tokenId = idStr ? safeBigInt(idStr) : undefined;

  if (idStr && tokenId === undefined) notFound();

  const { data, isLoading, isError, error } = useStrategyData(tokenId);
  const { data: owner } = useStrategyOwner(tokenId);
  const { data: thresholdRead } = useStrategyBreachThreshold(tokenId);
  const { trades, isLoading: tradesLoading } = useTradesForStrategy(tokenId);

  if (tokenId === undefined) return null;

  if (isError) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
        <h1 className="display-2 mb-3" style={{ fontFamily: "var(--font-display)" }}>
          Strategy Agent #{tokenId.toString()} is not minted.
        </h1>
        <p className="caption text-[var(--ink-faint)] mb-2">
          The contract reverted on getData(tokenId).
        </p>
        {error?.message && (
          <p className="mono caption text-[var(--ink-faint)] mb-8" style={{ fontSize: "0.7rem" }}>
            {error.message.slice(0, 160)}
          </p>
        )}
        <Link
          href="/"
          className="caption text-[var(--brass-bright)] hover:underline underline-offset-4"
        >
          ← Back to landing
        </Link>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center text-[var(--ink-faint)]">
        <Mark size="medium" animate />
        <p className="caption mt-4">Decrypting strategy bindings…</p>
      </div>
    );
  }

  const archetypeStr =
    (STRATEGY_ARCHETYPES[data.archetype] as StrategyArchetype | undefined) ?? "Bold";
  const labelMeta = ARCHETYPE_LABELS[archetypeStr];

  // Threshold: use the contract's read if available, otherwise derive on-the-fly.
  // Both should agree (formula: startingBond * (10000 - maxDrawdownBps) / 10000).
  const threshold =
    (thresholdRead as bigint | undefined) ??
    (data.startingBond * (10000n - data.maxDrawdownBps)) / 10000n;

  const drawdownPct = Number(data.maxDrawdownBps) / 100;

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] transition-colors mb-6 inline-block"
      >
        ← Risk-Management Protocol
      </Link>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start mb-10 pb-10 border-b border-[var(--rule)]">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <p className="label" style={{ color: "var(--brass-bright)" }}>
              {labelMeta.label}
            </p>
            <span className="caption text-[var(--ink-faint)]">·</span>
            <p className="label" style={{ color: "var(--ink-faint)" }}>
              Strategy Agent
            </p>
          </div>
          <h1
            className="leading-[1.05] mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
              letterSpacing: "-0.005em",
            }}
          >
            {labelMeta.tagline}
            <span
              className="ml-3 mono"
              style={{
                color: "var(--brass-dim)",
                fontSize: "0.5em",
                verticalAlign: "0.4em",
                fontFamily: "var(--font-mono)",
              }}
            >
              #{tokenId.toString()}
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="caption text-[var(--ink-faint)]">Owner</span>
            <a
              href={owner ? `${EXPLORER_URL}/address/${owner}` : "#"}
              target="_blank"
              rel="noreferrer"
              className="address-chip hover:text-[var(--brass-bright)] transition-colors"
            >
              {formatAddress(owner as string | undefined)}
            </a>
            <a
              href={`${EXPLORER_URL}/address/${V3_ADDRESSES.strategyINFT}`}
              target="_blank"
              rel="noreferrer"
              className="caption text-[var(--ink-faint)] hover:text-[var(--brass-bright)] transition-colors underline-offset-4"
              style={{ fontSize: "0.7rem" }}
            >
              Contract ↗
            </a>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={data.status} />
          <EpochCountdown epochEndTs={data.epochEndTs} status={data.status} />
        </div>
      </div>

      {/* ── Live breach detection banner ──────────────────── */}
      {tokenId !== undefined && <BreachBanner tokenId={tokenId} />}

      {/* ── Vault stats + sparkline ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 mb-12">
        {/* Sparkline */}
        <div
          className="rounded-[var(--radius-lg)] border border-[var(--rule)] p-5"
          style={{ background: "var(--surface-raised)" }}
        >
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="label mb-1">Equity curve</p>
              <p
                className="caption text-[var(--ink-faint)]"
                style={{ fontSize: "0.7rem" }}
              >
                Each point = a TEE-attested trade. Dashed line is the slash threshold.
              </p>
            </div>
            <p className="mono caption text-[var(--brass-dim)]" style={{ fontSize: "0.7rem" }}>
              {trades.length} trade{trades.length === 1 ? "" : "s"}
            </p>
          </div>
          {tradesLoading && trades.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-[var(--ink-faint)]">
              <p className="caption">Loading trades…</p>
            </div>
          ) : (
            <PnlSparkline
              trades={trades}
              threshold={threshold}
              startingBond={data.startingBond}
              epochStartTs={data.epochStartTs}
            />
          )}
        </div>

        {/* Vault stats grid */}
        <div className="grid grid-cols-2 gap-4 content-start">
          <StatCard
            label="Current equity"
            value={fmtUsdc(data.currentEquity)}
            accent
          />
          <StatCard
            label="Starting bond"
            value={fmtUsdc(data.startingBond)}
          />
          <StatCard
            label="Bond on contract"
            value={fmtUsdc(data.bondAmount)}
            sub="Held as collateral"
          />
          <StatCard
            label="Slash threshold"
            value={fmtUsdc(threshold)}
            sub={`if equity ≤ ${drawdownPct.toFixed(0)}% drawdown`}
            danger
          />
          <StatCard
            label="Max drawdown"
            value={`${drawdownPct.toFixed(1)}%`}
            sub={`${data.maxDrawdownBps.toString()} bps`}
          />
          <StatCard
            label="Epoch ID"
            value={`#${data.currentEpochId.toString()}`}
            sub={data.epochStartTs > 0n ? new Date(Number(data.epochStartTs) * 1000).toLocaleDateString() : "—"}
          />
          {/* Sealed soul row spans full width */}
          <div className="col-span-2">
            <SealedSoulCard hash={data.sealedSoulRoot} />
          </div>
        </div>
      </div>

      {/* ── Trade timeline ────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="display-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Attested trades
          </h2>
          <p className="caption text-[var(--ink-faint)]">
            Every row is a TEE-signed inference + on-chain fill. Click for provenance.
          </p>
        </div>
        <TradeTimeline trades={trades} />
      </div>
    </div>
  );
}

// ─────────────────────────── helpers ───────────────────────────

function fmtUsdc(v: bigint): string {
  return `$${Number(formatUnits(v, USDC_DECIMALS)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function safeBigInt(s: string): bigint | undefined {
  if (!/^\d+$/.test(s)) return undefined;
  try {
    return BigInt(s);
  } catch {
    return undefined;
  }
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
  danger = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--rule)] p-4"
      style={{ background: "var(--surface-raised)" }}
    >
      <p className="label mb-2" style={{ fontSize: "0.65rem" }}>{label}</p>
      <p
        className="mono numeral"
        style={{
          fontSize: accent ? "1.75rem" : "1.25rem",
          color: danger
            ? "var(--loss)"
            : accent
              ? "var(--brass-bright)"
              : "var(--ink)",
          lineHeight: 1.05,
        }}
      >
        {value}
      </p>
      {sub && (
        <p className="caption text-[var(--ink-faint)] mt-1.5" style={{ fontSize: "0.7rem" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SealedSoulCard({ hash }: { hash: `0x${string}` }) {
  // First 10 chars (incl 0x) + last 8.
  const head = hash.slice(0, 10);
  const tail = hash.slice(-8);
  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--rule)] p-4"
      style={{ background: "var(--surface-raised)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="label" style={{ fontSize: "0.65rem" }}>Sealed soul</p>
        <span
          className="caption inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border"
          style={{
            color: "var(--brass-bright)",
            background: "rgba(201,169,97,0.10)",
            borderColor: "rgba(201,169,97,0.35)",
            fontSize: "0.65rem",
          }}
        >
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          🔒 sealed in 0G TEE
        </span>
      </div>
      <p className="mono text-sm" style={{ color: "var(--brass-dim)" }}>
        {head}
        <span className="text-[var(--ink-faint)]">…</span>
        {tail}
      </p>
      <p className="caption text-[var(--ink-faint)] mt-2" style={{ fontSize: "0.7rem" }}>
        Encrypted strategy weights. Decrypts only inside an Intel TDX enclave —
        the owner cannot read it.
      </p>
    </div>
  );
}

function EpochCountdown({
  epochEndTs,
  status,
}: {
  epochEndTs: bigint;
  status: number;
}) {
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  if (epochEndTs === 0n) return null;
  const end = Number(epochEndTs);
  const remaining = end - now;

  // Breached / settled — show the end time, not a live countdown.
  if (status === 2 || status === 3) {
    const d = new Date(end * 1000);
    return (
      <p className="mono caption text-[var(--ink-faint)] text-right" style={{ fontSize: "0.75rem" }}>
        Epoch ended {d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
      </p>
    );
  }

  if (remaining <= 0) {
    return (
      <p className="mono caption text-[var(--ink-faint)] text-right" style={{ fontSize: "0.75rem" }}>
        Epoch ended (awaiting settlement)
      </p>
    );
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours.toString().padStart(2, "0")}h`);
  parts.push(`${mins.toString().padStart(2, "0")}m`);
  if (days === 0) parts.push(`${secs.toString().padStart(2, "0")}s`);

  return (
    <div className="text-right">
      <p className="label mb-1" style={{ fontSize: "0.6rem" }}>Epoch ends in</p>
      <p
        className="mono numeral"
        style={{ color: "var(--brass-bright)", fontSize: "1rem", lineHeight: 1 }}
      >
        {parts.join(" ")}
      </p>
    </div>
  );
}
