/**
 * Read connected wallet's MockUSDC balance. Used by the deposit + buy
 * flows to show "you have X USDC" microcopy.
 */
"use client";

import { useAccount, useReadContract } from "wagmi";
import { V3_ADDRESSES } from "@/lib/contracts";
import { MOCK_USDC_ABI } from "@/lib/abi/v3";

export function useUsdcBalance() {
  const { address } = useAccount();
  return useReadContract({
    address: V3_ADDRESSES.mockUsdc,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 5_000,
      refetchInterval: 15_000,
    },
  });
}
