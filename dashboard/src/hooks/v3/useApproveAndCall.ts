/**
 * Generic two-step "approve USDC then run inner write" state machine.
 *
 * Used by both buyPolicy and deposit flows. Skips the approve step if the
 * existing allowance is already sufficient.
 *
 * Steps:
 *   - "idle"
 *   - "checking-allowance"  (initial allowance read)
 *   - "approving"           (approve tx in flight)
 *   - "approved"            (waiting on user to start step 2 or auto-trigger)
 *   - "executing"           (main tx in flight)
 *   - "confirmed"           (main tx mined)
 *   - "error"
 *
 * The hook auto-advances from approved -> executing once the approve receipt
 * lands (no extra click required).
 */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { V3_ADDRESSES } from "@/lib/contracts";
import { MOCK_USDC_ABI } from "@/lib/abi/v3";

export type ApproveStep =
  | "idle"
  | "checking-allowance"
  | "approving"
  | "executing"
  | "confirmed"
  | "error";

export interface ApproveAndCallParams<TArgs extends readonly unknown[]> {
  /** Address of the contract receiving the USDC. Must already be set. */
  spender: `0x${string}`;
  /** USDC amount the spender will pull (in 6-decimal units). */
  amount: bigint;
  /** Inner write — usually `buyPolicy` or `deposit`. */
  contract: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args: TArgs;
  };
}

export function useApproveAndCall<TArgs extends readonly unknown[]>() {
  const { address } = useAccount();
  const [step, setStep] = useState<ApproveStep>("idle");
  const [pending, setPending] = useState<ApproveAndCallParams<TArgs> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allowanceQ = useReadContract({
    address: V3_ADDRESSES.mockUsdc,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: address && pending ? [address, pending.spender] : undefined,
    query: {
      enabled: !!address && !!pending,
      staleTime: 1_000,
    },
  });

  // Approve tx
  const approve = useWriteContract();
  const approveWait = useWaitForTransactionReceipt({
    hash: approve.data,
    query: { enabled: !!approve.data },
  });

  // Main inner tx
  const inner = useWriteContract();
  const innerWait = useWaitForTransactionReceipt({
    hash: inner.data,
    query: { enabled: !!inner.data },
  });

  /**
   * Kick off the flow. Idempotent — second call replaces the in-flight params.
   */
  const start = useCallback(
    async (params: ApproveAndCallParams<TArgs>) => {
      setErrorMsg(null);
      setPending(params);
      setStep("checking-allowance");
    },
    [],
  );

  // Once we have an allowance reading, decide whether to approve or skip.
  useEffect(() => {
    if (!pending || step !== "checking-allowance") return;
    if (allowanceQ.isLoading) return;
    const current = (allowanceQ.data as bigint | undefined) ?? 0n;

    if (current >= pending.amount) {
      // Skip approve — go straight to inner.
      setStep("executing");
      try {
        inner.writeContract({
          address: pending.contract.address,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          abi: pending.contract.abi as any,
          functionName: pending.contract.functionName,
          args: pending.contract.args as readonly unknown[],
        });
      } catch (e) {
        setStep("error");
        setErrorMsg(e instanceof Error ? e.message : String(e));
      }
    } else {
      setStep("approving");
      try {
        approve.writeContract({
          address: V3_ADDRESSES.mockUsdc,
          abi: MOCK_USDC_ABI,
          functionName: "approve",
          args: [pending.spender, pending.amount],
        });
      } catch (e) {
        setStep("error");
        setErrorMsg(e instanceof Error ? e.message : String(e));
      }
    }
  }, [pending, step, allowanceQ.isLoading, allowanceQ.data, approve, inner]);

  // When approve is mined, fire the inner write.
  useEffect(() => {
    if (step !== "approving") return;
    if (approve.error) {
      setStep("error");
      setErrorMsg(approve.error.message);
      return;
    }
    if (approveWait.isSuccess && pending) {
      setStep("executing");
      try {
        inner.writeContract({
          address: pending.contract.address,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          abi: pending.contract.abi as any,
          functionName: pending.contract.functionName,
          args: pending.contract.args as readonly unknown[],
        });
      } catch (e) {
        setStep("error");
        setErrorMsg(e instanceof Error ? e.message : String(e));
      }
    }
  }, [step, approveWait.isSuccess, approve.error, pending, inner]);

  // When inner write is mined, transition to confirmed.
  useEffect(() => {
    if (step !== "executing") return;
    if (inner.error) {
      setStep("error");
      setErrorMsg(inner.error.message);
      return;
    }
    if (innerWait.isSuccess) {
      setStep("confirmed");
    }
  }, [step, innerWait.isSuccess, inner.error]);

  const reset = useCallback(() => {
    setStep("idle");
    setPending(null);
    setErrorMsg(null);
  }, []);

  return useMemo(
    () => ({
      step,
      start,
      reset,
      errorMsg,
      approveTxHash: approve.data,
      innerTxHash: inner.data,
      isBusy:
        step === "checking-allowance" ||
        step === "approving" ||
        step === "executing",
      isConfirmed: step === "confirmed",
    }),
    [step, start, reset, errorMsg, approve.data, inner.data],
  );
}
