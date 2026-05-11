/**
 * Route 2 — /strategies/[tokenId]/insure
 *
 * Allocator buy-policy form. Reads the strategy fresh on mount, lets the
 * allocator pick a maxClaim amount, shows live premium, blocks self-insurance
 * and over-coverage, then runs approve → buyPolicy.
 *
 * After tx confirms we redirect to /strategies/[tokenId] (the detail page
 * being built by another agent).
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useStrategy } from "@/hooks/v3/useStrategies";
import { useAllocatedCoverage } from "@/hooks/v3/useAllPolicies";
import { useBuyPolicy } from "@/hooks/v3/useBuyPolicy";
import { useUsdcBalance } from "@/hooks/v3/useUsdcBalance";
import { useInsurancePool } from "@/hooks/v3/useInsurancePool";
import { CoverageMeter } from "@/components/v3/CoverageMeter";
import { archetypeMeta, formatBps, formatRemaining, formatUsdc, parseUsdcInput } from "@/lib/v3format";
import { formatAddress } from "@/lib/format";
import { EXPLORER_URL, V3_PREMIUM_BPS_DEFAULT } from "@/lib/contracts";
import { Mark } from "@/components/ui/Mark";

export default function InsurePage() {
  const params = useParams<{ tokenId: string }>();
  const idStr = params.tokenId;
  const tokenId = idStr && /^\d+$/.test(idStr) ? BigInt(idStr) : undefined;
  if (idStr && tokenId === undefined) notFound();

  const router = useRouter();
  const { address, isConnected } = useAccount();
  const strat = useStrategy(tokenId);
  const allocatedQ = useAllocatedCoverage(tokenId, strat.data?.currentEpochId);
  const pool = useInsurancePool();
  const usdcBal = useUsdcBalance();
  const buyFlow = useBuyPolicy();

  const [amount, setAmount] = useState("");

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

  // Validations
  const isOwnerOfStrategy =
    !!address &&
    !!strat.owner &&
    address.toLowerCase() === strat.owner.toLowerCase();
  const exceedsBond =
    parsed !== null &&
    data !== undefined &&
    allocated + parsed > data.bondAmount;
  const balance = usdcBal.data as bigint | undefined;
  const insufficient =
    parsed !== null && balance !== undefined && premium > balance;
  const notActive = data !== undefined && data.status !== 1;

  const valid =
    isConnected &&
    !isOwnerOfStrategy &&
    !exceedsBond &&
    !insufficient &&
    !notActive &&
    parsed !== null &&
    parsed > 0n;

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
        <h1
          className="display-2 mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
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

  const stepLabel: Record<typeof buyFlow.step, string> = {
    idle: "Approve & Buy Policy",
    "checking-allowance": "Checking allowance…",
    approving: "1 / 2 — Approving USDC…",
    executing: "2 / 2 — Buying policy…",
    confirmed: "Policy minted ✓ — redirecting…",
    error: "Try again",
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12">
      <Link
        href="/protocol"
        className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] mb-6 inline-block"
      >
        ← The Protocol
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10 items-start">
        {/* Strategy summary */}
        <section className="bg-[var(--surface-raised)] border border-[var(--rule)] rounded-[var(--radius-lg)] p-6">
          <p className="label mb-2">{meta.tagline}</p>
          <h1
            className="leading-tight mb-1"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            }}
          >
            {meta.label}{" "}
            <span className="mono text-[var(--ink-faint)] text-xl ml-1">
              Strategy #{tokenId?.toString()}
            </span>
          </h1>
          <p className="caption text-[var(--ink-faint)] mb-6 mono">
            Trader {formatAddress(strat.owner)} · Epoch{" "}
            {data.currentEpochId.toString()} · {ucfirst(/* status */ ["Idle", "Active", "Breached", "Settled"][data.status] ?? "?")}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Stat label="Current equity" value={`${formatUsdc(data.currentEquity)} USDC`} accent />
            <Stat label="Starting bond" value={`${formatUsdc(data.startingBond)} USDC`} />
            <Stat label="Bond left" value={`${formatUsdc(data.bondAmount)} USDC`} />
            <Stat label="Drawdown cap" value={formatBps(data.maxDrawdownBps)} />
          </div>

          <div className="mb-6">
            <CoverageMeter
              bondAmount={data.bondAmount}
              allocated={allocated}
              pending={parsed && parsed > 0n ? parsed : 0n}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Stat
              label="Epoch ends"
              value={formatRemaining(data.epochEndTs)}
              small
            />
            <Stat
              label="Premium rate"
              value={`${(premiumBps / 100).toFixed(2)}%`}
              small
            />
          </div>

          <div className="mt-6 pt-5 border-t border-[var(--rule)] caption text-[var(--ink-faint)] leading-snug">
            <p>
              <span className="label mr-2">How the payout works</span>
              On breach, the bond pays each policy up to its maxClaim. If
              total bond &lt; total claims, payouts are first-come; residual
              sweeps to LPs. Trader gets <span className="mono">0</span>.
              On a successful epoch, premiums stay in the pool as LP yield and
              your policy expires worthless.
            </p>
          </div>
        </section>

        {/* Buy form */}
        <aside className="bg-[var(--surface-raised)] border border-[var(--rule)] rounded-[var(--radius-lg)] p-6 sticky top-24">
          <p className="label mb-2">Buy coverage</p>
          <h2
            className="display-3 mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Protect your exposure
          </h2>

          {isOwnerOfStrategy && (
            <p
              className="caption mb-4 p-3 rounded-md mono"
              style={{
                color: "var(--loss)",
                background: "rgba(196, 80, 76, 0.08)",
                border: "1px solid var(--loss)",
              }}
            >
              You can&apos;t insure your own strategy.
            </p>
          )}
          {notActive && (
            <p
              className="caption mb-4 p-3 rounded-md mono"
              style={{
                color: "var(--loss)",
                background: "rgba(196, 80, 76, 0.08)",
                border: "1px solid var(--loss)",
              }}
            >
              Epoch is not active — policies cannot be bought right now.
            </p>
          )}

          <label className="label mb-2 block">Max claim (USDC)</label>
          <div className="relative mb-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              disabled={!isConnected || isOwnerOfStrategy || notActive || buyFlow.isBusy}
              className="w-full px-3 py-2.5 rounded-md mono text-base bg-[var(--surface-base)] border border-[var(--rule)] focus:border-[var(--brass)] outline-none disabled:opacity-50"
              style={{ color: "var(--ink)" }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 caption text-[var(--ink-faint)] mono">
              USDC
            </span>
          </div>
          {(() => {
            const headroom = data.bondAmount - allocated;
            return (
              <button
                type="button"
                onClick={() => setAmount((Number(headroom) / 1e6).toString())}
                disabled={headroom <= 0n || buyFlow.isBusy}
                className="caption mono text-[var(--brass-bright)] hover:underline underline-offset-4 mb-4 disabled:opacity-50"
              >
                Fill headroom ({formatUsdc(headroom)} USDC)
              </button>
            );
          })()}

          {/* Premium preview */}
          <div className="mb-5 p-4 rounded-md bg-[var(--surface-base)] border border-[var(--rule)]">
            <div className="flex items-center justify-between mb-2">
              <span className="label">Premium ({(premiumBps / 100).toFixed(2)}%)</span>
              <span
                className="mono numeral"
                style={{
                  color: "var(--brass-bright)",
                  fontSize: "1.4rem",
                  lineHeight: 1.2,
                }}
              >
                {formatUsdc(premium)} USDC
              </span>
            </div>
            <p className="caption text-[var(--ink-faint)] leading-snug">
              Paid up-front. Stays in the LP pool whether you claim or not.
            </p>
          </div>

          {/* Validation messages */}
          {exceedsBond && (
            <p className="caption mb-3" style={{ color: "var(--loss)" }}>
              Exceeds remaining bond headroom. Reduce the coverage amount.
            </p>
          )}
          {insufficient && (
            <p className="caption mb-3" style={{ color: "var(--loss)" }}>
              Insufficient USDC — you need {formatUsdc(premium)} USDC for the premium.
            </p>
          )}
          {buyFlow.errorMsg && (
            <p
              className="caption mb-3 mono break-words"
              style={{ color: "var(--loss)" }}
            >
              {buyFlow.errorMsg}
            </p>
          )}

          <button
            disabled={!valid || buyFlow.isBusy}
            onClick={() =>
              parsed !== null && tokenId !== undefined &&
              buyFlow.buyPolicy(tokenId, parsed, premium)
            }
            className="w-full px-5 py-3 rounded-md font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:
                buyFlow.step === "confirmed"
                  ? "var(--win)"
                  : "var(--brass)",
              color: "var(--surface-base)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {!isConnected ? "Connect wallet" : stepLabel[buyFlow.step]}
          </button>

          <p className="caption text-[var(--ink-faint)] mt-3 text-center">
            Wallet:{" "}
            <span className="mono text-[var(--ink-dim)]">
              {balance !== undefined ? `${formatUsdc(balance)} USDC` : "—"}
            </span>
          </p>

          {(buyFlow.approveTxHash || buyFlow.innerTxHash) && (
            <div className="mt-3 flex flex-col gap-1">
              {buyFlow.approveTxHash && (
                <a
                  href={`${EXPLORER_URL}/tx/${buyFlow.approveTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] mono underline-offset-4 hover:underline truncate"
                >
                  approve · {buyFlow.approveTxHash.slice(0, 10)}…
                </a>
              )}
              {buyFlow.innerTxHash && (
                <a
                  href={`${EXPLORER_URL}/tx/${buyFlow.innerTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] mono underline-offset-4 hover:underline truncate"
                >
                  buyPolicy · {buyFlow.innerTxHash.slice(0, 10)}…
                </a>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
  small = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div>
      <p className="label" style={{ fontSize: "0.6rem" }}>
        {label}
      </p>
      <p
        className="mono numeral mt-1"
        style={{
          color: accent ? "var(--brass-bright)" : "var(--ink)",
          fontSize: small ? "1rem" : "1.25rem",
          lineHeight: 1.2,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function ucfirst(s: string) {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}
