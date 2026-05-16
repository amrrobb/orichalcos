/**
 * Hook bundle for the v3 MockYieldVault — a demo-grade simulated yield wrapper.
 *
 * Yield is minted from a deployer-seeded reserve, not earned from a real
 * protocol. Mirrors the shape of `useInsurancePool` for symmetry.
 *
 * Refetch cadence is fast (10s) so the previewYield number visibly ticks
 * for demo audiences.
 */
"use client";

import { useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import { V3_ADDRESSES } from "@/lib/contracts";
import { MOCK_YIELD_VAULT_ABI } from "@/lib/abi/v3";
import { useApproveAndCall } from "./useApproveAndCall";

export interface MockVaultState {
  totalAssets: bigint | undefined;
  userBalance: bigint | undefined;
  previewYield: bigint | undefined;
  apyBps: number | undefined;
  reserve: bigint | undefined;
  isLoading: boolean;
  refetch: () => void;
}

export function useMockVault(): MockVaultState & {
  deposit: (assets: bigint) => void;
  withdraw: (shares: bigint) => void;
  flow: ReturnType<typeof useApproveAndCall<readonly [bigint]>>;
} {
  const { address } = useAccount();

  const totalAssets = useReadContract({
    address: V3_ADDRESSES.mockYieldVault,
    abi: MOCK_YIELD_VAULT_ABI,
    functionName: "totalAssets",
    query: { staleTime: 5_000, refetchInterval: 10_000 },
  });

  const reserve = useReadContract({
    address: V3_ADDRESSES.mockYieldVault,
    abi: MOCK_YIELD_VAULT_ABI,
    functionName: "reserve",
    query: { staleTime: 5_000, refetchInterval: 10_000 },
  });

  const userBalance = useReadContract({
    address: V3_ADDRESSES.mockYieldVault,
    abi: MOCK_YIELD_VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 5_000, refetchInterval: 10_000 },
  });

  const previewYield = useReadContract({
    address: V3_ADDRESSES.mockYieldVault,
    abi: MOCK_YIELD_VAULT_ABI,
    functionName: "previewYield",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 2_000, refetchInterval: 10_000 },
  });

  const apy = useReadContract({
    address: V3_ADDRESSES.mockYieldVault,
    abi: MOCK_YIELD_VAULT_ABI,
    functionName: "apyBps",
    query: { staleTime: 60_000 },
  });

  const flow = useApproveAndCall<readonly [bigint]>();

  const deposit = useCallback(
    (assets: bigint) => {
      flow.start({
        spender: V3_ADDRESSES.mockYieldVault,
        amount: assets,
        contract: {
          address: V3_ADDRESSES.mockYieldVault,
          abi: MOCK_YIELD_VAULT_ABI,
          functionName: "deposit",
          args: [assets],
        },
      });
    },
    [flow],
  );

  const withdraw = useCallback(
    (shares: bigint) => {
      // Withdraw doesn't need approval — but reusing approve flow with
      // amount=0 makes the state machine sit idle. Skip the wrapper and
      // call directly: re-use the inner flow shape by starting with a
      // zero approval (which will short-circuit to executing immediately).
      flow.start({
        spender: V3_ADDRESSES.mockYieldVault,
        amount: 0n, // no USDC pull on withdraw — allowance check skips approve
        contract: {
          address: V3_ADDRESSES.mockYieldVault,
          abi: MOCK_YIELD_VAULT_ABI,
          functionName: "withdraw",
          args: [shares],
        },
      });
    },
    [flow],
  );

  const refetch = () => {
    totalAssets.refetch();
    reserve.refetch();
    userBalance.refetch();
    previewYield.refetch();
  };

  return {
    totalAssets: totalAssets.data as bigint | undefined,
    userBalance: userBalance.data as bigint | undefined,
    previewYield: previewYield.data as bigint | undefined,
    apyBps: apy.data as number | undefined,
    reserve: reserve.data as bigint | undefined,
    isLoading: totalAssets.isLoading || userBalance.isLoading,
    refetch,
    deposit,
    withdraw,
    flow,
  };
}
