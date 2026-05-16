/**
 * Strategy Agent detail — `/strategies/[tokenId]`.
 *
 * Redesigned per project/redesign-strategy-{17,20}.html as a single
 * dossier shell that responds to real strategy state:
 *   - breach state ▸ slim ochre breach-rule + red marker on the chart
 *     + settle card in the rail
 *   - healthy state ▸ no breach-rule, green pip in spec strip, peak
 *     marker on the chart, health-snapshot card in the rail
 */
"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { formatUnits } from "viem";
import { motion } from "framer-motion";
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
import { BreachRule } from "@/components/v3/redesign/BreachRule";
import {
  DossierEm,
  DossierEyebrow,
  DossierTitle,
} from "@/components/v3/redesign/DossierTitle";
import { SealSigil } from "@/components/v3/redesign/SealSigil";
import { SpecStrip } from "@/components/v3/redesign/SpecStrip";
import { AnnotatedEquityChart } from "@/components/v3/redesign/AnnotatedEquityChart";
import { TradeModal } from "@/components/strategy/TradeModal";
import {
  useStrategyData,
  useStrategyOwner,
  useStrategyBreachThreshold,
} from "@/hooks/v3/useStrategyData";
import { useTradesForStrategy } from "@/hooks/v3/useTradesForStrategy";
import { useStrategies } from "@/hooks/v3/useStrategies";

/**
 * Canonical outcome slugs — mirror the contract EpochStatus enum:
 *   - "breached" → trader lost; resolves to Breached OR Active-below-threshold
 *   - "settled"  → trader won (or on track); resolves to Settled OR Active-above-threshold
 *
 * Only these two slugs are accepted. Anything else falls through to the
 * numeric-id branch and 404s if not parseable. Keep the slug visible in
 * the URL — do NOT router.replace().
 */
type SlugIntent = "breached" | "settled";
// Aliases kept intentionally — README / demo URLs use /strategies/active and
// /strategies/healthy in addition to the canonical /strategies/settled.
// Do not narrow this map without sweeping the docs in lockstep.
const SLUG_INTENT: Record<string, SlugIntent> = {
  breached: "breached",
  settled: "settled",
  active: "settled",
  healthy: "settled",
};

function resolveSlug(
  intent: SlugIntent,
  strategies: ReadonlyArray<{
    tokenId: bigint;
    statusLabel: string;
    data: { currentEquity: bigint; startingBond: bigint; maxDrawdownBps: bigint };
  }>,
): bigint | undefined {
  const threshold = (s: { data: { startingBond: bigint; maxDrawdownBps: bigint } }) =>
    (s.data.startingBond * (10000n - s.data.maxDrawdownBps)) / 10000n;

  // Prefer the newest matching strategy (highest tokenId) — recent strategies
  // carry real Hyperliquid L1 tx hashes; older ones used the legacy oid encoding.
  const sorted = [...strategies].sort((a, b) => (b.tokenId > a.tokenId ? 1 : -1));

  if (intent === "breached") {
    return sorted.find(
      (s) =>
        s.statusLabel === "Breached" ||
        (s.statusLabel === "Active" && s.data.currentEquity <= threshold(s)),
    )?.tokenId;
  }
  // settled: on-chain Settled OR Active-but-above-threshold (trader winning / on track).
  return sorted.find(
    (s) =>
      s.statusLabel === "Settled" ||
      (s.statusLabel === "Active" && s.data.currentEquity > threshold(s)),
  )?.tokenId;
}

