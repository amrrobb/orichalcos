/**
 * Enumerate all minted StrategyINFT tokens via `nextTokenId` then
 * batch-read `getData(tokenId)` for tokenIds [1..nextTokenId-1].
 *
 * Token 0 is reserved (matches v2 pattern). Skip it.
 *
 * `useStrategy(tokenId)` — single-token convenience hook.
 */
"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import {
  V3_ADDRESSES,
  EPOCH_STATUSES,
  LEGACY_STRATEGY_TOKEN_IDS,
  type EpochStatus,
} from "@/lib/contracts";
import { STRATEGY_INFT_ABI } from "@/lib/abi/v3";

export interface StrategyData {
  archetype: number;
  sealedSoulRoot: `0x${string}`;
  metadataHash: `0x${string}`;
  mintedBy: `0x${string}`;
  mintedAt: bigint;
  currentEpochId: bigint;
  startingBond: bigint;
  bondAmount: bigint;
  maxDrawdownBps: bigint;
  epochStartTs: bigint;
  epochEndTs: bigint;
  currentEquity: bigint;
  status: number;
}

export interface StrategyEntry {
  tokenId: bigint;
  data: StrategyData;
  statusLabel: EpochStatus;
}

export function useNextStrategyTokenId() {
  return useReadContract({
    address: V3_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "nextTokenId",
    query: { staleTime: 15_000, refetchInterval: 20_000 },
  });
}

/** Returns all minted strategies (token 0 skipped). */
export function useStrategies() {
  const { data: next, isLoading: isNextLoading, refetch: refetchNext } =
    useNextStrategyTokenId();
  const nextId = typeof next === "bigint" ? Number(next) : 0;

  const contracts = useMemo(() => {
    if (nextId <= 1) return [];
    return Array.from({ length: nextId - 1 }, (_, i) => ({
      address: V3_ADDRESSES.strategyINFT,
      abi: STRATEGY_INFT_ABI,
      functionName: "getData" as const,
      args: [BigInt(i + 1)] as const,
    }));
  }, [nextId]);

  const owners = useMemo(() => {
    if (nextId <= 1) return [];
    return Array.from({ length: nextId - 1 }, (_, i) => ({
      address: V3_ADDRESSES.strategyINFT,
      abi: STRATEGY_INFT_ABI,
      functionName: "ownerOf" as const,
      args: [BigInt(i + 1)] as const,
    }));
  }, [nextId]);

  const dataResult = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
      staleTime: 5_000,
      refetchInterval: 10_000,
    },
  });

  const ownerResult = useReadContracts({
    contracts: owners,
    query: { enabled: owners.length > 0, staleTime: 30_000 },
  });

  const strategies: StrategyEntry[] = useMemo(() => {
    const list: StrategyEntry[] = [];
    if (!dataResult.data) return list;
    for (let i = 0; i < dataResult.data.length; i++) {
      const entry = dataResult.data[i];
      const tokenId = BigInt(i + 1);
      if (LEGACY_STRATEGY_TOKEN_IDS.has(tokenId)) continue; // see contracts.ts comment
      if (entry?.status === "success" && entry.result) {
        const d = entry.result as unknown as StrategyData;
        list.push({
          tokenId,
          data: d,
          statusLabel: EPOCH_STATUSES[d.status],
        });
      }
    }
    return list;
  }, [dataResult.data]);

  // tokenId -> owner map
  const ownerMap = useMemo(() => {
    const m = new Map<string, `0x${string}`>();
    if (!ownerResult.data) return m;
    for (let i = 0; i < ownerResult.data.length; i++) {
      const r = ownerResult.data[i];
      if (r?.status === "success" && r.result) {
        m.set(String(i + 1), r.result as `0x${string}`);
      }
    }
    return m;
  }, [ownerResult.data]);

  return {
    strategies,
    ownerMap,
    isLoading: isNextLoading || dataResult.isLoading,
    refetch: () => {
      refetchNext();
      dataResult.refetch();
      ownerResult.refetch();
    },
  };
}

/** Single-strategy hook for the insure/detail flow. */
export function useStrategy(tokenId: bigint | number | undefined) {
  const tid = tokenId === undefined ? undefined : BigInt(tokenId);

  const dataQ = useReadContract({
    address: V3_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "getData",
    args: tid !== undefined ? [tid] : undefined,
    query: {
      enabled: tid !== undefined,
      staleTime: 5_000,
      refetchInterval: 10_000,
    },
  });

  const ownerQ = useReadContract({
    address: V3_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "ownerOf",
    args: tid !== undefined ? [tid] : undefined,
    query: { enabled: tid !== undefined, staleTime: 30_000 },
  });

  const data = dataQ.data as unknown as StrategyData | undefined;

  return {
    data,
    owner: ownerQ.data as `0x${string}` | undefined,
    statusLabel: data ? EPOCH_STATUSES[data.status] : undefined,
    isLoading: dataQ.isLoading || ownerQ.isLoading,
    isError: dataQ.isError || ownerQ.isError,
    refetch: () => {
      dataQ.refetch();
      ownerQ.refetch();
    },
  };
}
