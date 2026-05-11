/**
 * v3 — StrategyINFT reads.
 *
 * Wraps wagmi's useReadContract against StrategyINFT.getData / ownerOf /
 * breachThreshold for the Risk-Management Protocol detail page.
 *
 * The contract returns getData as a struct (tuple decoded as an object by viem).
 * We coerce uint8 enums (archetype, status) into JS numbers and keep the bigint
 * fields as bigint so callers can do BigInt math without precision loss.
 */
"use client";

import { useReadContract } from "wagmi";
import { V3_ADDRESSES } from "@/lib/contracts";
import { STRATEGY_INFT_ABI } from "@/lib/abi/v3";

export interface StrategyData {
  archetype: number;          // 0=Bold, 1=Patient, 2=Sharp, 3=Stoic
  sealedSoulRoot: `0x${string}`;
  metadataHash: `0x${string}`;
  mintedBy: `0x${string}`;
  mintedAt: bigint;
  currentEpochId: bigint;
  startingBond: bigint;       // USDC (6 dp)
  bondAmount: bigint;         // USDC (6 dp) — remaining bond
  maxDrawdownBps: bigint;     // basis points (e.g. 2000 = 20%)
  epochStartTs: bigint;
  epochEndTs: bigint;
  currentEquity: bigint;      // USDC (6 dp)
  status: number;             // 0=Idle, 1=Active, 2=Breached, 3=Settled
}

export function useStrategyData(tokenId: bigint | number | undefined) {
  const tid = tokenId === undefined ? undefined : BigInt(tokenId);
  const result = useReadContract({
    address: V3_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "getData",
    args: tid !== undefined ? [tid] : undefined,
    query: {
      enabled: tid !== undefined,
      staleTime: 15_000,
    },
  });

  // viem returns the struct as an object keyed by field name.
  const raw = result.data as
    | {
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
    | undefined;

  return {
    ...result,
    data: raw as StrategyData | undefined,
  };
}

export function useStrategyOwner(tokenId: bigint | number | undefined) {
  const tid = tokenId === undefined ? undefined : BigInt(tokenId);
  return useReadContract({
    address: V3_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "ownerOf",
    args: tid !== undefined ? [tid] : undefined,
    query: { enabled: tid !== undefined, staleTime: 30_000 },
  });
}

/** breachThreshold = startingBond * (10000 - maxDrawdownBps) / 10000.
 *  We could derive client-side, but reading the contract keeps it in sync if the
 *  formula ever changes. */
export function useStrategyBreachThreshold(tokenId: bigint | number | undefined) {
  const tid = tokenId === undefined ? undefined : BigInt(tokenId);
  return useReadContract({
    address: V3_ADDRESSES.strategyINFT,
    abi: STRATEGY_INFT_ABI,
    functionName: "breachThreshold",
    args: tid !== undefined ? [tid] : undefined,
    query: { enabled: tid !== undefined, staleTime: 60_000 },
  });
}
