/**
 * Landing page — v2 per docs/USER_FLOW.md Flow 1 + DESIGN_SYSTEM.md.
 *
 * Sections (top to bottom):
 *   1. Hero — left-justified thesis + CTAs, Mark sigil offset bottom-right
 *   2. 'Why this exists' — three statistic cards (SFI 56%, FINRA 69%, FBI $11.3B)
 *   3. 'Live Trials' — feed of recent settled duels (most recent 6, append on event)
 *   4. 'How it works' — 3-step explainer
 */
"use client";

import Link from "next/link";
import { Mark } from "@/components/ui/Mark";
import { StatisticCard } from "@/components/landing/StatisticCard";
import { DuelFeedItem } from "@/components/duel/DuelFeedItem";
import { useDuelEvents } from "@/hooks/useDuelEvents";

export default function Home() {
  const { duels, isLive, isLoading } = useDuelEvents();
  const displayed = duels.slice(0, 6);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 pt-20 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-start">
            <div className="max-w-[640px]">
              <p className="label mb-5">Why this exists</p>
              <h1
                className="text-[var(--ink)] leading-[1.05] mb-7"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "clamp(2.5rem, 5.5vw, 4rem)",
                  letterSpacing: "-0.01em",
                }}
              >
                Trainers, not depositors.
                <br />
                Apprentices, not vaults.
              </h1>
              <p className="body-lg text-[var(--ink-dim)] mb-8 max-w-xl">
                A verifiable alternative to the unverifiable signal economy. Every signal sealed
                in hardware before publication. Every reasoning content-addressed and immutable.
                Every win and loss bound to an on-chain identity that cannot be reset.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <button
                  className="px-6 py-3 bg-[var(--brass)] text-[var(--surface-base)] rounded-md font-medium hover:bg-[var(--brass-bright)] transition-colors"
                  style={{ fontFamily: "var(--font-sans)", fontWeight: 600 }}
                  onClick={() => {
                    document.getElementById("live-trials")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Witness a Trial
                </button>
                <Link
                  href="/trials/champions"
                  className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] transition-colors underline-offset-4 hover:underline"
                >
                  See the Champions →
                </Link>
              </div>
            </div>

            {/* Mark — offset bottom-right per §9.5.1 */}
            <div className="hidden lg:flex justify-end items-end pt-12 pr-2">
              <div className="opacity-90 transform translate-y-8 -translate-x-4">
                <Mark size="large" animate />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 'Why this exists' — evidence wall ─────────────────── */}
      <section className="border-t border-[var(--rule)]">
        <div className="max-w-[1280px] mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 mb-12">
            <div>
              <p className="label mb-3">Evidence</p>
              <h2
                className="display-2"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                The unverifiable
                <br />
                signal economy
              </h2>
            </div>
            <p className="body-lg text-[var(--ink-dim)] max-w-2xl">
              The crypto signal subscription economy is multi-billion dollar. The academic and
              regulatory record now confirms that subscribers, in aggregate, lose money. The cause
              is structural — signals can be edited, deleted, back-dated, or rebranded after
              they&apos;re proven wrong. Reputations reset by burning a Discord and starting fresh.
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

      {/* ── Live Trials feed ──────────────────────────────────── */}
      <section id="live-trials" className="border-t border-[var(--rule)]">
        <div className="max-w-[1280px] mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="label mb-3">Live</p>
              <h2
                className="display-2"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Recent Trials
              </h2>
              <p className="caption text-[var(--ink-dim)] mt-2 max-w-md">
                Every duel below was sealed in 0G Compute, content-addressed in 0G Storage, and
                settled by Pyth. Click any to replay the Mind Reveal.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[var(--ink-dim)]">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: isLive ? "var(--brass-bright)" : "var(--brass-dim)",
                  animation: isLive ? "pulse 2s ease-in-out infinite" : "none",
                  boxShadow: isLive ? "0 0 8px var(--brass-bright)" : "none",
                }}
              />
              <span className="label" style={{ fontSize: "0.65rem" }}>
                {isLive ? "Live" : "Polling"}
              </span>
            </div>
          </div>

          {isLoading && displayed.length === 0 ? (
            <div className="text-center py-16 text-[var(--ink-faint)]">
              <span className="inline-block">
                <Mark size="medium" animate />
              </span>
              <p className="caption mt-4">Decrypting…</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-16">
              <p className="display-3 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                The Codex awaits its first entry.
              </p>
              <Link
                href="/trials/champions"
                className="caption text-[var(--brass-bright)] hover:underline underline-offset-4"
              >
                Begin a Trial →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map((d) => (
                <DuelFeedItem
                  key={d.duelId.toString()}
                  duelId={d.duelId}
                  data={d.data}
                  observedAt={d.observedAt}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="border-t border-[var(--rule)]">
        <div className="max-w-[1280px] mx-auto px-6 py-20">
          <p className="label mb-3">How it works</p>
          <h2
            className="display-2 mb-12"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Three sealed acts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HowCard
              numeral="I"
              title="Forge"
              description="Mint an Apprentice INFT. Their personality is generated inside a 0G Compute TEE, encrypted with AES-256-GCM, and uploaded to 0G Storage. The owner can hold it, transfer it, sell it — but cannot read it."
            />
            <HowCard
              numeral="II"
              title="Duel"
              description="Two Apprentices commit a binary direction call on a Pyth-fed asset. Each call is sealed inside a hardware enclave 60-180 seconds before the price moves. The reasoning is content-addressed in 0G Storage. Pyth settles."
            />
            <HowCard
              numeral="III"
              title="Reveal"
              description="The public tell unseals. Three wax seals — TEE, 0G, Pyth — settle into the duel record. ELO updates. Title progression checked. The Codex is updated forever. The track record cannot be edited."
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

function HowCard({
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
