/**
 * LP-side deposit form for the InsurancePool.
 *
 * Approve→Deposit two-step flow handled by useDepositLP. Shows current pool
 * size, the user's LP shares, and the asset value of those shares (i.e.
 * principal + accrued premium yield + breach residuals).
 */
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useInsurancePool } from "@/hooks/v3/useInsurancePool";
import { useUsdcBalance } from "@/hooks/v3/useUsdcBalance";
import { useDepositLP } from "@/hooks/v3/useDepositLP";
import { useMockVault } from "@/hooks/v3/useMockVault";
import { useEffect } from "react";
import { formatUsdc, parseUsdcInput } from "@/lib/v3format";
import { EXPLORER_URL } from "@/lib/contracts";

export function LpDepositPanel() {
  const { isConnected } = useAccount();
  const pool = useInsurancePool();
  const usdcBal = useUsdcBalance();
  const depositFlow = useDepositLP();
  const [amount, setAmount] = useState("");

  const parsed = parseUsdcInput(amount);
  const balance = usdcBal.data as bigint | undefined;
  const insufficient = parsed !== null && balance !== undefined && parsed > balance;
  const valid = parsed !== null && parsed > 0n && !insufficient;

  // Reset and refresh after a successful deposit
  useEffect(() => {
    if (depositFlow.isConfirmed) {
      setAmount("");
      pool.refetch();
      usdcBal.refetch();
    }
  }, [depositFlow.isConfirmed, pool, usdcBal]);

  const stepLabel: Record<typeof depositFlow.step, string> = {
    idle: "Approve & Deposit",
    "checking-allowance": "Checking allowance…",
    approving: "1 / 2 — Approving USDC…",
    executing: "2 / 2 — Depositing…",
    confirmed: "Deposited ✓",
    error: "Try again",
  };

  return (
    <div
      className="bg-[var(--surface-raised)] border border-[var(--rule)] rounded-[var(--radius-lg)] p-6 sticky top-24"
    >
      <p className="label mb-2">Underwrite the protocol</p>
      <h3
        className="display-3 mb-4"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
      >
        Provide liquidity
      </h3>
      <p className="body-sm text-[var(--ink-dim)] mb-5 leading-snug">
        Deposit USDC to backstop policy claims. Earn premium yield on every
        epoch the agents survive — and absorb the residual bond when one
        breaches.
      </p>

      {/* Pool stats */}
      <div className="grid grid-cols-2 gap-3 mb-5 pb-5 border-b border-[var(--rule)]">
        <Mini label="Pool size" value={`${formatUsdc(pool.totalAssets)} USDC`} />
        <Mini
          label="Your shares"
          value={
            pool.userShares !== undefined
              ? formatUsdc(pool.userShares)
              : "—"
          }
        />
        <Mini
          label="Your value"
          value={`${formatUsdc(pool.userAssetValue)} USDC`}
          accent
        />
        <Mini label="Premium" value={`${(pool.premiumBps / 100).toFixed(2)}%`} />
      </div>

      {/* Amount input */}
      <label className="label mb-2 block">Deposit amount (USDC)</label>
      <div className="relative mb-3">
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          disabled={!isConnected || depositFlow.isBusy}
          className="w-full px-3 py-2.5 rounded-md mono text-base bg-[var(--surface-base)] border border-[var(--rule)] focus:border-[var(--brass)] outline-none disabled:opacity-50"
          style={{ color: "var(--ink)" }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 caption text-[var(--ink-faint)] mono">
          USDC
        </span>
      </div>
      <div className="flex items-center justify-between caption text-[var(--ink-faint)] mb-4">
        <span>
          Wallet:{" "}
          <span className="mono text-[var(--ink-dim)]">
            {balance !== undefined ? `${formatUsdc(balance)} USDC` : "—"}
          </span>
        </span>
        {balance !== undefined && balance > 0n && (
          <button
            type="button"
            onClick={() => setAmount((Number(balance) / 1e6).toString())}
            className="text-[var(--brass-bright)] hover:underline underline-offset-4"
            disabled={depositFlow.isBusy}
          >
            max
          </button>
        )}
      </div>

      {insufficient && (
        <p className="caption mb-3" style={{ color: "var(--loss)" }}>
          Insufficient USDC balance.
        </p>
      )}
      {depositFlow.errorMsg && (
        <p
          className="caption mb-3 mono break-words"
          style={{ color: "var(--loss)" }}
        >
          {depositFlow.errorMsg}
        </p>
      )}

      <button
        onClick={() => parsed !== null && depositFlow.deposit(parsed)}
        disabled={!isConnected || !valid || depositFlow.isBusy}
        className="w-full px-5 py-3 rounded-md font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background:
            depositFlow.step === "confirmed"
              ? "var(--win)"
              : "var(--brass)",
          color: "var(--surface-base)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {!isConnected ? "Connect wallet" : stepLabel[depositFlow.step]}
      </button>

      {/* Tx links */}
      {(depositFlow.approveTxHash || depositFlow.innerTxHash) && (
        <div className="mt-3 flex flex-col gap-1">
          {depositFlow.approveTxHash && (
            <a
              href={`${EXPLORER_URL}/tx/${depositFlow.approveTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] mono underline-offset-4 hover:underline truncate"
            >
              approve · {depositFlow.approveTxHash.slice(0, 10)}…
            </a>
          )}
          {depositFlow.innerTxHash && (
            <a
              href={`${EXPLORER_URL}/tx/${depositFlow.innerTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] mono underline-offset-4 hover:underline truncate"
            >
              deposit · {depositFlow.innerTxHash.slice(0, 10)}…
            </a>
          )}
        </div>
      )}

      {/* IdleYieldSection hidden — v3.5 will auto-route idle pool surplus
          into MockYieldVault at the protocol level; manual per-user move
          was a footgun and didn't match the v3.5 thesis. See README roadmap. */}
    </div>
  );
}

/**
 * Idle yield (demo) — wraps the MockYieldVault. Shows user's vault balance,
 * accrued (un-realised) yield ticking on a 10s interval, and the simulated
 * 8% APR. Two small actions: move USDC from wallet into the vault, or pull
 * it back out (yield included).
 *
 * This is decoupled from the InsurancePool deposit form on purpose — moving
 * USDC into the vault is an independent choice. The pool itself is not
 * yield-bearing; this is just an idle-cash optimisation for LPs.
 */
function IdleYieldSection() {
  const { isConnected } = useAccount();
  const vault = useMockVault();
  const usdcBal = useUsdcBalance();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");

  const parsed = parseUsdcInput(amount);
  const walletBal = usdcBal.data as bigint | undefined;
  const vaultBal = vault.userBalance;

  const maxForMode =
    mode === "deposit" ? walletBal : vaultBal;
  const insufficient =
    parsed !== null &&
    maxForMode !== undefined &&
    parsed > maxForMode;
  const valid = parsed !== null && parsed > 0n && !insufficient;

  // Reset + refresh on confirmation
  useEffect(() => {
    if (vault.flow.isConfirmed) {
      setAmount("");
      vault.refetch();
      usdcBal.refetch();
    }
  }, [vault.flow.isConfirmed, vault, usdcBal]);

  const apy = vault.apyBps !== undefined
    ? (vault.apyBps / 100).toFixed(2)
    : "8.00";

  const onSubmit = () => {
    if (parsed === null) return;
    if (mode === "deposit") vault.deposit(parsed);
    else vault.withdraw(parsed);
  };

  const stepLabel = {
    idle: mode === "deposit" ? "Move to vault" : "Pull back",
    "checking-allowance": "Checking allowance…",
    approving: "1 / 2 — Approving USDC…",
    executing: mode === "deposit" ? "Depositing…" : "Withdrawing…",
    confirmed: mode === "deposit" ? "Deposited ✓" : "Withdrawn ✓",
    error: "Try again",
  }[vault.flow.step];

  return (
    <div className="mt-6 pt-5 border-t border-[var(--rule)]">
      <div className="flex items-baseline justify-between mb-3">
        <p className="label">Idle yield (demo)</p>
        <span
          className="caption mono px-2 py-0.5 rounded-sm"
          style={{
            background: "var(--surface-base)",
            color: "var(--brass-bright)",
            border: "1px solid var(--rule)",
          }}
        >
          {apy}% APR
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="label" style={{ fontSize: "0.6rem" }}>
            In vault
          </p>
          <p
            className="mono numeral mt-0.5"
            style={{ color: "var(--ink)", fontSize: "0.95rem", lineHeight: 1.2 }}
          >
            {formatUsdc(vaultBal)} USDC
          </p>
        </div>
        <div>
          <p className="label" style={{ fontSize: "0.6rem" }}>
            Accruing
          </p>
          <p
            className="mono numeral mt-0.5"
            style={{
              color: "var(--brass-bright)",
              fontSize: "0.95rem",
              lineHeight: 1.2,
            }}
          >
            +{formatUsdc(vault.previewYield)} USDC
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-3 p-0.5 rounded-md" style={{ background: "var(--surface-base)", border: "1px solid var(--rule)" }}>
        <button
          type="button"
          onClick={() => { setMode("deposit"); setAmount(""); }}
          disabled={vault.flow.isBusy}
          className="flex-1 py-1.5 caption rounded-sm transition-colors"
          style={{
            background: mode === "deposit" ? "var(--brass-deep)" : "transparent",
            color: mode === "deposit" ? "var(--surface-base)" : "var(--ink-dim)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Move to vault
        </button>
        <button
          type="button"
          onClick={() => { setMode("withdraw"); setAmount(""); }}
          disabled={vault.flow.isBusy}
          className="flex-1 py-1.5 caption rounded-sm transition-colors"
          style={{
            background: mode === "withdraw" ? "var(--brass-deep)" : "transparent",
            color: mode === "withdraw" ? "var(--surface-base)" : "var(--ink-dim)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Pull back
        </button>
      </div>

      <div className="relative mb-2">
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          disabled={!isConnected || vault.flow.isBusy}
          className="w-full px-3 py-2 rounded-md mono text-sm bg-[var(--surface-base)] border border-[var(--rule)] focus:border-[var(--brass)] outline-none disabled:opacity-50"
          style={{ color: "var(--ink)" }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 caption text-[var(--ink-faint)] mono">
          USDC
        </span>
      </div>
      <div className="flex items-center justify-between caption text-[var(--ink-faint)] mb-3">
        <span>
          {mode === "deposit" ? "Wallet" : "Vault"}:{" "}
          <span className="mono text-[var(--ink-dim)]">
            {maxForMode !== undefined ? `${formatUsdc(maxForMode)} USDC` : "—"}
          </span>
        </span>
        {maxForMode !== undefined && maxForMode > 0n && (
          <button
            type="button"
            onClick={() => setAmount((Number(maxForMode) / 1e6).toString())}
            className="text-[var(--brass-bright)] hover:underline underline-offset-4"
            disabled={vault.flow.isBusy}
          >
            max
          </button>
        )}
      </div>

      {insufficient && (
        <p className="caption mb-2" style={{ color: "var(--loss)" }}>
          Insufficient {mode === "deposit" ? "wallet" : "vault"} balance.
        </p>
      )}
      {vault.flow.errorMsg && (
        <p
          className="caption mb-2 mono break-words"
          style={{ color: "var(--loss)" }}
        >
          {vault.flow.errorMsg}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={!isConnected || !valid || vault.flow.isBusy}
        className="w-full px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background:
            vault.flow.step === "confirmed"
              ? "var(--win)"
              : "var(--brass)",
          color: "var(--surface-base)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {!isConnected ? "Connect wallet" : stepLabel}
      </button>

      {vault.flow.innerTxHash && (
        <a
          href={`${EXPLORER_URL}/tx/${vault.flow.innerTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] mono underline-offset-4 hover:underline truncate mt-2 block"
        >
          {mode} · {vault.flow.innerTxHash.slice(0, 10)}…
        </a>
      )}

      <p
        className="caption mt-3 italic"
        style={{ color: "var(--ink-faint)", fontSize: "0.65rem", lineHeight: 1.4 }}
      >
        Demo-grade yield simulation. Production will integrate a 0G-native vault.
      </p>
    </div>
  );
}

function Mini({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="label" style={{ fontSize: "0.6rem" }}>
        {label}
      </p>
      <p
        className="mono numeral mt-0.5"
        style={{
          color: accent ? "var(--brass-bright)" : "var(--ink)",
          fontSize: "1rem",
          lineHeight: 1.2,
        }}
      >
        {value}
      </p>
    </div>
  );
}
