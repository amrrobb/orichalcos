/**
 * Live-breach banner for the Strategy detail page.
 *
 * Renders nothing while the strategy is healthy. As soon as
 * `useBreachStatus` reports a breach (or the epoch has expired), shows a
 * red banner with two action buttons:
 *   - Mark Breach     (anyone can call once isInBreach && status===Active)
 *   - Settle Epoch    (anyone can call once status===Breached or expired)
 *
 * After settle, the contract resets the strategy back to Idle. We display a
 * "settled — payouts complete" confirmation for ~10s after the settle tx
 * receipt lands.
 */
"use client";

import { useEffect, useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { V3_ADDRESSES, EXPLORER_URL } from "@/lib/contracts";
import { STRATEGY_INFT_ABI } from "@/lib/abi/v3";
import { useBreachStatus } from "@/hooks/v3/useBreachStatus";

interface Props {
  tokenId: bigint;
  /** Optional override label, e.g. "Strategy #4". */
  label?: string;
}

export function BreachBanner({ tokenId, label }: Props) {
  const breach = useBreachStatus(tokenId);
  const { isConnected } = useAccount();

  const markTx = useWriteContract();
  const markReceipt = useWaitForTransactionReceipt({
    hash: markTx.data,
    query: { enabled: !!markTx.data },
  });

  const settleTx = useWriteContract();
  const settleReceipt = useWaitForTransactionReceipt({
    hash: settleTx.data,
    query: { enabled: !!settleTx.data },
  });

  const [showSettledMsg, setShowSettledMsg] = useState(false);

  // Refresh state once either tx confirms.
  useEffect(() => {
    if (markReceipt.isSuccess || settleReceipt.isSuccess) {
      breach.refetch();
    }
    if (settleReceipt.isSuccess) {
      setShowSettledMsg(true);
      const t = setTimeout(() => setShowSettledMsg(false), 10_000);
      return () => clearTimeout(t);
    }
  }, [markReceipt.isSuccess, settleReceipt.isSuccess, breach]);

  // Settled confirmation card — survives the contract resetting status to Idle.
  if (showSettledMsg) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border p-5 mb-6"
        style={{
          background: "rgba(106, 170, 100, 0.08)",
          borderColor: "var(--win)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="text-2xl mt-[-2px]"
            style={{ color: "var(--win)", fontFamily: "var(--font-display)" }}
          >
            ✓
          </div>
          <div className="flex-1">
            <p className="label mb-1" style={{ color: "var(--win)" }}>
              Epoch settled
            </p>
            <p className="body-sm text-[var(--ink-dim)] leading-snug">
              Allocator claims paid out, residual swept to LP pool, trader
              received{" "}
              <span className="mono text-[var(--ink)]">0 USDC</span>. The
              Strategy Agent is now idle and may be re-bonded.
            </p>
            {settleTx.data && (
              <a
                href={`${EXPLORER_URL}/tx/${settleTx.data}`}
                target="_blank"
                rel="noopener noreferrer"
                className="caption text-[var(--brass-bright)] hover:underline underline-offset-4 mt-2 inline-block mono"
              >
                View settlement tx →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!breach.isBreachVisible) return null;

  const onMark = () => {
    if (!breach.canMarkBreach) return;
    markTx.writeContract({
      address: V3_ADDRESSES.strategyINFT,
      abi: STRATEGY_INFT_ABI,
      functionName: "markBreach",
      args: [tokenId],
    });
  };

  const onSettle = () => {
    if (!breach.canSettle) return;
    settleTx.writeContract({
      address: V3_ADDRESSES.strategyINFT,
      abi: STRATEGY_INFT_ABI,
      functionName: "settleEpoch",
      args: [tokenId],
    });
  };

  const isMarking = markTx.isPending || markReceipt.isLoading;
  const isSettling = settleTx.isPending || settleReceipt.isLoading;

  return (
    <div
      className="rounded-[var(--radius-lg)] border p-5 mb-6 relative overflow-hidden"
      style={{
        background: "rgba(196, 80, 76, 0.08)",
        borderColor: "var(--loss)",
      }}
    >
      {/* Pulse stripe to make it unmistakable on stage */}
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{
          background: "var(--loss)",
          animation: "breach-pulse 1.4s ease-in-out infinite",
        }}
      />
      <div className="flex items-start gap-4 pl-2">
        <div
          className="text-2xl mt-[-2px]"
          style={{ color: "var(--loss)" }}
        >
          ⚠
        </div>
        <div className="flex-1 min-w-0">
          <p className="label mb-1" style={{ color: "var(--loss)" }}>
            {breach.statusLabel === "Breached"
              ? "Breach acknowledged"
              : "Drawdown threshold hit"}
          </p>
          <p
            className="display-3 mb-1"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink)",
              fontWeight: 600,
            }}
          >
            {label ?? `Strategy #${tokenId.toString()}`} — claim available.
          </p>
          <p className="body-sm text-[var(--ink-dim)] leading-snug">
            The strategy crossed its max-drawdown threshold. Anyone can mark the
            breach and trigger settlement — bond pays allocators first, residual
            sweeps to the protocol pool. Trader receives{" "}
            <span className="mono">0</span>.
          </p>

          {(markTx.error || settleTx.error) && (
            <p className="caption text-[var(--loss)] mt-2 mono break-words">
              {markTx.error?.message ?? settleTx.error?.message}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={onMark}
              disabled={!breach.canMarkBreach || isMarking || !isConnected}
              className="px-4 py-2 rounded-md font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                background: breach.canMarkBreach
                  ? "var(--loss)"
                  : "var(--surface-locked)",
                color: breach.canMarkBreach ? "var(--ink)" : "var(--ink-faint)",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
              }}
              title={
                !isConnected
                  ? "Connect wallet to call"
                  : breach.statusLabel === "Breached"
                    ? "Already marked — proceed to settle"
                    : "Mark this strategy as breached on chain"
              }
            >
              {isMarking ? "Marking…" : "Mark Breach"}
            </button>

            <button
              onClick={onSettle}
              disabled={!breach.canSettle || isSettling || !isConnected}
              className="px-4 py-2 rounded-md font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                background: breach.canSettle
                  ? "var(--brass)"
                  : "var(--surface-locked)",
                color: breach.canSettle
                  ? "var(--surface-base)"
                  : "var(--ink-faint)",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
              }}
              title={
                !isConnected
                  ? "Connect wallet to call"
                  : !breach.canSettle
                    ? "Mark breach first"
                    : "Settle epoch — pay allocators, sweep residual to pool"
              }
            >
              {isSettling ? "Settling…" : "Settle Epoch"}
            </button>

            {markTx.data && !markReceipt.isSuccess && (
              <a
                href={`${EXPLORER_URL}/tx/${markTx.data}`}
                target="_blank"
                rel="noopener noreferrer"
                className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] underline-offset-4 hover:underline mono self-center"
              >
                mark tx →
              </a>
            )}
            {settleTx.data && !settleReceipt.isSuccess && (
              <a
                href={`${EXPLORER_URL}/tx/${settleTx.data}`}
                target="_blank"
                rel="noopener noreferrer"
                className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] underline-offset-4 hover:underline mono self-center"
              >
                settle tx →
              </a>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes breach-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Re-export the hook for callers that want to compose differently.
export { useBreachStatus } from "@/hooks/v3/useBreachStatus";
