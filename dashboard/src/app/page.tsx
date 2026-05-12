/**
 * Landing page — v3 Risk-Management Protocol.
 *
 * Sections:
 *   1. Hero — pitch + CTAs to /protocol and /strategies/20 (the breach demo)
 *   2. Why this exists — three statistic cards (signal-economy crisis carries forward)
 *   3. Live demo strategies — link cards to #17, #18, #19, #20
 *   4. How it works — three roles (Trader / Allocator / LP)
 */
"use client";

import Link from "next/link";
import { Mark } from "@/components/ui/Mark";
import { StatisticCard } from "@/components/landing/StatisticCard";

export default function Home() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 pt-20 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-start">
            <div className="max-w-[640px]">
              <p className="label mb-5">Orichalcos · v3 · 0G + Hyperliquid</p>
              <h1
                className="text-[var(--ink)] leading-[1.05] mb-7"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "clamp(2.5rem, 5.5vw, 4rem)",
                  letterSpacing: "-0.01em",
                }}
              >
                Strategies stay sealed.
                <br />
                Capital stays safe.
              </h1>
              <p className="body-lg text-[var(--ink-dim)] mb-8 max-w-xl">
                A risk-management protocol for autonomous AI trading strategies. Strategies
                execute sealed inside 0G Compute TEE. Trades land on Hyperliquid testnet. Every
                fill is verifiably attested on-chain. When a strategy breaches its drawdown
                threshold, the protocol enforces the rules — no admin, no arbiter, no waiting.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Link
                  href="/strategies/20"
                  className="px-6 py-3 bg-[var(--brass)] text-[var(--surface-base)] rounded-md font-medium hover:bg-[var(--brass-bright)] transition-colors"
                  style={{ fontFamily: "var(--font-sans)", fontWeight: 600 }}
                >
                  Watch a strategy breach
                </Link>
                <Link
                  href="/protocol"
                  className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] transition-colors underline-offset-4 hover:underline"
                >
                  Open the protocol →
                </Link>
              </div>
            </div>

            {/* Mark — offset bottom-right */}
            <div className="hidden lg:flex justify-end items-end pt-12 pr-2">
              <div className="opacity-90 transform translate-y-8 -translate-x-4">
                <Mark size="large" animate />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Evidence: why this needs to exist ──────────────────── */}
      <section className="border-t border-[var(--rule)]">
        <div className="max-w-[1280px] mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 mb-12">
            <div>
              <p className="label mb-3">Why this exists</p>
              <h2
                className="display-2"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                The unverifiable
                <br />
                AI-alpha economy
              </h2>
            </div>
            <p className="body-lg text-[var(--ink-dim)] max-w-2xl">
              AI trading bots are everywhere and nobody can trust any of them. The dilemma is
              structural: if you see the strategy it stops working, if you don&apos;t see it you
              can&apos;t verify it. Today&apos;s answer is anon Twitter, fake screenshots, and rugged
              vaults. Orichalcos is the protocol that makes both sides of the deal verifiable
              without revealing the alpha.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatisticCard
              numeral="56%"
              claim="of financial influencers produce negative −2.3% monthly returns for followers"
              citation="Swiss Finance Institute · Kakhbod et al., 2023"
            />
            <StatisticCard
              numeral="69%"
              claim="of finfluencer followers targeted by fraud lose money — vs. 26% of non-followers"
              citation="FINRA Investor Education Foundation, 2024"
            />
            <StatisticCard
              numeral="$11.3B"
              claim="in U.S. crypto fraud losses; investment fraud is ~49% of all internet crime losses"
              citation="FBI IC3, 2025"
            />
          </div>
        </div>
      </section>

      {/* ── Live demo strategies ──────────────────────────────── */}
      <section id="strategies" className="border-t border-[var(--rule)]">
        <div className="max-w-[1280px] mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="label mb-3">Live on Galileo testnet</p>
              <h2
                className="display-2"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Demo strategies
              </h2>
              <p className="caption text-[var(--ink-dim)] mt-2 max-w-md">
                Each card opens a Strategy Agent. Every trade is sealed in 0G Compute,
                attested in 0G Storage, and executed as a real Hyperliquid testnet perp.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[var(--ink-dim)]">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: "var(--brass-bright)",
                  animation: "pulse 2s ease-in-out infinite",
                  boxShadow: "0 0 8px var(--brass-bright)",
                }}
              />
              <span className="label" style={{ fontSize: "0.65rem" }}>Live</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StrategyCard tokenId={17} archetype="Bold / Momentum" pnl="+13.5%" status="active" />
            <StrategyCard tokenId={18} archetype="Patient / Mean-Reversion" pnl="+5.5%" status="active" />
            <StrategyCard tokenId={19} archetype="Sharp / Microstructure" pnl="+4.1%" status="active" />
            <StrategyCard tokenId={20} archetype="Stoic / Grid" pnl="−21%" status="breach" />
          </div>
        </div>
      </section>

      {/* ── How it works — three roles ────────────────────────── */}
      <section className="border-t border-[var(--rule)]">
        <div className="max-w-[1280px] mx-auto px-6 py-20">
          <p className="label mb-3">How it works</p>
          <h2
            className="display-2 mb-12"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Three roles, one protocol
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <RoleCard
              numeral="I"
              title="Trader"
              description="Mints a Strategy Agent (INFT). Bonds USDC collateral. Runs an AI strategy sealed inside 0G Compute TEE — operator never reads the prompt or weights. Trades land on Hyperliquid testnet, attested on-chain. Wins keep their bond + reputation. Breaches fully slash the bond."
            />
            <RoleCard
              numeral="II"
              title="Allocator"
              description="Browses Strategy Agents by verified P&L curve, never seeing the strategy itself. Buys insurance: pays a premium upfront, receives a payout from the trader's bond if the strategy breaches its drawdown threshold. Protected exposure to AI alpha without the rug risk."
            />
            <RoleCard
              numeral="III"
              title="LP"
              description="Deposits USDC into the protocol pool. Earns premium yield on every policy bought. On a breach, also receives the unallocated bond residual. Zero principal risk in v3 — the protocol enforces bond ≥ max claim at policy issue time."
            />
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function StrategyCard({
  tokenId,
  archetype,
  pnl,
  status,
}: {
  tokenId: number;
  archetype: string;
  pnl: string;
  status: "active" | "breach";
}) {
  const isBreach = status === "breach";
  return (
    <Link
      href={`/strategies/${tokenId}`}
      className="block border border-[var(--rule)] rounded-[var(--radius-lg)] p-5 bg-[var(--surface-raised)] hover:border-[var(--brass-bright)] transition-colors"
    >
      <div className="flex items-baseline justify-between mb-2">
        <span className="label" style={{ fontSize: "0.7rem" }}>#{tokenId}</span>
        <span
          className="caption"
          style={{
            color: isBreach ? "var(--loss)" : "var(--win)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
          }}
        >
          {pnl}
        </span>
      </div>
      <p
        className="body-sm mb-3"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
      >
        {archetype}
      </p>
      <div className="flex items-center justify-between">
        <span
          className="label"
          style={{
            fontSize: "0.65rem",
            color: isBreach ? "var(--loss)" : "var(--ink-faint)",
          }}
        >
          {isBreach ? "READY TO BREACH" : "Active"}
        </span>
        <span className="caption text-[var(--brass-dim)]">→</span>
      </div>
    </Link>
  );
}

function RoleCard({
  numeral,
  title,
  description,
}: {
  numeral: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-[var(--rule)] rounded-[var(--radius-lg)] p-6 bg-[var(--surface-raised)]">
      <div className="flex items-baseline gap-4 mb-4">
        <span
          className="mono"
          style={{
            fontSize: "2.5rem",
            color: "var(--brass-dim)",
            lineHeight: 1,
            fontFamily: "var(--font-display)",
          }}
        >
          {numeral}
        </span>
        <h3
          className="display-3"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          {title}
        </h3>
      </div>
      <p className="body-sm text-[var(--ink-dim)] leading-relaxed">{description}</p>
    </div>
  );
}
