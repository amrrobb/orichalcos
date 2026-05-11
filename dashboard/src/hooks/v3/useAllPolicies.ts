/**
 * Fetch every Policy for a given (strategyId, epochId) pair.
 * Two-stage read: policiesFor -> getPolicy multicall.
 *
 * Used by:
 *  - Route 2 (insure form) to compute remaining coverage room.
 *  - Strategy detail page to list active policies.
 */
"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { V3_ADDRESSES, POLICY_STATUSES, type PolicyStatus } from "@/lib/contracts";
import { INSURANCE_POOL_ABI } from "@/lib/abi/v3";

export interface Policy {
  policyId: bigint;
  strategyId: bigint;
  epochId: bigint;
  allocator: `0x${string}`;
  premium: bigint;
  maxClaim: bigint;
  status: number;
  statusLabel: PolicyStatus;
}

export function useAllPolicies(
  strategyId: bigint | number | undefined,
  epochId: bigint | number | undefined,
) {
  const sid = strategyId === undefined ? undefined : BigInt(strategyId);
  const eid = epochId === undefined ? undefined : BigInt(epochId);

  const idsQ = useReadContract({
    address: V3_ADDRESSES.insurancePool,
    abi: INSURANCE_POOL_ABI,
    functionName: "policiesFor",
    args: sid !== undefined && eid !== undefined ? [sid, eid] : undefined,
    query: {
      enabled: sid !== undefined && eid !== undefined && eid > 0n,
      staleTime: 5_000,
      refetchInterval: 10_000,
    },
  });

  const policyIds = (idsQ.data as bigint[] | undefined) ?? [];

  const contracts = useMemo(
    () =>
      policyIds.map((pid) => ({
        address: V3_ADDRESSES.insurancePool,
        abi: INSURANCE_POOL_ABI,
        functionName: "getPolicy" as const,
        args: [pid] as const,
      })),
    [policyIds],
  );

  const detailsQ = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
      staleTime: 5_000,
      refetchInterval: 10_000,
    },
  });

  const policies: Policy[] = useMemo(() => {
    if (!detailsQ.data) return [];
    return detailsQ.data
      .map((r, i) => {
        if (r?.status !== "success" || !r.result) return null;
        const p = r.result as unknown as Omit<Policy, "policyId" | "statusLabel">;
        return {
          policyId: policyIds[i],
          strategyId: p.strategyId,
          epochId: p.epochId,
          allocator: p.allocator,
          premium: p.premium,
          maxClaim: p.maxClaim,
          status: p.status,
          statusLabel: POLICY_STATUSES[p.status] ?? "Active",
        } as Policy;
      })
      .filter((x): x is Policy => x !== null);
  }, [detailsQ.data, policyIds]);

  return {
    policies,
    policyIds,
    isLoading: idsQ.isLoading || detailsQ.isLoading,
    refetch: () => {
      idsQ.refetch();
      detailsQ.refetch();
    },
  };
}

/** Read allocatedCoverage for the given strategy/epoch — sum bought so far. */
export function useAllocatedCoverage(
  strategyId: bigint | number | undefined,
  epochId: bigint | number | undefined,
) {
  const sid = strategyId === undefined ? undefined : BigInt(strategyId);
  const eid = epochId === undefined ? undefined : BigInt(epochId);
  return useReadContract({
    address: V3_ADDRESSES.insurancePool,
    abi: INSURANCE_POOL_ABI,
    functionName: "allocatedCoverage",
    args: sid !== undefined && eid !== undefined ? [sid, eid] : undefined,
    query: {
      enabled: sid !== undefined && eid !== undefined && eid > 0n,
      staleTime: 5_000,
      refetchInterval: 10_000,
    },
  });
}
