"use client";

import { useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import { ADDRESSES } from "@/lib/contracts";
import { SCRYING_DUEL_ABI } from "@/lib/abi";

export type DuelStatus = "Open" | "Committed" | "Settled" | "Cancelled";
const STATUS_LABELS: DuelStatus[] = ["Open", "Committed", "Settled", "Cancelled"];

export interface DuelData {
  challengerTokenId: bigint;
  defenderTokenId: bigint;
  priceFeedId: `0x${string}`;
  priceAtCommit: bigint;
  commitTimestamp: bigint;
  settleTimestamp: bigint;
  windowSeconds: bigint;
  challengerCall: number;
  defenderCall: number;
  challengerTellHash: `0x${string}`;
  defenderTellHash: `0x${string}`;
  challengerAttestationHash: `0x${string}`;
  defenderAttestationHash: `0x${string}`;
  stake: bigint;
  status: number;
  challengerCommitted: boolean;
  defenderCommitted: boolean;
}

export function useDuel(duelId: bigint | number | undefined) {
  const did = duelId === undefined ? undefined : BigInt(duelId);
  const result = useReadContract({
    address: ADDRESSES.scryingDuel,
    abi: SCRYING_DUEL_ABI,
    functionName: "getDuel",
    args: did !== undefined ? [did] : undefined,
    query: { enabled: did !== undefined && did > 0n, staleTime: 30_000 },
  });

  return {
    ...result,
    data: result.data as DuelData | undefined,
    statusLabel: result.data ? STATUS_LABELS[(result.data as DuelData).status] : undefined,
  };
}

export function useNextDuelId() {
  return useReadContract({
    address: ADDRESSES.scryingDuel,
    abi: SCRYING_DUEL_ABI,
    functionName: "nextDuelId",
    query: { staleTime: 5_000 },
  });
}

/** Fetch the public-tell JSON for a given merkle root via /api/tell. */
export interface PublicTell {
  duelId?: string;
  apprentice?: string;
  archetype?: string;
  direction?: string;
  publicTell?: string;
  confidence?: number;
  teeAttestation?: {
    chatId?: string;
    model?: string;
    isValid?: boolean;
  };
  // Allow forward-compat fields without breaking the shape
  [key: string]: unknown;
}

export function usePublicTell(rootHash: `0x${string}` | undefined) {
  const [data, setData] = useState<PublicTell | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rootHash || rootHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/tell?root=${rootHash}`)
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j.error || `HTTP ${r.status}`))))
      .then((j) => {
        if (!cancelled) setData(j as PublicTell);
      })
      .catch((e) => {
        if (!cancelled) setError(typeof e === "string" ? e : e?.message || "fetch failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rootHash]);

  return { data, error, loading };
}
