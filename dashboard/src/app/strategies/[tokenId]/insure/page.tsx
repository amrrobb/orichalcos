/**
 * Route 2 — /strategies/[tokenId]/insure
 *
 * Allocator buy-policy form. Redesigned per project/redesign-insure.html:
 * sizing block ▸ dual-outcome scenarios ▸ sticky cart with two-step
 * approve→buy mapped onto the real useBuyPolicy state machine.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { useStrategies, useStrategy } from "@/hooks/v3/useStrategies";
import { useAllocatedCoverage } from "@/hooks/v3/useAllPolicies";
import { useBuyPolicy } from "@/hooks/v3/useBuyPolicy";
import { useUsdcBalance } from "@/hooks/v3/useUsdcBalance";
import { useInsurancePool } from "@/hooks/v3/useInsurancePool";
import {
  archetypeMeta,
  formatRemaining,
  formatUsdc,
  parseUsdcInput,
} from "@/lib/v3format";
import { formatAddress } from "@/lib/format";
import { EXPLORER_URL, USDC_DECIMALS, V3_PREMIUM_BPS_DEFAULT } from "@/lib/contracts";
import { Mark } from "@/components/ui/Mark";
import { BreachRule } from "@/components/v3/redesign/BreachRule";
import {
  DossierEm,
  DossierEyebrow,
  DossierTitle,
} from "@/components/v3/redesign/DossierTitle";
import { SealSigil } from "@/components/v3/redesign/SealSigil";
import { SectionEyebrow, SerifHeading } from "@/components/v3/redesign/SectionEyebrow";

/**
 * Canonical outcome slugs — mirror /strategies/[tokenId]/page.tsx:
 *   - "breached" → trader lost; Breached OR Active-below-threshold
 *   - "settled"  → trader won / on track; Settled OR Active-above-threshold
 */
type InsureSlugIntent = "breached" | "settled";
// Aliases kept intentionally — README / demo URLs use /strategies/active and
// /strategies/healthy in addition to /strategies/settled. Do not narrow this
// map without sweeping the docs in lockstep.
const INSURE_SLUG_INTENT: Record<string, InsureSlugIntent> = {
  breached: "breached",
  settled: "settled",
  active: "settled",
  healthy: "settled",
};

function resolveInsureSlug(
  intent: InsureSlugIntent,
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
  return sorted.find(
    (s) =>
      s.statusLabel === "Settled" ||
      (s.statusLabel === "Active" && s.data.currentEquity > threshold(s)),
  )?.tokenId;
}