export default function StrategyDetail() {
  const params = useParams<{ tokenId: string }>();
  const idStr = params.tokenId;
  const slugKey = idStr ? idStr.toLowerCase() : "";
  const isSlug = slugKey in SLUG_INTENT;
  const numericId = idStr && !isSlug ? safeBigInt(idStr) : undefined;

  // Always call useStrategies — hooks order must be stable. Result is unused
  // unless we're resolving a slug.
  const { strategies, isLoading: stratsLoading } = useStrategies();

  const resolvedTokenId: bigint | undefined = isSlug
    ? resolveSlug(SLUG_INTENT[slugKey], strategies)
    : numericId;

  // Invalid numeric (e.g. /strategies/abc and not a known slug) → 404.
  if (idStr && !isSlug && numericId === undefined) notFound();

  // Slug-resolving — still fetching strategies.
  if (isSlug && stratsLoading && resolvedTokenId === undefined) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center text-[var(--ink-faint)]">
        <Mark size="medium" animate />
        <p className="caption mt-4">Resolving strategy…</p>
      </div>
    );
  }

  // Slug resolved with no match (legitimate empty state — don't 404).
  if (isSlug && !stratsLoading && resolvedTokenId === undefined) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
        <h1 className="display-2 mb-3" style={{ fontFamily: "var(--font-display)" }}>
          No wager in this state right now.
        </h1>
        <p className="caption text-[var(--ink-faint)] mb-8">
          Open <code>/protocol</code> to browse active wagers, or <code>/wagers/new</code> to mint one.
        </p>
        <Link
          href="/protocol"
          className="caption text-[var(--brass-bright)] hover:underline underline-offset-4"
        >
          ← Browse all wagers
        </Link>
      </div>
    );
  }

  return <StrategyDetailInner tokenId={resolvedTokenId} />;
}

