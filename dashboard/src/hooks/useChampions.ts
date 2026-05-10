"use client";

import { useReadContracts } from "wagmi";
import { ADDRESSES } from "@/lib/contracts";
import { CODEX_ABI, APPRENTICE_INFT_ABI } from "@/lib/abi";
import type { ApprenticeData } from "./useApprentice";
import { TYPE_BY_INDEX } from "@/lib/constants";

export interface ChampionEntry {
  type: (typeof TYPE_BY_INDEX)[number];
  typeIndex: number;
  tokenId: bigint;
  data: ApprenticeData | undefined;
}

/**
 * Reads championOf(0..3) → tokenIds, then getData on each.
 * Returns the four Champions in TYPE_BY_INDEX order (Bold, Patient, Sharp, Stoic).
 */
export function useChampions() {
  const championIds = useReadContracts({
    contracts: TYPE_BY_INDEX.map((_, i) => ({
      address: ADDRESSES.codex,
      abi: CODEX_ABI,
      functionName: "championOf" as const,
      args: [i] as const,
    })),
    query: { staleTime: 60_000 },
  });

  const tokenIds = championIds.data?.map((r) => (r.status === "success" ? (r.result as bigint) : 0n)) ?? [
    0n,
    0n,
    0n,
    0n,
  ];

  const datas = useReadContracts({
    contracts: tokenIds.map((tid) => ({
      address: ADDRESSES.apprenticeINFT,
      abi: APPRENTICE_INFT_ABI,
      functionName: "getData" as const,
      args: [tid] as const,
    })),
    query: { enabled: tokenIds.some((t) => t > 0n), staleTime: 30_000 },
  });

  const champions: ChampionEntry[] = TYPE_BY_INDEX.map((type, i) => ({
    type,
    typeIndex: i,
    tokenId: tokenIds[i] ?? 0n,
    data: datas.data?.[i]?.status === "success" ? (datas.data[i].result as ApprenticeData) : undefined,
  }));

  return {
    champions,
    isLoading: championIds.isLoading || datas.isLoading,
    isError: championIds.isError || datas.isError,
  };
}