export default function InsurePage() {
  const params = useParams<{ tokenId: string }>();
  const idStr = params.tokenId;
  const slugKey = idStr ? idStr.toLowerCase() : "";
  const isSlug = slugKey in INSURE_SLUG_INTENT;
  const numericId = idStr && !isSlug && /^\d+$/.test(idStr) ? BigInt(idStr) : undefined;

  // Hooks must run unconditionally — call useStrategies always, use result only for slugs.
  const { strategies, isLoading: stratsLoading } = useStrategies();
  const resolvedFromSlug = isSlug
    ? resolveInsureSlug(INSURE_SLUG_INTENT[slugKey], strategies)
    : undefined;
  const tokenId: bigint | undefined = isSlug ? resolvedFromSlug : numericId;

  if (idStr && !isSlug && numericId === undefined) notFound();

  const router = useRouter();
  const { address, isConnected } = useAccount();
  const strat = useStrategy(tokenId);
  const allocatedQ = useAllocatedCoverage(tokenId, strat.data?.currentEpochId);
  const pool = useInsurancePool();
  const usdcBal = useUsdcBalance();
  const buyFlow = useBuyPolicy();

  // Coverage amount, in USDC units (whole-USDC granularity in the slider).
  const [amount, setAmount] = useState<string>("");

  // After buy confirms — refresh state, hand off to detail page in 1.5s.
  useEffect(() => {
    if (buyFlow.isConfirmed && tokenId !== undefined) {
      strat.refetch();
      allocatedQ.refetch();
      usdcBal.refetch();
      pool.refetch();
      const t = setTimeout(() => {
        router.push(`/strategies/${tokenId.toString()}`);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [buyFlow.isConfirmed, tokenId, router, strat, allocatedQ, usdcBal, pool]);

  const data = strat.data;
  const meta = data ? archetypeMeta(data.archetype) : null;
  const allocated = (allocatedQ.data as bigint | undefined) ?? 0n;
  const premiumBps = pool.premiumBps ?? V3_PREMIUM_BPS_DEFAULT;
  const parsed = parseUsdcInput(amount);

  const premium = useMemo(() => {
    if (parsed === null || parsed <= 0n) return 0n;
    return (parsed * BigInt(premiumBps)) / 10000n;
  }, [parsed, premiumBps]);

  // Headroom = bondAmount − allocated, as USDC (6dp) bigint.
  const headroom = data ? data.bondAmount - allocated : 0n;
  const headroomNum = Number(headroom) / 10 ** USDC_DECIMALS;
  const maxCoverage = Math.max(0, Math.floor(headroomNum));

  const amtNum = parsed ? Number(parsed) / 10 ** USDC_DECIMALS : 0;
  const premiumNum = (amtNum * premiumBps) / 10000;
  const winNet = amtNum - premiumNum;
  const lossNet = -premiumNum;

  // Validations
  const isOwnerOfStrategy =
    !!address &&
    !!strat.owner &&
    address.toLowerCase() === strat.owner.toLowerCase();
  const exceedsBond =
    parsed !== null && data !== undefined && allocated + parsed > data.bondAmount;
  const balance = usdcBal.data as bigint | undefined;
  const insufficient =
    parsed !== null && balance !== undefined && premium > balance;
  const notActive = data !== undefined && data.status !== 1;
  const isBreached = data !== undefined && data.status === 2;

  const valid =
    isConnected &&
    !isOwnerOfStrategy &&
    !exceedsBond &&
    !insufficient &&
    !notActive &&
    parsed !== null &&
    parsed > 0n;

  // Slug resolved with no matching strategy.
  if (isSlug && !stratsLoading && tokenId === undefined) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
        <h1 className="display-2 mb-3" style={{ fontFamily: "var(--font-display)" }}>
          No wager in this state right now.
        </h1>
        <p className="caption text-[var(--ink-faint)] mb-8">
          Nothing to insure in this view.
        </p>
        <Link
          href="/protocol"
          className="caption text-[var(--brass-bright)] hover:underline underline-offset-4"
        >
          ← Back to the protocol
        </Link>
      </div>
    );
  }

  if (isSlug && stratsLoading && tokenId === undefined) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center text-[var(--ink-faint)]">
        <Mark size="medium" animate />
        <p className="caption mt-4">Resolving strategy…</p>
      </div>
    );
  }

  if (strat.isLoading || !data || !meta) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center text-[var(--ink-faint)]">
        <Mark size="medium" animate />
        <p className="caption mt-4">Reading strategy…</p>
      </div>
    );
  }

  if (strat.isError) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
        <h1 className="display-2 mb-3" style={{ fontFamily: "var(--font-display)" }}>
          This strategy does not exist.
        </h1>
        <Link
          href="/protocol"
          className="caption text-[var(--brass-bright)] hover:underline underline-offset-4"
        >
          ← Back to the protocol
        </Link>
      </div>
    );
  }

  const step = buyFlow.step;
  const approveDone =
    step === "executing" || step === "confirmed" || step === "approving";
  const buyArmed = step === "executing" || step === "confirmed";

  return (
    <>
      <BreachRule
        visible={isBreached}
        label="Coverage time-sensitive"
        message={
          <>
            Strategy #{tokenId?.toString()} is <strong style={{ color: "var(--ink)" }}>already in breach</strong>.
            Buying coverage before settlement = claim pays on next{" "}
            <code style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>markBreach()</code>.
          </>
        }
        jumpHref={`/strategies/${tokenId?.toString()}`}
        jumpLabel="← Strategy detail"
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
          <Link href={`/strategies/${tokenId?.toString()}`} style={{ color: "var(--ink-dim)" }}>
            #{tokenId?.toString()}
          </Link>
          <span style={{ color: "var(--ink-ghost)" }}>/</span>
          <span>Buy coverage</span>
        </div>

        {/* Dossier */}
        <div
          style={{
            paddingBottom: "1.25rem",
            borderBottom: "1px solid var(--rule)",
            marginBottom: "1.5rem",
          }}
        >
          <DossierEyebrow
            items={[
              "Challenger",
              "·",
              "Step 2 of 3",
              "·",
              "Size your stake",
            ]}
          />
          <DossierTitle>
            Buy <DossierEm>coverage</DossierEm> on this strategy.
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
              maxWidth: "64ch",
            }}
          >
            Pick the size of your claim. You pay a{" "}
            <strong style={{ color: "var(--ink)" }}>
              {(premiumBps / 100).toFixed(2)}%
            </strong>{" "}
            premium up-front. If the strategy breaches its drawdown promise, the bond
            pays you out up to your claim cap. If it doesn&apos;t, the premium stays
            in the LP pool — your insurance expires worthless, the same way home
            insurance does in a year nothing burns down.
          </motion.p>
        </div>

        {/* Strategy-being-insured strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: "2rem",
            alignItems: "center",
            padding: "1.25rem 1.5rem",
            border: "1px solid var(--rule)",
            borderRadius: 8,
            background:
              "linear-gradient(180deg, var(--surface-raised), var(--surface-deep))",
            marginBottom: "2.25rem",
          }}
          className="insured-strip"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <SealSigil size="small" />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  color: "var(--ink-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  marginBottom: "0.3rem",
                }}
              >
                Insuring
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.4rem",
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                Wager <DossierEm>#{tokenId?.toString()}</DossierEm>
              </h2>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  color: "var(--ink-faint)",
                  marginTop: "0.35rem",
                }}
              >
                Trader self-asserts: {meta.tagline} · sealed in TEE
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  color: "var(--ink-faint)",
                  marginTop: "0.2rem",
                }}
              >
                Trader {formatAddress(strat.owner)} · Epoch{" "}
                {data.currentEpochId.toString()}
              </div>
            </div>
          </div>

          <div style={{ display: "flex" }}>
            <InsuredStat k="Current equity" v={`${formatUsdc(data.currentEquity)}`} tone={isBreached ? "warn" : "default"} unit="USDC" />
            <InsuredStat k="Bond posted" v={`${formatUsdc(data.startingBond)}`} unit="USDC" />
            <InsuredStat k="Threshold" v={`${formatUsdc(deriveThreshold(data.startingBond, data.maxDrawdownBps))}`} tone="warn" unit="USDC" />
            <InsuredStat k="Headroom" v={`${formatUsdc(headroom)}`} tone="brass" unit="USDC" />
          </div>

          <div style={{ width: 160, height: 56, flexShrink: 0 }}>
            <MiniEquityCurve breached={isBreached} />
          </div>
        </motion.div>

        {/* Main 2-col layout */}
        <div className="insure-layout">
          <div>
            <SectionEyebrow numeral="§ I">Pick a claim size</SectionEyebrow>
            <SerifHeading>
              How much do you <DossierEm>want covered?</DossierEm>
            </SerifHeading>
            <p
              style={{
                color: "var(--ink-dim)",
                fontSize: "0.95rem",
                lineHeight: 1.55,
                marginTop: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              Type a number or drag the slider. Max coverage is{" "}
              <strong style={{ color: "var(--brass)" }}>
                {formatUsdc(headroom)} USDC
              </strong>{" "}
              — the bond&apos;s remaining headroom after existing policies.
            </p>

            {/* Sizing block */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{
                border: "1px solid var(--brass-deep)",
                borderRadius: 10,
                background:
                  "linear-gradient(180deg, rgba(212,165,116,0.04), rgba(212,165,116,0)), var(--surface-raised)",
                padding: "1.75rem 1.75rem 1.5rem",
                marginBottom: "2rem",
                boxShadow:
                  "0 0 0 1px rgba(212,165,116,0.04), 0 20px 60px -30px rgba(212,165,116,0.15)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  color: "var(--brass)",
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  marginBottom: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <span>Coverage amount</span>
                <span style={{ color: "var(--ink-faint)" }}>
                  — drag, type, or tap a chip
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.85rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid var(--rule)",
                  marginBottom: "1.15rem",
                }}
              >
                <input
                  type="number"
                  min={0}
                  max={maxCoverage}
                  step={1}
                  value={amount}
                  placeholder="0"
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!isConnected || isOwnerOfStrategy || notActive || buyFlow.isBusy}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: 0,
                    outline: 0,
                    color: "var(--ink)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "clamp(2.2rem, 4.5vw, 3rem)",
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                    padding: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.15rem",
                    color: "var(--brass)",
                    letterSpacing: "0.05em",
                    flexShrink: 0,
                  }}
                >
                  USDC
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "var(--ink-faint)",
                    marginLeft: "auto",
                    flexShrink: 0,
                  }}
                >
                  Max{" "}
                  <strong style={{ color: "var(--brass)", fontWeight: 600 }}>
                    {maxCoverage}
                  </strong>
                </span>
              </div>

              {/* Slider */}
              <div style={{ padding: "0.5rem 0 0.25rem" }}>
                <input
                  type="range"
                  min={0}
                  max={Math.max(maxCoverage, 1)}
                  step={1}
                  value={Math.min(Math.floor(amtNum), maxCoverage)}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!isConnected || isOwnerOfStrategy || notActive || buyFlow.isBusy}
                  className="insure-slider"
                  style={
                    {
                      width: "100%",
                      WebkitAppearance: "none",
                      appearance: "none",
                      background: "transparent",
                      cursor: "pointer",
                      ["--pct" as string]:
                        maxCoverage > 0
                          ? `${(Math.min(amtNum, maxCoverage) / maxCoverage) * 100}%`
                          : "0%",
                    } as React.CSSProperties
                  }
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "0.55rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    color: "var(--ink-faint)",
                  }}
                >
                  <span>0</span>
                  <span>{Math.round(maxCoverage / 4)}</span>
                  <span>{Math.round(maxCoverage / 2)}</span>
                  <span>{Math.round((maxCoverage * 3) / 4)}</span>
                  <span>{maxCoverage} (max)</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: "1.15rem",
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                {chipsFor(maxCoverage).map((chip) => {
                  const active = Math.floor(amtNum) === chip.amt;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setAmount(chip.amt.toString())}
                      disabled={chip.amt > maxCoverage || buyFlow.isBusy}
                      style={{
                        padding: "0.4rem 0.75rem",
                        background: active
                          ? "rgba(212,165,116,0.08)"
                          : "transparent",
                        border: `1px solid ${active ? "var(--brass)" : "var(--rule)"}`,
                        color: active ? "var(--brass)" : "var(--ink-dim)",
                        borderRadius: 4,
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        cursor: chip.amt > maxCoverage ? "not-allowed" : "pointer",
                        transition: "all 0.12s",
                        opacity: chip.amt > maxCoverage ? 0.4 : 1,
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              {/* Premium pill */}
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "0.85rem 1rem",
                  background: "var(--surface-deep)",
                  border: "1px solid var(--rule)",
                  borderRadius: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                }}
              >
                <span style={{ color: "var(--ink-dim)" }}>
                  Premium{" "}
                  <strong style={{ color: "var(--brass)", fontWeight: 600 }}>
                    ({(premiumBps / 100).toFixed(2)}%)
                  </strong>{" "}
                  paid up-front
                </span>
                <FlashNumber
                  value={premiumNum}
                  formatted={`${formatNum(premiumNum)} USDC`}
                  style={{
                    color: "var(--brass)",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                />
              </div>

              {/* Validation */}
              <ValidationMessages
                isOwner={isOwnerOfStrategy}
                notActive={notActive}
                exceedsBond={exceedsBond}
                insufficient={insufficient}
                premiumStr={`${formatNum(premiumNum)} USDC`}
                err={buyFlow.errorMsg}
              />
            </motion.div>

            {/* Outcomes */}
            <SectionEyebrow numeral="§ II">What happens to your money</SectionEyebrow>
            <SerifHeading>
              Two outcomes. <DossierEm>Both pre-computed.</DossierEm>
            </SerifHeading>
            <p
              style={{
                color: "var(--ink-dim)",
                fontSize: "0.95rem",
                lineHeight: 1.55,
                marginTop: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              Strategy #{tokenId?.toString()} either breaches its drawdown promise
              inside this epoch, or it doesn&apos;t. Here&apos;s exactly what you walk
              away with in each case.
            </p>

            <div
              className="outcomes-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.25rem",
                marginBottom: "2.5rem",
              }}
            >
              <OutcomeCard
                tone="win"
                eyebrow="Scenario A · strategy breaches"
                title={
                  <>
                    You <DossierEm>claim</DossierEm> your coverage.
                  </>
                }
                blurb={
                  isBreached ? (
                    <>
                      #{tokenId?.toString()} is{" "}
                      <strong style={{ color: "var(--ink)" }}>
                        already past its drawdown threshold
                      </strong>
                      . The next{" "}
                      <code
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.82rem",
                          color: "var(--brass)",
                        }}
                      >
                        markBreach()
                      </code>{" "}
                      call settles the epoch — your claim is paid before residual
                      sweeps to LPs. <strong style={{ color: "var(--ink)" }}>Trader receives 0.</strong>
                    </>
                  ) : (
                    <>
                      If the strategy crosses its drawdown threshold this epoch, the
                      bond pays your claim before residual sweeps to the LP pool.
                      <strong style={{ color: "var(--ink)" }}> Trader receives 0.</strong>
                    </>
                  )
                }
                ledger={[
                  { k: "Claim payout", v: `+${formatNum(amtNum)} USDC`, tone: "payout" },
                  { k: "Stake already paid", v: `−${formatNum(premiumNum)} USDC`, tone: "cost" },
                ]}
                net={{ k: "Net P&L", v: `+${formatNum(winNet)} USDC` }}
                footnote={
                  isBreached
                    ? {
                        head: "Why this is likely.",
                        body: "Strategy already crossed threshold. Any wallet can call settlement; the protocol pays open stakes first-come, first-served from the bond.",
                      }
                    : {
                        head: "Why this matters.",
                        body: "Settlement is permissionless. The protocol pays open stakes first-come from the bond; only residuals (if any) sweep to LPs.",
                      }
                }
              />

              <OutcomeCard
                tone="loss"
                eyebrow="Scenario B · cost of being wrong"
                title={
                  <>
                    The trader <DossierEm>kept</DossierEm> the promise.
                  </>
                }
                blurb={
                  <>
                    You staked against a promise the trader kept. They earn the
                    stake as their fee for signing real, verifiable work. Try a
                    different trader.
                  </>
                }
                ledger={[
                  { k: "Claim payout", v: "$0.00", tone: "neutral" },
                  { k: "Stake already paid", v: `−${formatNum(premiumNum)} USDC`, tone: "cost" },
                ]}
                net={{ k: "Net P&L", v: `−${formatNum(premiumNum)} USDC` }}
                footnote={{
                  head: "Where your stake goes.",
                  body: "60% to the trader (their reward for keeping a verifiable promise), 40% to the LP pool as yield. You took a position against the promise and the promise held — same shape as any losing wager.",
                }}
              />
            </div>

            {/* Fineprint */}
            <div
              style={{
                border: "1px solid var(--rule)",
                borderRadius: 8,
                background: "var(--surface-raised)",
                padding: "1.5rem",
              }}
            >
              <h4
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  marginBottom: "0.85rem",
                }}
              >
                How the <DossierEm>payout actually works.</DossierEm>
              </h4>
              <ul style={{ listStyle: "none", display: "grid", gap: "0.6rem", padding: 0 }}>
                {[
                  <>On breach, the bond pays each policy up to its <Code>maxClaim</Code>. If total bond &lt; total claims, payouts are first-come from the on-chain settlement transaction.</>,
                  <>Residual bond (after all policies paid) sweeps to the LP pool as yield. The trader&apos;s address receives <Code>0</Code>.</>,
                  <>On a successful epoch (no breach), the bond returns to the trader. Your stake splits 60% to the trader / 40% to the LP pool — the trader earns it for keeping a verifiable promise.</>,
                  <>Two on-chain transactions: <Code>approve</Code> the USDC spend, then <Code>buyPolicy()</Code> on the <Code>InsurancePool</Code> contract. Both settle in ~6s on 0G Galileo.</>,
                ].map((li, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--ink-dim)",
                      lineHeight: 1.55,
                      paddingLeft: "1.3rem",
                      position: "relative",
                    }}
                  >
                    <span style={{ position: "absolute", left: 0, color: "var(--brass-dim)" }}>—</span>
                    {li}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sticky cart */}
          <aside className="insure-cart">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{
                border: "1px solid var(--brass-deep)",
                borderRadius: 10,
                background:
                  "linear-gradient(180deg, rgba(212,165,116,0.04), rgba(212,165,116,0.01)), var(--surface-raised)",
                boxShadow:
                  "0 0 0 1px rgba(212,165,116,0.05), 0 30px 60px -30px rgba(212,165,116,0.2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.1rem 1.25rem 0.85rem",
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    color: "var(--brass)",
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    marginBottom: "0.35rem",
                  }}
                >
                  Your policy
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.35rem",
                    fontWeight: 600,
                    lineHeight: 1.1,
                  }}
                >
                  Coverage on <DossierEm>#{tokenId?.toString()}</DossierEm>
                </h3>
              </div>

              <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
                <CartLine k="Strategy" v={`${meta.name} · #${tokenId?.toString()}`} />
                <CartLine k="Max claim" v={`${formatNum(amtNum)} USDC`} />
                <CartLine k="Premium rate" v={`${(premiumBps / 100).toFixed(2)}%`} />
                <CartLine
                  k="Epoch closes in"
                  v={formatRemaining(data.epochEndTs)}
                  tone="brass"
                />
                <CartLine k="Coverage expires" v="epoch end" />

                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.85rem 1rem",
                    background: "var(--surface-deep)",
                    border: "1px solid var(--rule)",
                    borderRadius: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      color: "var(--ink-dim)",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                    }}
                  >
                    You pay now
                  </span>
                  <FlashNumber
                    value={premiumNum}
                    formatted={`${formatNum(premiumNum)} USDC`}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "1.2rem",
                      color: "var(--brass)",
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  <StepButton
                    n={1}
                    label={
                      step === "approving"
                        ? "Approving USDC…"
                        : approveDone
                          ? "USDC approved"
                          : "Approve USDC"
                    }
                    done={approveDone}
                    armed={!approveDone && valid}
                    onClick={() =>
                      parsed !== null && tokenId !== undefined && !buyFlow.isBusy &&
                      buyFlow.buyPolicy(tokenId, parsed, premium)
                    }
                  />
                  <StepButton
                    n={2}
                    primary
                    label={
                      step === "confirmed"
                        ? "Policy minted ✓"
                        : step === "executing"
                          ? "Buying policy…"
                          : !isConnected
                            ? "Connect wallet"
                            : "Place stake"
                    }
                    armed={buyArmed || (valid && approveDone)}
                    done={step === "confirmed"}
                    onClick={() =>
                      parsed !== null && tokenId !== undefined && !buyFlow.isBusy && valid &&
                      buyFlow.buyPolicy(tokenId, parsed, premium)
                    }
                  />
                </div>

                <p
                  style={{
                    marginTop: "0.8rem",
                    fontSize: "0.72rem",
                    color: "var(--ink-faint)",
                    textAlign: "center",
                    lineHeight: 1.45,
                  }}
                >
                  Two transactions on 0G Galileo. ~6 seconds total. You can cancel
                  before signing #2.
                </p>

                {(buyFlow.approveTxHash || buyFlow.innerTxHash) && (
                  <div
                    style={{
                      marginTop: "0.6rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    {buyFlow.approveTxHash && (
                      <a
                        href={`${EXPLORER_URL}/tx/${buyFlow.approveTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          color: "var(--ink-dim)",
                        }}
                      >
                        approve · {buyFlow.approveTxHash.slice(0, 10)}… ↗
                      </a>
                    )}
                    {buyFlow.innerTxHash && (
                      <a
                        href={`${EXPLORER_URL}/tx/${buyFlow.innerTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          color: "var(--ink-dim)",
                        }}
                      >
                        buyPolicy · {buyFlow.innerTxHash.slice(0, 10)}… ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                border: "1px solid var(--rule)",
                borderRadius: 8,
                background: "var(--surface-raised)",
                padding: "0.95rem 1.1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--ink-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                }}
              >
                Wallet
                <small
                  style={{
                    display: "block",
                    marginTop: "0.25rem",
                    textTransform: "none",
                    letterSpacing: 0,
                    color: "var(--ink-dim)",
                    fontSize: "0.75rem",
                  }}
                >
                  {address ? formatAddress(address) : "not connected"}
                </small>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1rem",
                  color: "var(--ink)",
                  fontWeight: 600,
                }}
              >
                {balance !== undefined ? formatUsdc(balance) : "—"}{" "}
                <span style={{ color: "var(--ink-faint)", fontSize: "0.72rem", marginLeft: "0.25rem" }}>
                  USDC
                </span>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>

      {/* page-local styles for slider thumb + layout breakpoint */}
      <style jsx global>{`
        .insure-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .insure-layout { grid-template-columns: 1fr; }
          .insure-cart { position: static !important; }
        }
        .insure-cart {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        @media (max-width: 820px) {
          .insured-strip { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          .outcomes-grid { grid-template-columns: 1fr !important; }
        }

        /* Slider track + thumb */
        .insure-slider::-webkit-slider-runnable-track {
          height: 4px;
          background: linear-gradient(90deg, var(--brass) var(--pct, 50%), var(--surface-locked) var(--pct, 50%));
          border-radius: 2px;
        }
        .insure-slider::-moz-range-track {
          height: 4px;
          background: var(--surface-locked);
          border-radius: 2px;
        }
        .insure-slider::-moz-range-progress {
          height: 4px;
          background: var(--brass);
          border-radius: 2px;
        }
        .insure-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px; height: 18px;
          background: var(--brass);
          border: 2px solid var(--surface-base);
          border-radius: 50%;
          margin-top: -7px;
          cursor: grab;
          box-shadow: 0 0 0 1px var(--brass), 0 4px 8px rgba(212,165,116,0.25);
        }
        .insure-slider::-moz-range-thumb {
          width: 18px; height: 18px;
          background: var(--brass);
          border: 2px solid var(--surface-base);
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 0 0 1px var(--brass), 0 4px 8px rgba(212,165,116,0.25);
        }
      `}</style>
    </>
  );
}