function StrategyDetailInner({ tokenId }: { tokenId: bigint | undefined }) {

  const { data, isLoading, isError, error } = useStrategyData(tokenId);
  const { data: owner } = useStrategyOwner(tokenId);
  const { data: thresholdRead } = useStrategyBreachThreshold(tokenId);
  const { trades, isLoading: tradesLoading } = useTradesForStrategy(tokenId);
  // Active trade index for the provenance modal (0-based into trades[]).
  const [activeTradeIdx, setActiveTradeIdx] = useState<number | null>(null);

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
  const threshold =
    (thresholdRead as bigint | undefined) ??
    (data.startingBond * (10000n - data.maxDrawdownBps)) / 10000n;
  const drawdownPct = Number(data.maxDrawdownBps) / 100;
  const isBreached = data.status === 2;

  const startingBondUsdc = Number(formatUnits(data.startingBond, USDC_DECIMALS));
  const currentEquityUsdc = Number(formatUnits(data.currentEquity, USDC_DECIMALS));
  const thresholdUsdc = Number(formatUnits(threshold, USDC_DECIMALS));
  const pctFromStart =
    startingBondUsdc > 0
      ? ((currentEquityUsdc - startingBondUsdc) / startingBondUsdc) * 100
      : 0;
  const headroomUsdc = currentEquityUsdc - thresholdUsdc;

  const taglineWords = labelMeta.tagline.split(" ");
  const leadWord = taglineWords[0];
  const remainder = taglineWords.slice(1).join(" ");

  const sealedHashShort = `${data.sealedSoulRoot.slice(0, 6)}…${data.sealedSoulRoot.slice(-4)}`;

  return (
    <>
      <BreachRule
        visible={isBreached}
        label="Drawdown breached"
        message={
          <>
            Equity fell below the{" "}
            <strong style={{ color: "var(--ink)" }}>
              {fmt(thresholdUsdc)} USDC
            </strong>{" "}
            slash threshold. Settlement is open to anyone.
          </>
        }
        jumpHref="#settle"
        jumpLabel="Jump to settlement →"
      />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "1.5rem 2rem 4rem" }}>
        {/* Crumb */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--ink-faint)",
            letterSpacing: "0.05em",
            marginBottom: "1.75rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Link href="/" style={{ color: "var(--ink-dim)" }}>Protocol</Link>
          <span style={{ color: "var(--ink-ghost)" }}>/</span>
          <span style={{ color: "var(--ink-dim)" }}>Strategies</span>
          <span style={{ color: "var(--ink-ghost)" }}>/</span>
          <span>#{tokenId.toString()}</span>
        </div>

        {/* Dossier title + sealed sigil */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "2rem",
            alignItems: "end",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid var(--rule)",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <DossierEyebrow
              items={[
                "Strategy Agent",
                "·",
                `#${tokenId.toString()}`,
                "·",
                `${labelMeta.label} · ${labelMeta.tagline}`,
              ]}
            />
            <DossierTitle>
              {leadWord} <DossierEm>{remainder}</DossierEm>
            </DossierTitle>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{
                marginTop: "0.85rem",
                color: "var(--ink-dim)",
                fontSize: "1rem",
                lineHeight: 1.55,
                maxWidth: "56ch",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--brass)",
                  border: "1px solid var(--brass-deep)",
                  background: "rgba(212,165,116,0.06)",
                  padding: "0.15rem 0.5rem",
                  borderRadius: 3,
                  marginRight: "0.4rem",
                  verticalAlign: 1,
                }}
              >
                You are inspecting
              </span>
              an autonomous AI strategy. Its weights are sealed inside 0G&apos;s TEE — the operator
              can&apos;t read it and you can&apos;t either. What you <DossierEm>can</DossierEm> verify is
              every trade it signed, on chain, and whether it&apos;s {isBreached ? "kept" : "keeping"}{" "}
              its drawdown promise.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.65rem",
              minWidth: 140,
            }}
          >
            <SealSigil size="medium" />
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--brass)",
              }}
            >
              Sealed in 0G TEE
            </div>
            <a
              href={`${EXPLORER_URL}/address/${V3_ADDRESSES.strategyINFT}`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "var(--ink-dim)",
              }}
            >
              {sealedHashShort}
            </a>
          </motion.div>
        </div>

        {/* Spec strip */}
        <SpecStrip
          cells={[
            {
              k: "Owner",
              v: formatAddress(owner as string | undefined),
              sub: "trader address",
            },
            {
              k: "Status",
              v: isBreached ? "● Breached" : "● Active",
              tone: isBreached ? "warn" : "win",
              sub: isBreached ? "settlement open" : "epoch live",
            },
            {
              k: "Current equity",
              v: fmt(currentEquityUsdc),
              unit: "USDC",
              tone: isBreached ? "warn" : "win",
              sub: `${pctFromStart >= 0 ? "+" : ""}${pctFromStart.toFixed(1)}% from start`,
            },
            {
              k: "Bond posted",
              v: fmt(startingBondUsdc),
              unit: "USDC",
              sub: "held as collateral",
            },
            {
              k: "Slash threshold",
              v: fmt(thresholdUsdc),
              unit: "USDC",
              tone: isBreached ? "warn" : "default",
              sub: `at ${drawdownPct.toFixed(0)}% drawdown`,
            },
            {
              k: "Trades",
              v: trades.length.toString(),
              unit: "attested",
              tone: "brass",
              sub: "all TEE-signed",
            },
          ]}
        />

        {/* Main layout */}
        <div className="strat-layout">
          <div>
            {/* Chart hero */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                border: "1px solid var(--rule)",
                borderRadius: 8,
                background:
                  "linear-gradient(180deg, var(--surface-raised), var(--surface-deep))",
                padding: "1.5rem 1.5rem 1rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem", letterSpacing: "-0.005em" }}>
                    Equity curve
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-dim)" }}>
                    Each point is a TEE-attested fill on Hyperliquid. The dashed line is the slash threshold.
                  </p>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "var(--brass-dim)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {trades.length} / {trades.length} trades attested
                </div>
              </div>

              <div style={{ position: "relative", height: 440 }}>
                {tradesLoading && trades.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ink-faint)" }}>
                    <p className="caption">Loading trades…</p>
                  </div>
                ) : (
                  <AnnotatedEquityChart
                    trades={trades}
                    threshold={threshold}
                    startingBond={data.startingBond}
                    breached={isBreached}
                  />
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--rule)",
                  flexWrap: "wrap",
                  fontSize: "0.78rem",
                  color: "var(--ink-dim)",
                }}
              >
                <Swatch /> Equity (TEE-attested)
                <Swatch dashed /> Slash threshold
                <Swatch dot={isBreached ? "breach" : "peak"} />{" "}
                {isBreached ? "Breach event" : "Local peak"}
                <span style={{ marginLeft: "auto", color: "var(--ink-faint)" }}>
                  Hover the equity row for full provenance →
                </span>
              </div>
            </motion.div>

            {/* Narrative strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
                marginTop: "1.5rem",
              }}
              className="narrative-grid"
            >
              {(isBreached
                ? [
                    {
                      n: "I.",
                      h: "What this agent did",
                      p: (
                        <>
                          Posted a <Code>{fmt(startingBondUsdc)}</Code> USDC bond, ran sealed for an epoch,
                          took {trades.length} trades on Hyperliquid. Drifted into a losing streak and crossed
                          its own {drawdownPct.toFixed(0)}% drawdown promise.
                        </>
                      ),
                    },
                    {
                      n: "II.",
                      h: "What happens now",
                      p: (
                        <>
                          Anyone can call <Code>markBreach()</Code> on chain. Bond pays open policies first,
                          residual sweeps to the LP pool. Trader receives <Code>0</Code>.
                        </>
                      ),
                    },
                    {
                      n: "III.",
                      h: "Why you'd care",
                      p: <>If you&apos;d bought coverage before the breach, your claim is now live. If you&apos;re an LP, residuals from this bond flow to the pool you back.</>,
                    },
                  ]
                : [
                    {
                      n: "I.",
                      h: "What this agent is doing",
                      p: (
                        <>
                          Posted a <Code>{fmt(startingBondUsdc)}</Code> USDC bond, running sealed inside 0G TEE.
                          {trades.length} trades in this epoch — net{" "}
                          <Code>
                            {pctFromStart >= 0 ? "+" : ""}{pctFromStart.toFixed(1)}%
                          </Code>{" "}
                          on Hyperliquid.
                        </>
                      ),
                    },
                    {
                      n: "II.",
                      h: "What happens at epoch end",
                      p: (
                        <>
                          If equity stays above <Code>{fmt(thresholdUsdc)}</Code>, the bond returns to the trader
                          and premiums stay with the LP pool as yield. Your policy expires worthless.
                        </>
                      ),
                    },
                    {
                      n: "III.",
                      h: "Why you'd care",
                      p: (
                        <>
                          A healthy strategy with <Code>{fmt(Math.max(0, headroomUsdc))}</Code> USDC of headroom is a
                          candidate to insure — bond can pay you up to the available headroom on breach.
                        </>
                      ),
                    },
                  ]
              ).map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    border: "1px solid var(--rule)",
                    borderRadius: 6,
                    padding: "1.15rem 1.15rem 1rem",
                    background: "var(--surface-raised)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      color: "var(--brass)",
                      fontStyle: "italic",
                      fontWeight: 400,
                      lineHeight: 1,
                      marginBottom: "0.65rem",
                    }}
                  >
                    {step.n}
                  </div>
                  <h4
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      marginBottom: "0.35rem",
                      color: "var(--ink)",
                    }}
                  >
                    {step.h}
                  </h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--ink-dim)", lineHeight: 1.5 }}>
                    {step.p}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Provenance ledger */}
            <ProvenanceLedger
              trades={trades}
              isBreached={isBreached}
              threshold={threshold}
              onRowClick={(i) => setActiveTradeIdx(i)}
            />
          </div>

          {/* Sticky right rail */}
          <aside className="strat-rail">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{
                border: "1px solid var(--brass-deep)",
                borderRadius: 8,
                background:
                  "linear-gradient(180deg, rgba(212,165,116,0.06), rgba(212,165,116,0.01)), var(--surface-raised)",
                boxShadow:
                  "0 0 0 1px rgba(212,165,116,0.05), 0 20px 40px -20px rgba(212,165,116,0.15)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "1.1rem 1.25rem 0.75rem", borderBottom: "1px solid var(--rule)" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    color: "var(--brass)",
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    marginBottom: "0.35rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>★</span> Start here · Challenger
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 600, lineHeight: 1.1 }}>
                  Stake against this agent
                </h3>
                <p style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "var(--ink-dim)", lineHeight: 1.5 }}>
                  Pay{" "}
                  <span style={{ color: "var(--brass)", fontFamily: "var(--font-mono)" }}>
                    12.50%
                  </span>{" "}
                  premium up-front. If the strategy breaches its drawdown
                  {isBreached ? "" : " before epoch end"}, the bond pays you back up to your claim cap.
                </p>
              </div>
              <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
                <RailRow k="Headroom available" v={`${fmt(Math.max(0, Number(formatUnits(data.bondAmount, USDC_DECIMALS))))} USDC`} tone="brass" />
                <RailRow k="Premium rate" v="12.50%" />
                {!isBreached && (
                  <RailRow
                    k="Strategy P&L"
                    v={`${pctFromStart >= 0 ? "+" : ""}${pctFromStart.toFixed(1)}%`}
                    tone={pctFromStart >= 0 ? "win" : "warn"}
                  />
                )}
                <RailRow k="Epoch closes in" v={<EpochCountdownInline epochEndTs={data.epochEndTs} status={data.status} />} tone={isBreached ? "warn" : "brass"} />
                <Link
                  href={`/strategies/${tokenId.toString()}/insure`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    marginTop: "1rem",
                    padding: "0.85rem 1rem",
                    background: "var(--brass)",
                    color: "var(--surface-base)",
                    borderRadius: 6,
                    fontFamily: "var(--font-sans)",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    transition: "background 0.12s",
                  }}
                >
                  Buy coverage
                  <span style={{ marginLeft: "0.5rem", fontFamily: "var(--font-display)" }}>→</span>
                </Link>
                <p style={{ marginTop: "0.65rem", fontSize: "0.72rem", color: "var(--ink-faint)", textAlign: "center", lineHeight: 1.4 }}>
                  Pays immediately on settlement if breach is marked.
                  <br />
                  Premium stays in the LP pool either way.
                </p>
              </div>
            </motion.div>

            {/* State-conditional card: breach → settle; healthy → health snapshot */}
            {isBreached ? (
              <SettleCard tokenId={tokenId} />
            ) : (
              <HealthSnapshot
                currentEquityUsdc={currentEquityUsdc}
                thresholdUsdc={thresholdUsdc}
              />
            )}

            {/* Other roles */}
            <div
              style={{
                border: "1px solid var(--rule)",
                borderRadius: 8,
                background: "var(--surface-raised)",
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "var(--ink-faint)",
                }}
              >
                Other roles
              </div>
              <AltRole
                name="I'm the trader"
                sub={`${formatAddress(owner as string | undefined)} — ${isBreached ? "settle & mint a new agent" : "top up bond, mint v2"}`}
              />
              <AltRole
                name="I'm an LP"
                sub="Deposit to the pool, earn from premiums & slashed bonds"
              />
            </div>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        .strat-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
          align-items: start;
        }
        .strat-rail {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        @media (max-width: 1100px) {
          .strat-layout { grid-template-columns: 1fr; }
          .strat-rail { position: static !important; }
        }
        @media (max-width: 720px) {
          .narrative-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {activeTradeIdx !== null && trades[activeTradeIdx] && (
        <TradeModal
          trade={trades[activeTradeIdx]}
          index={activeTradeIdx}
          onClose={() => setActiveTradeIdx(null)}
        />
      )}
    </>
  );
}

