"use client";

import { useEffect, useState, useMemo } from "react";
import { useReadContracts, useWatchContractEvent, usePublicClient } from "wagmi";
import { ADDRESSES } from "@/lib/contracts";
import { SCRYING_DUEL_ABI } from "@/lib/abi";
import type { DuelData } from "./useDuel";

export interface DuelSummary {
  duelId: bigint;
  data: DuelData;
  /** Block timestamp from chain. Falls back to Date.now() for newly-arrived events. */
  observedAt: number;
}

const HISTORY_WINDOW = 8; // pre-load the most recent 8 settled duels

/**
 * useDuelEvents — provides a live, append-on-event feed of recent duels.
 *
 * Strategy:
 *   1. On mount, read nextDuelId() and parallel-fetch the most recent N duels.
 *      Filter to status=Settled (skip Open/Cancelled).
 *   2. Subscribe to DuelSettled events. New events prepend to the feed.
 *   3. Expose isLive flag for UI display.
 */
export function useDuelEvents(): {
  duels: DuelSummary[];
  isLive: boolean;
  isLoading: boolean;
} {
  const [extraDuels, setExtraDuels] = useState<DuelSummary[]>([]);
  const [isLive, setIsLive] = useState(false);
  const publicClient = usePublicClient();

  // Pre-load: read nextDuelId, then read the most recent N duels in parallel
  const nextIdRead = useReadContracts({
    contracts: [
      {
        address: ADDRESSES.scryingDuel,
        abi: SCRYING_DUEL_ABI,
        functionName: "nextDuelId" as const,
      },
    ],
    query: { staleTime: 5_000 },
  });

  const nextId =
    nextIdRead.data?.[0]?.status === "success" ? (nextIdRead.data[0].result as bigint) : 1n;

  // Build the list of duelIds to fetch: nextId-1 down to max(1, nextId-HISTORY_WINDOW)
  const idsToFetch = useMemo(() => {
    if (!nextId || nextId <= 1n) return [];
    const end = nextId - 1n;
    const start = end >= BigInt(HISTORY_WINDOW) ? end - BigInt(HISTORY_WINDOW) + 1n : 1n;
    const ids: bigint[] = [];
    for (let i = end; i >= start; i--) ids.push(i);
    return ids;
  }, [nextId]);

  const historyRead = useReadContracts({
    contracts: idsToFetch.map((id) => ({
      address: ADDRESSES.scryingDuel,
      abi: SCRYING_DUEL_ABI,
      functionName: "getDuel" as const,
      args: [id] as const,
    })),
    query: { enabled: idsToFetch.length > 0, staleTime: 30_000 },
  });

  // Subscribe to DuelSettled
  useWatchContractEvent({
    address: ADDRESSES.scryingDuel,
    abi: SCRYING_DUEL_ABI,
    eventName: "DuelSettled",
    onLogs: async (logs) => {
      setIsLive(true);
      if (!publicClient) return;
      for (const log of logs) {
        const args = log.args as unknown as { duelId?: bigint };
        const duelId = args.duelId;
        if (!duelId) continue;
        try {
          const data = (await publicClient.readContract({
            address: ADDRESSES.scryingDuel,
            abi: SCRYING_DUEL_ABI,
            functionName: "getDuel",
            args: [duelId],
          })) as DuelData;
          setExtraDuels((prev) => {
            // Dedupe — newer events take priority
            const filtered = prev.filter((d) => d.duelId !== duelId);
            return [{ duelId, data, observedAt: Date.now() }, ...filtered];
          });
        } catch {
          // Best-effort; ignore
        }
      }
    },
    onError: () => setIsLive(false),
  });

  const historyDuels: DuelSummary[] = useMemo(() => {
    if (!historyRead.data) return [];
    return historyRead.data
      .map((r, i) => {
        if (r.status !== "success") return null;
        const data = r.result as DuelData;
        // Keep only Settled (status=2) duels in the feed
        if (Number(data.status) !== 2) return null;
        return {
          duelId: idsToFetch[i],
          data,
          observedAt: Number(data.settleTimestamp) * 1000,
        } satisfies DuelSummary;
      })
      .filter((x): x is DuelSummary => x !== null);
  }, [historyRead.data, idsToFetch]);

  // Merge: extras take priority, then history, deduped
  const duels = useMemo(() => {
    const seen = new Set<string>();
    const all: DuelSummary[] = [];
    for (const d of [...extraDuels, ...historyDuels]) {
      const k = d.duelId.toString();
      if (seen.has(k)) continue;
      seen.add(k);
      all.push(d);
    }
    // Already mostly newest-first; sort defensively
    all.sort((a, b) => b.observedAt - a.observedAt);
    return all.slice(0, HISTORY_WINDOW);
  }, [extraDuels, historyDuels]);

  return {
    duels,
    isLive,
    isLoading: nextIdRead.isLoading || historyRead.isLoading,
  };
}