// ──────────────────────────── helpers ────────────────────────────

function deriveThreshold(startingBond: bigint, maxDrawdownBps: bigint): bigint {
  return (startingBond * (10000n - maxDrawdownBps)) / 10000n;
}

function chipsFor(maxCoverage: number) {
  if (maxCoverage <= 0) return [{ label: "0", amt: 0 }];
  const a = Math.max(1, Math.round(maxCoverage * 0.1));
  const b = Math.max(1, Math.round(maxCoverage * 0.25));
  const c = Math.max(1, Math.round(maxCoverage * 0.5));
  const d = Math.max(1, Math.round(maxCoverage * 0.75));
  return [
    { label: a.toString(), amt: a },
    { label: b.toString(), amt: b },
    { label: c.toString(), amt: c },
    { label: d.toString(), amt: d },
    { label: "Max", amt: maxCoverage },
  ];
}

function formatNum(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InsuredStat({
  k,
  v,
  unit,
  tone = "default",
}: {
  k: string;
  v: string;
  unit?: string;
  tone?: "default" | "warn" | "brass";
}) {
  const color =
    tone === "warn" ? "var(--loss)" : tone === "brass" ? "var(--brass)" : "var(--ink)";
  return (
    <div
      style={{
        padding: "0 1.25rem",
        borderLeft: "1px solid var(--rule)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: "var(--ink-faint)",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          marginBottom: "0.35rem",
        }}
      >
        {k}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.95rem",
          color,
          fontWeight: 600,
        }}
      >
        {v}
        {unit && (
          <small style={{ marginLeft: 4, color: "var(--ink-faint)", fontSize: "0.65rem" }}>
            {unit}
          </small>
        )}
      </div>
    </div>
  );
}