// ────────────────────── helpers + small pieces ─────────────────────

function safeBigInt(s: string): bigint | undefined {
  if (!/^\d+$/.test(s)) return undefined;
  try { return BigInt(s); } catch { return undefined; }
}

function fmt(v: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      fontFamily: "var(--font-mono)",
      fontSize: "0.78rem",
      color: "var(--brass)",
      background: "rgba(212,165,116,0.07)",
      padding: "0 0.3rem",
      borderRadius: 3,
    }}>{children}</code>
  );
}

function Swatch({ dashed, dot }: { dashed?: boolean; dot?: "breach" | "peak" }) {
  if (dot === "breach") {
    return (
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--loss)",
          boxShadow: "0 0 6px rgba(217,118,118,0.6)",
        }}
      />
    );
  }
  if (dot === "peak") {
    return (
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--win)",
          boxShadow: "0 0 6px rgba(136,200,112,0.6)",
        }}
      />
    );
  }
  return (
    <span
      style={{
        display: "inline-block",
        width: 18,
        height: 2,
        background: dashed
          ? "repeating-linear-gradient(90deg, var(--loss) 0 4px, transparent 4px 8px)"
          : "var(--brass)",
      }}
    />
  );
}

function RailRow({
  k,
  v,
  tone,
}: {
  k: string;
  v: React.ReactNode;
  tone?: "brass" | "warn" | "win";
}) {
  const color =
    tone === "brass"
      ? "var(--brass)"
      : tone === "warn"
        ? "var(--loss)"
        : tone === "win"
          ? "var(--win)"
          : "var(--ink)";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "0.45rem 0",
        borderBottom: "1px dashed var(--rule)",
        fontSize: "0.83rem",
      }}
    >
      <span style={{ color: "var(--ink-dim)" }}>{k}</span>
      <span style={{ fontFamily: "var(--font-mono)", color }}>{v}</span>
    </div>
  );
}

