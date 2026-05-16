/**
 * Route 1 — /protocol
 *
 * Allocator-side landing for the Orichalcos v3 Risk-Management Protocol.
 * Three sections:
 *   1. Hero — thesis: "Risk-management protocol for autonomous AI traders."
 *   2. Active strategies grid — every StrategyINFT with status === Active.
 *   3. LP deposit panel (sticky on lg+) — pool stats + provide liquidity.
 */
"use client";

import Link from "next/link";
import { useStrategies } from "@/hooks/v3/useStrategies";
import { useInsurancePool } from "@/hooks/v3/useInsurancePool";
import { StrategyCard } from "@/components/v3/StrategyCard";
import { LpDepositPanel } from "@/components/v3/LpDepositPanel";
import { formatUsdc } from "@/lib/v3format";
import { Mark } from "@/components/ui/Mark";

export default function ProtocolPage() {
  const { strategies, isLoading } = useStrategies();
  const pool = useInsurancePool();

  const active = strategies.filter((s) => s.statusLabel === "Active");
  const breached = strategies.filter((s) => s.statusLabel === "Breached");
  // Settled strategies that have actually run an epoch (currentEpochId > 0)
  // are the on-chain proof of the kept-promise / breach lifecycles —
  // currently tokenIds #11 (Scenario A) and #12 (Scenario B). Surfacing
  // them lets a judge browse "show me a strategy that kept its promise"
  // alongside the active ones.
  const settled = strategies.filter(
    (s) => s.statusLabel === "Idle" && s.data.currentEpochId > 0n,
  );

  return (
    <div className="max-w-[1280px] mx-auto px-6">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="pt-14 pb-10">
        <p className="label mb-4">The Protocol</p>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-start">
          <div>
            <h1
              className="text-[var(--ink)] leading-[1.05] mb-5"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                letterSpacing: "-0.01em",
              }}
            >
              Risk-management for
              <br />
              autonomous AI traders.
            </h1>
            <p className="body-lg text-[var(--ink-dim)] mb-6 max-w-xl">
              Strategy Agents post a USDC bond and pick a drawdown cap.
              Challengers stake against the agents whose promise they doubt —
              if the agent breaches its cap, the bond pays out automatically.
              Liquidity providers underwrite the protocol and earn premium
              yield plus breach residuals.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#active"
                className="px-5 py-2.5 rounded-md font-medium transition-colors"
                style={{
                  background: "var(--brass)",
                  color: "var(--surface-base)",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                }}
              >
                Browse Strategy Agents
              </a>
            </div>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3 lg:max-w-xs lg:ml-auto">
            <PoolStat
              label="Pool size"
              value={`${formatUsdc(pool.totalAssets)} USDC`}
            />
            <PoolStat
              label="Active agents"
              value={isLoading ? "—" : active.length.toString()}
            />
            <PoolStat
              label="Premium"
              value={`${(pool.premiumBps / 100).toFixed(2)}%`}
            />
          </div>
        </div>
      </section>

      {/* ── How it works mini-strip ────────────────────────────── */}
      <section className="border-y border-[var(--rule)] py-6 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step
            n="I"
            title="Agent bonds USDC"
            body="A Strategy Agent locks bond + drawdown cap. Equity is signed inside a TEE."
          />
          <Step
            n="II"
            title="Challenger places stake"
            body="Pick an agent, pay premium, mint a policy capped by remaining headroom."
          />
          <Step
            n="III"
            title="Bond pays on breach"
            body="If equity crosses the cap, anyone can mark breach. Bond pays challengers first; residual sweeps to LPs."
          />
        </div>
      </section>

      {/* ── Active strategies grid + LP panel ─────────────────── */}
      <section id="active" className="pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          <div>
            <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
              <div>
                <p className="label mb-2">Now bonded</p>
                <h2
                  className="display-2"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                  }}
                >
                  Strategy Agents
                </h2>
              </div>
              {breached.length > 0 && (
                <span
                  className="caption mono"
                  style={{ color: "var(--loss)" }}
                >
                  {breached.length} breached · settle pending
                </span>
              )}
            </div>

            {isLoading && active.length === 0 ? (
              <div className="text-center py-20 text-[var(--ink-faint)]">
                <Mark size="medium" animate />
                <p className="caption mt-4">Loading strategies…</p>
              </div>
            ) : active.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[var(--rule)] rounded-[var(--radius-lg)]">
                <p
                  className="display-3 mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  No active Strategy Agents yet.
                </p>
                <p className="caption text-[var(--ink-faint)]">
                  Once an agent bonds and starts its first epoch, it appears
                  here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {active.map((s) => (
                  <StrategyCard key={s.tokenId.toString()} entry={s} />
                ))}
              </div>
            )}

            {/* Settled strategies — proof of past lifecycle outcomes */}
            {settled.length > 0 && (
              <div className="mt-10 border-t border-[var(--rule)] pt-6">
                <p className="label mb-3" style={{ color: "var(--ink-dim)" }}>
                  Past epochs · settled on chain
                </p>
                <ul className="space-y-2">
                  {settled.map((s) => (
                    <li key={s.tokenId.toString()}>
                      <Link
                        href={`/strategies/${s.tokenId.toString()}`}
                        className="flex items-center justify-between p-3 rounded-md border border-[var(--rule)] hover:border-[var(--brass-dim)] transition-colors"
                      >
                        <span className="mono text-sm text-[var(--ink-dim)]">
                          Strategy #{s.tokenId.toString()} · epoch{" "}
                          {s.data.currentEpochId.toString()} settled
                        </span>
                        <span className="caption mono text-[var(--brass)]">
                          view dossier →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Breached strategies — informational link list */}
            {breached.length > 0 && (
              <div className="mt-10 border-t border-[var(--rule)] pt-6">
                <p className="label mb-3" style={{ color: "var(--loss)" }}>
                  Pending settlement
                </p>
                <ul className="space-y-2">
                  {breached.map((s) => (
                    <li key={s.tokenId.toString()}>
                      <Link
                        href={`/strategies/${s.tokenId.toString()}/insure`}
                        className="flex items-center justify-between p-3 rounded-md border border-[var(--rule)] hover:border-[var(--loss)] transition-colors"
                      >
                        <span className="mono text-sm text-[var(--ink-dim)]">
                          Strategy #{s.tokenId.toString()}
                        </span>
                        <span
                          className="caption mono"
                          style={{ color: "var(--loss)" }}
                        >
                          BREACHED — settle to release →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* LP panel — sticky sidebar */}
          <aside>
            <LpDepositPanel />
          </aside>
        </div>
      </section>
    </div>
  );
}

function PoolStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--rule)] rounded-[var(--radius-lg)] px-4 py-3">
      <p className="label" style={{ fontSize: "0.6rem" }}>
        {label}
      </p>
      <p
        className="mono numeral mt-1"
        style={{
          color: "var(--brass-bright)",
          fontSize: "1.4rem",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mono"
        style={{
          fontSize: "1.5rem",
          color: "var(--brass-dim)",
          lineHeight: 1,
          fontFamily: "var(--font-display)",
        }}
      >
        {n}
      </span>
      <div>
        <p
          className="display-3 leading-tight mb-1"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "1.05rem",
          }}
        >
          {title}
        </p>
        <p className="caption text-[var(--ink-dim)] leading-snug">{body}</p>
      </div>
    </div>
  );
}
