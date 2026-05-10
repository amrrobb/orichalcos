"use client";

import { useReadContract } from "wagmi";
import { ADDRESSES } from "@/lib/contracts";
import { APPRENTICE_INFT_ABI } from "@/lib/abi";

export interface ApprenticeData {
  apprenticeType: number;
  currentTitle: number;
  elo: number;
  wins: number;
  losses: number;
  sealedSoulRoot: `0x${string}`;
  metadataHash: `0x${string}`;
  mintedBy: `0x${string}`;
  mintedAt: bigint;
  championBeaten: boolean;
}

export function useApprentice(tokenId: bigint | number | undefined) {
  const tid = tokenId === undefined ? undefined : BigInt(tokenId);
  const result = useReadContract({
    address: ADDRESSES.apprenticeINFT,
    abi: APPRENTICE_INFT_ABI,
    functionName: "getData",
    args: tid !== undefined ? [tid] : undefined,
    query: {
      enabled: tid !== undefined,
      staleTime: 30_000,
    },
  });

  // Coerce viem's tuple struct decoding into our typed shape.
  // viem returns the tuple as an object with the struct field names, but bigint/uint
  // primitives stay as bigint. Convert numbers we want as JS numbers (small uints).
  const data = result.data as
    | (Omit<ApprenticeData, "elo" | "wins" | "losses" | "apprenticeType" | "currentTitle" | "mintedAt"> & {
        apprenticeType: number;
        currentTitle: number;
        elo: number;
        wins: number;
        losses: number;
        mintedAt: bigint;
      })
    | undefined;

  return {
    ...result,
    data: data as ApprenticeData | undefined,
  };
}

export function useApprenticeOwner(tokenId: bigint | number | undefined) {
  const tid = tokenId === undefined ? undefined : BigInt(tokenId);
  return useReadContract({
    address: ADDRESSES.apprenticeINFT,
    abi: APPRENTICE_INFT_ABI,
    functionName: "ownerOf",
    args: tid !== undefined ? [tid] : undefined,
    query: { enabled: tid !== undefined, staleTime: 30_000 },
  });
}

export function useNextTokenId() {
  return useReadContract({
    address: ADDRESSES.apprenticeINFT,
    abi: APPRENTICE_INFT_ABI,
    functionName: "nextTokenId",
    query: { staleTime: 15_000 },
  });
}