function AltRole({ name, sub }: { name: string; sub: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.55rem 0",
        borderTop: "1px solid var(--rule)",
        fontSize: "0.85rem",
        color: "var(--ink-dim)",
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ color: "var(--ink)", fontWeight: 500 }}>{name}</div>
        <small
          style={{
            display: "block",
            color: "var(--ink-faint)",
            fontWeight: 400,
            fontSize: "0.74rem",
            marginTop: "0.15rem",
          }}
        >
          {sub}
        </small>
      </div>
      <span style={{ color: "var(--brass-dim)", fontFamily: "var(--font-display)" }}>→</span>
    </div>
  );
}

function SettleCard({ tokenId }: { tokenId: bigint }) {
  return (
    <motion.div
      id="settle"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        border: "1px solid rgba(217,118,118,0.3)",
        background:
          "linear-gradient(180deg, rgba(217,118,118,0.05), rgba(217,118,118,0.01)), var(--surface-raised)",
        borderRadius: 8,
        padding: "1.1rem 1.25rem",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "var(--loss)",
          marginBottom: "0.4rem",
        }}
      >
        ⚠ Settlement open · anyone
      </div>
      <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.4rem" }}>
        Mark breach &amp; settle
      </h4>
      <p style={{ fontSize: "0.78rem", color: "var(--ink-dim)", lineHeight: 1.5, marginBottom: "0.85rem" }}>
        Bond pays open stakes first, residual sweeps to LPs. Trader receives 0.
        Anyone can call — the trader, a challenger, or a passing keeper.
      </p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Link
          href={`/strategies/${tokenId.toString()}`}
          style={{
            flex: 1,
            padding: "0.6rem 0.5rem",
            fontFamily: "var(--font-sans)",
            fontSize: "0.78rem",
            fontWeight: 600,
            borderRadius: 5,
            background: "var(--loss)",
            color: "var(--surface-base)",
            textAlign: "center",
          }}
        >
          Mark breach
        </Link>
        <button
          disabled
          style={{
            flex: 1,
            padding: "0.6rem 0.5rem",
            fontFamily: "var(--font-sans)",
            fontSize: "0.78rem",
            fontWeight: 600,
            borderRadius: 5,
            background: "transparent",
            color: "var(--ink-faint)",
            border: "1px solid var(--rule)",
            cursor: "not-allowed",
          }}
        >
          Settle epoch
        </button>
      </div>
    </motion.div>
  );
}

