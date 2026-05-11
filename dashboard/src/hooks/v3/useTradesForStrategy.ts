/**
 * v3 — TradeAttestation.getTrades(strategyId) reader.
 *
 * Returns the full array of attested trades for a strategy. Auto-refetches
 * every 10s so a demo viewer sees new trades as they land. Returns an empty
 * array (not undefined) on success so consumers can render an empty state
 * without juggling null guards.
 */
"use client";

import { useReadContract } from "wagmi";
import { V3_ADDRESSES } from "@/lib/contracts";
import { TRADE_ATTESTATION_ABI } from "@/lib/abi/v3";

export interface Trade {
  strategyId: bigint;
  epochId: bigint;
  chatId: `0x${string}`;        // 0G Compute TEE attestation id
  storageRoot: `0x${string}`;   // 0G Storage merkle root
  hyperliquidTxHash: `0x${string}`; // hashed oid (see HYPERLIQUID_NOTES.md)
  pnlDelta: bigint;             // signed int256, USDC 6dp
  equityAfter: bigint;          // uint256, USDC 6dp
  timestamp: bigint;            // unix seconds
}

export function useTradesForStrategy(strategyId: bigint | number | undefined) {
  const sid = strategyId === undefined ? undefined : BigInt(strategyId);
  const result = useReadContract({
    address: V3_ADDRESSES.tradeAttestation,
    abi: TRADE_ATTESTATION_ABI,
    functionName: "getTrades",
    args: sid !== undefined ? [sid] : undefined,
    query: {
      enabled: sid !== undefined,
      staleTime: 5_000,
      refetchInterval: 10_000,
    },
  });

  const trades = (result.data as readonly Trade[] | undefined) ?? [];
  return { ...result, trades };
}