function MiniEquityCurve({ breached }: { breached: boolean }) {
  return (
    <svg viewBox="0 0 160 56" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
      <line
        x1="0"
        y1="48"
        x2="160"
        y2="48"
        stroke={breached ? "#d97676" : "#88c870"}
        strokeWidth="1"
        strokeDasharray="3,3"
        opacity="0.5"
      />
      {breached ? (
        <>
          <motion.polyline
            fill="none"
            stroke="#d4a574"
            strokeWidth="1.5"
            strokeLinecap="round"
            points="6,8 22,10 40,16 60,24 80,32 100,40 118,45 138,46 152,46"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <circle cx="6" cy="8" r="1.6" fill="#d4a574" />
          <circle cx="152" cy="46" r="2.2" fill="#d97676" />
        </>
      ) : (
        <>
          <motion.polyline
            fill="none"
            stroke="#88c870"
            strokeWidth="1.5"
            strokeLinecap="round"
            points="6,46 22,42 40,36 60,32 80,28 100,22 118,18 138,14 152,10"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <circle cx="6" cy="46" r="1.6" fill="#d4a574" />
          <circle cx="152" cy="10" r="2.2" fill="#88c870" />
        </>
      )}
    </svg>
  );
}

function FlashNumber({
  value,
  formatted,
  style,
}: {
  value: number;
  formatted: string;
  style?: React.CSSProperties;
}) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ color: "#e8b885" }}
        animate={{ color: style?.color as string ?? "var(--brass)" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={style}
      >
        {formatted}
      </motion.span>
    </AnimatePresence>
  );
}