function HealthSnapshot({
  currentEquityUsdc,
  thresholdUsdc,
}: {
  currentEquityUsdc: number;
  thresholdUsdc: number;
}) {
  const headroomAbs = Math.max(0, currentEquityUsdc - thresholdUsdc);
  const headroomPct =
    thresholdUsdc > 0 ? (headroomAbs / thresholdUsdc) * 100 : 0;
  // Bar fills 0–100% relative to "twice the threshold" — a soft visual cap.
  const fillPct = Math.min(100, (currentEquityUsdc / (thresholdUsdc * 1.6)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        border: "1px solid var(--rule)",
        background:
          "linear-gradient(180deg, rgba(136,200,112,0.04), rgba(136,200,112,0)), var(--surface-raised)",
        borderRadius: 8,
        padding: "1.1rem 1.25rem",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "var(--win)",
          marginBottom: "0.45rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--win)",
            boxShadow: "0 0 6px var(--win)",
          }}
        />
        Healthy · drawdown ${headroomAbs.toFixed(0)} away
      </div>
      <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.4rem" }}>
        Bond fully solvent
      </h4>
      <p style={{ fontSize: "0.78rem", color: "var(--ink-dim)", lineHeight: 1.5 }}>
        Equity is{" "}
        <strong style={{ color: "var(--win)" }}>+{headroomPct.toFixed(1)}%</strong>{" "}
        above the slash threshold.
      </p>
      <div
        style={{
          marginTop: "0.9rem",
          height: 6,
          borderRadius: 3,
          background: "var(--surface-locked)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{
            height: "100%",
            background: "linear-gradient(90deg, var(--brass-dim), var(--win))",
            borderRadius: 3,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.4rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
        }}
      >
        <span style={{ color: "var(--loss)" }}>${thresholdUsdc.toFixed(0)} breach</span>
        <span style={{ color: "var(--win)" }}>${currentEquityUsdc.toFixed(0)} now</span>
      </div>
    </motion.div>
  );
}

