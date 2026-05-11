/**
 * Polls `StrategyINFT.isInBreach(tokenId)` every 5s while the strategy is Active.
 *
 * Returns the breach state plus the underlying epoch status so the UI can
 * decide which CTAs to render (markBreach vs settleEpoch).
 *
 * Importantly, `isInBreach` returns:
 *   - `currentEquity <= threshold` while status === Active
 *   - `status === Breached`            while status !== Active
 * So when status is Idle/Settled the result is false; we still expose status
 * separately so the banner can show "Breached" until settle is called.
 */
"use client";

import { useReadContract } from "wagmi";
import { V3_ADDRESSES, EPOCH_STATUSES } from "@/lib/contracts";
import { STRATEGY_INFT_ABI } from "@/lib/abi/v3";
import { useStrategy } from "./useStrategies";

export interface BreachState {
  isInBreach: boolean;          // raw contract view
  isBreachVisible: boolean;     // UI: show banner?
  canMarkBreach: boolean;       // status===Active AND isInBreach===true
  canSettle: boolean;           // status===Breached OR (Active AND past epochEndTs)
  status: number | undefined;
  statusLabel: string | undefined;
  epochEndTs: bigint | undefined;
  refetch: () => void;
}

export function useBreachStatus(tokenId: bigint | number | undefined): BreachState {
  const tid = tokenId === undefined ? undefined : BigInt(tokenId);
  const strat = useStrategy(tid);

  // Only poll isInBreach while the strategy is in a state where it could change.
  // Once Settled/Idle, the value is stable.
  const isStillRelevant =
    strat.data?.status === 1 /* Active */ ||
    strat.data?.status === 2 /* Breached */;

  const breachQ = useReadContract({
    address: V3_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "isInBreach",
    args: tid !== undefined ? [tid] : undefined,
    query: {
      enabled: tid !== undefined && isStillRelevant,
      staleTime: 2_000,
      refetchInterval: 5_000,
    },
  });

  const status = strat.data?.status;
  const isInBreach = (breachQ.data as boolean | undefined) ?? false;
  const epochEndTs = strat.data?.epochEndTs;
  const nowSecs = Math.floor(Date.now() / 1000);

  const canMarkBreach = status === 1 && isInBreach;
  const canSettle =
    status === 2 ||
    (status === 1 && epochEndTs !== undefined && Number(epochEndTs) <= nowSecs);
  const isBreachVisible = status === 2 || canMarkBreach;

  return {
    isInBreach,
    isBreachVisible,
    canMarkBreach,
    canSettle,
    status,
    statusLabel: status !== undefined ? EPOCH_STATUSES[status] : undefined,
    epochEndTs,
    refetch: () => {
      strat.refetch();
      breachQ.refetch();
    },
  };
}