function OutcomeCard({
  tone,
  eyebrow,
  title,
  blurb,
  ledger,
  net,
  footnote,
}: {
  tone: "win" | "loss";
  eyebrow: string;
  title: React.ReactNode;
  blurb: React.ReactNode;
  ledger: { k: string; v: string; tone: "payout" | "cost" | "neutral" }[];
  net: { k: string; v: string };
  footnote: { head: string; body: string };
}) {
  const isWin = tone === "win";
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        border: `1px solid ${isWin ? "var(--win-border)" : "var(--loss-border)"}`,
        borderRadius: 10,
        padding: "1.5rem 1.5rem 1.25rem",
        position: "relative",
        overflow: "hidden",
        background: isWin
          ? "linear-gradient(180deg, var(--win-soft), rgba(136,200,112,0.02)), var(--surface-raised)"
          : "linear-gradient(180deg, var(--loss-soft), rgba(217,118,118,0.02)), var(--surface-raised)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          marginBottom: "0.6rem",
          display: "flex",
          alignItems: "center",
          gap: "0.55rem",
          color: isWin ? "var(--win)" : "var(--loss)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: isWin ? "var(--win)" : "var(--loss)",
            boxShadow: isWin
              ? "0 0 6px rgba(136,200,112,0.5)"
              : "0 0 6px rgba(217,118,118,0.5)",
          }}
        />
        {eyebrow}
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.45rem",
          fontWeight: 600,
          lineHeight: 1.15,
          marginBottom: "0.4rem",
          color: "var(--ink)",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "var(--ink-dim)",
          fontSize: "0.88rem",
          lineHeight: 1.5,
          marginBottom: "1.15rem",
        }}
      >
        {blurb}
      </p>
      <div
        style={{
          borderTop: "1px solid var(--rule)",
          paddingTop: "0.85rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.85rem",
        }}
      >
        {ledger.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.4rem 0",
              color: "var(--ink-dim)",
            }}
          >
            <span>{row.k}</span>
            <span
              style={{
                color:
                  row.tone === "payout"
                    ? "var(--win)"
                    : row.tone === "cost"
                      ? "var(--ink-dim)"
                      : "var(--ink)",
                fontWeight: row.tone === "payout" ? 600 : 400,
              }}
            >
              {row.v}
            </span>
          </div>
        ))}
        <div
          style={{
            borderTop: "1px solid var(--rule)",
            marginTop: "0.4rem",
            paddingTop: "0.7rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontSize: "0.7rem",
              color: "var(--ink)",
            }}
          >
            {net.k}
          </span>
          <span
            style={{
              color: isWin ? "var(--win)" : "var(--loss)",
              fontWeight: 700,
              fontSize: "1.1rem",
            }}
          >
            {net.v}
          </span>
        </div>
      </div>
      <p
        style={{
          marginTop: "1rem",
          paddingTop: "0.85rem",
          borderTop: "1px solid var(--rule)",
          fontSize: "0.78rem",
          color: "var(--ink-faint)",
          lineHeight: 1.5,
          fontStyle: "italic",
          fontFamily: "var(--font-display)",
        }}
      >
        <strong
          style={{
            color: "var(--ink-dim)",
            fontStyle: "normal",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
          }}
        >
          {footnote.head}
        </strong>{" "}
        {footnote.body}
      </p>
    </motion.article>
  );
}