function ProvenanceLedger({
  trades,
  isBreached,
  threshold,
  onRowClick,
}: {
  trades: readonly import("@/hooks/v3/useTradesForStrategy").Trade[];
  isBreached: boolean;
  threshold: bigint;
  onRowClick: (tradesIdx: number) => void;
}) {
  // idx = 1-based human label. tradesIdx = 0-based index into the original trades[] array.
  const rows = trades
    .map((t, i) => ({ trade: t, idx: i + 1, tradesIdx: i }))
    .slice()
    .sort((a, b) => b.idx - a.idx);

  // Marker idx in the chart (peak vs breach) — mirrors AnnotatedEquityChart.
  const equityNums = trades.map((t) => Number(formatUnits(t.equityAfter, USDC_DECIMALS)));
  const thresholdNum = Number(formatUnits(threshold, USDC_DECIMALS));
  let markerOriginalIdx = -1;
  if (isBreached) {
    for (let i = 0; i < equityNums.length; i++) {
      if (equityNums[i] <= thresholdNum) { markerOriginalIdx = i + 1; break; }
    }
  } else if (equityNums.length > 0) {
    let bestIdx = 0;
    for (let i = 1; i < equityNums.length; i++) if (equityNums[i] > equityNums[bestIdx]) bestIdx = i;
    markerOriginalIdx = bestIdx + 1;
  }

  return (
    <section
      id="ledger"
      style={{
        marginTop: "2.5rem",
        border: "1px solid var(--rule)",
        borderRadius: 8,
        background: "var(--surface-raised)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "1.25rem 1.5rem 0.85rem",
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 600, marginBottom: "0.2rem" }}>
            Provenance ledger
          </h3>
          <p style={{ fontSize: "0.83rem", color: "var(--ink-faint)" }}>
            Every row is a TEE-signed inference + on-chain fill. Click to verify on the 0G explorer.
          </p>
        </div>
        <a
          href={`${EXPLORER_URL}/address/${V3_ADDRESSES.tradeAttestation}`}
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "var(--brass)",
            border: "1px solid var(--brass-deep)",
            background: "rgba(212,165,116,0.06)",
            padding: "0.45rem 0.75rem",
            borderRadius: 4,
            whiteSpace: "nowrap",
          }}
        >
          Verify all on 0G ↗
        </a>
      </div>
      <div style={{ maxHeight: 480, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["#", "When", "P&L", "Equity", "Order", ""].map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: "left",
                    padding: "0.7rem 1.5rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    color: "var(--brass-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    borderBottom: "1px solid var(--rule)",
                    background: "var(--surface-deep)",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--ink-faint)", fontSize: "0.85rem" }}>
                  No attested trades yet for this epoch.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const pnlNum = Number(formatUnits(r.trade.pnlDelta, USDC_DECIMALS));
              const eqNum = Number(formatUnits(r.trade.equityAfter, USDC_DECIMALS));
              const pnlTone = pnlNum > 0 ? "win" : pnlNum < 0 ? "loss" : "flat";
              const isMarker = r.idx === markerOriginalIdx;
              const isBreachRow = isBreached && eqNum <= thresholdNum;
              const rowTint =
                isBreachRow ? "rgba(217,118,118,0.04)" : isMarker ? "rgba(136,200,112,0.04)" : "transparent";
              const idxColor = isBreachRow ? "var(--loss)" : isMarker ? "var(--win)" : "var(--ink-faint)";
              // Decode hyperliquid order hash: top 192 bits zero ⇒ real uint64 oid.
              let hlOrderUrl: string | null = null;
              try {
                const oidBig = BigInt(r.trade.hyperliquidTxHash);
                if (oidBig > 0n && oidBig < (1n << 64n)) {
                  hlOrderUrl = `https://app.hyperliquid-testnet.xyz/explorer/order/${oidBig.toString()}`;
                }
              } catch {
                hlOrderUrl = null;
              }
              return (
                <tr
                  key={r.idx}
                  onClick={() => onRowClick(r.tradesIdx)}
                  style={{
                    background: rowTint,
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "rgba(212,165,116,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = rowTint;
                  }}
                >
                  <td style={td({ color: idxColor, width: 60, fontWeight: 600 })}>#{r.idx}</td>
                  <td style={td({ width: 110 })}>{relativeTime(r.trade.timestamp)}</td>
                  <td style={td({ color: pnlTone === "win" ? "var(--win)" : pnlTone === "loss" ? "var(--loss)" : "var(--ink-faint)" })}>
                    {pnlNum > 0 ? "+" : ""}${pnlNum.toFixed(2)}
                  </td>
                  <td style={td({ color: isBreachRow ? "var(--loss)" : "var(--ink)", textAlign: "right" })}>
                    ${eqNum.toFixed(2)}
                  </td>
                  <td style={td({ color: "var(--brass-dim)" })}>
                    {hlOrderUrl ? (
                      <a
                        href={hlOrderUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "var(--brass)", textDecoration: "none" }}
                      >
                        {r.trade.hyperliquidTxHash.slice(0, 12)}… ↗
                      </a>
                    ) : (
                      <span>{r.trade.hyperliquidTxHash.slice(0, 12)}… ↗</span>
                    )}
                  </td>
                  <td style={td({ color: "var(--brass-dim)", width: 24, textAlign: "right" })}>→</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function td(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: "0.85rem 1.5rem",
    borderBottom: "1px solid var(--rule)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.85rem",
    color: "var(--ink-dim)",
    ...extra,
  };
}

function relativeTime(ts: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - Number(ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function EpochCountdownInline({
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

  if (epochEndTs === 0n) return <>—</>;
  const remaining = Number(epochEndTs) - now;
  if (status === 2 || status === 3 || remaining <= 0) return <>ended</>;

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  if (days > 0) return <>{days}d {hours}h</>;
  return <>{hours}h {mins.toString().padStart(2, "0")}m</>;
}
