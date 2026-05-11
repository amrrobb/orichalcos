/**
 * Hook bundle for the v3 InsurancePool — pool stats + a user's LP position.
 *
 * Single hook to keep callers simple. Re-uses wagmi caching automatically
 * (the same `useReadContract` key is shared across components).
 */
"use client";

import { useAccount, useReadContract } from "wagmi";
import { V3_ADDRESSES, V3_PREMIUM_BPS_DEFAULT } from "@/lib/contracts";
import { INSURANCE_POOL_ABI } from "@/lib/abi/v3";

export interface InsurancePoolStats {
  totalAssets: bigint | undefined;
  totalShares: bigint | undefined;
  premiumBps: number;
  userShares: bigint | undefined;
  userAssetValue: bigint | undefined;
  isLoading: boolean;
  refetch: () => void;
}

export function useInsurancePool(): InsurancePoolStats {
  const { address } = useAccount();

  const totalAssets = useReadContract({
    address: V3_ADDRESSES.insurancePool,
    abi: INSURANCE_POOL_ABI,
    functionName: "totalAssets",
    query: { staleTime: 10_000, refetchInterval: 15_000 },
  });

  const totalShares = useReadContract({
    address: V3_ADDRESSES.insurancePool,
    abi: INSURANCE_POOL_ABI,
    functionName: "totalShares",
    query: { staleTime: 10_000, refetchInterval: 15_000 },
  });

  const premiumBps = useReadContract({
    address: V3_ADDRESSES.insurancePool,
    abi: INSURANCE_POOL_ABI,
    functionName: "premiumBps",
    query: { staleTime: 60_000 },
  });

  const userShares = useReadContract({
    address: V3_ADDRESSES.insurancePool,
    abi: INSURANCE_POOL_ABI,
    functionName: "lpShares",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 5_000, refetchInterval: 15_000 },
  });

  const userAssetValue = useReadContract({
    address: V3_ADDRESSES.insurancePool,
    abi: INSURANCE_POOL_ABI,
    functionName: "lpAssetValue",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 5_000, refetchInterval: 15_000 },
  });

  const refetch = () => {
    totalAssets.refetch();
    totalShares.refetch();
    userShares.refetch();
    userAssetValue.refetch();
  };

  return {
    totalAssets: totalAssets.data as bigint | undefined,
    totalShares: totalShares.data as bigint | undefined,
    premiumBps: (premiumBps.data as number | undefined) ?? V3_PREMIUM_BPS_DEFAULT,
    userShares: userShares.data as bigint | undefined,
    userAssetValue: userAssetValue.data as bigint | undefined,
    isLoading:
      totalAssets.isLoading || totalShares.isLoading || premiumBps.isLoading,
    refetch,
  };
}