function CartLine({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "brass" | "warn";
}) {
  const color =
    tone === "brass" ? "var(--brass)" : tone === "warn" ? "var(--loss)" : "var(--ink)";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "0.5rem 0",
        borderBottom: "1px dashed var(--rule)",
        fontSize: "0.83rem",
      }}
    >
      <span style={{ color: "var(--ink-dim)" }}>{k}</span>
      <span style={{ fontFamily: "var(--font-mono)", color }}>{v}</span>
    </div>
  );
}

function StepButton({
  n,
  label,
  primary,
  armed,
  done,
  onClick,
}: {
  n: number;
  label: string;
  primary?: boolean;
  armed: boolean;
  done?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!armed || done}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        padding: "0.85rem 1rem",
        borderRadius: 6,
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: "0.9rem",
        cursor: armed && !done ? "pointer" : "not-allowed",
        textAlign: "left",
        transition: "all 0.12s",
        ...(primary
          ? {
              background: armed ? "var(--brass)" : "transparent",
              color: armed ? "var(--surface-base)" : "var(--brass)",
              border: `1px solid ${armed ? "var(--brass)" : "var(--brass-deep)"}`,
              opacity: armed ? 1 : 0.45,
            }
          : {
              background: done
                ? "rgba(136,200,112,0.06)"
                : armed
                  ? "rgba(212,165,116,0.06)"
                  : "transparent",
              color: done ? "var(--win)" : "var(--brass)",
              border: `1px solid ${done ? "rgba(136,200,112,0.4)" : "var(--brass-deep)"}`,
              opacity: armed || done ? 1 : 0.55,
            }),
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "1.5px solid currentColor",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "0.7rem",
          flexShrink: 0,
        }}
      >
        {done ? "✓" : n}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>→</span>
    </button>
  );
}

function ValidationMessages({
  isOwner,
  notActive,
  exceedsBond,
  insufficient,
  premiumStr,
  err,
}: {
  isOwner: boolean;
  notActive: boolean;
  exceedsBond: boolean;
  insufficient: boolean;
  premiumStr: string;
  err: string | null;
}) {
  const msgs: string[] = [];
  if (isOwner) msgs.push("You can't insure your own strategy.");
  if (notActive) msgs.push("Epoch is not active — policies cannot be bought right now.");
  if (exceedsBond) msgs.push("Exceeds remaining bond headroom. Reduce the coverage amount.");
  if (insufficient) msgs.push(`Insufficient USDC — you need ${premiumStr} for the premium.`);
  if (err) msgs.push(err);
  if (msgs.length === 0) return null;
  return (
    <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {msgs.map((m, i) => (
        <p
          key={i}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            color: "var(--loss)",
            padding: "0.5rem 0.75rem",
            background: "rgba(217,118,118,0.06)",
            border: "1px solid var(--loss-border)",
            borderRadius: 6,
            wordBreak: "break-word",
          }}
        >
          {m}
        </p>
      ))}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.78rem",
        color: "var(--brass)",
        background: "rgba(212,165,116,0.07)",
        padding: "0 0.3rem",
        borderRadius: 3,
      }}
    >
      {children}
    </code>
  );
}
