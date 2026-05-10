/**
 * Champion roster — name lookup by tokenId.
 *
 * Sourced from agent/data/champions.json (committed). The contract has only
 * the type+tokenId mapping in Codex.championOf; names are off-chain metadata.
 *
 * Pinned to the current Galileo deployment. If the contract redeploys with
 * different tokenIds, regenerate from agent/data/champions.json.
 */
import type { ApprenticeType } from "./contracts";

export interface ChampionMeta {
  name: string;
  type: ApprenticeType;
  tokenId: bigint;
  sealedSoulRoot: `0x${string}`;
  /** Sanskrit/Indonesian element meaning */
  elementMeaning: string;
}

export const CHAMPIONS: ChampionMeta[] = [
  {
    name: "Agni",
    type: "Bold",
    tokenId: 1n,
    sealedSoulRoot: "0xf5090969d3fbb6f3bc7864d79baf85cd7851fe95a089e3c56055ffb2d0222ae2",
    elementMeaning: "fire",
  },
  {
    name: "Tirta",
    type: "Patient",
    tokenId: 2n,
    sealedSoulRoot: "0x81f9d2699d38af1a1fccd9e0e712f7fe09ecc4981ce2a22a54e01f54e4c58062",
    elementMeaning: "water",
  },
  {
    name: "Bayu",
    type: "Sharp",
    tokenId: 3n,
    sealedSoulRoot: "0xa11e5f909156707dc0766cc9f7667d7992891407e06d7f520f007b56fb7d01cc",
    elementMeaning: "wind",
  },
  {
    name: "Pertiwi",
    type: "Stoic",
    tokenId: 4n,
    sealedSoulRoot: "0xafded0f5edcf3466a0553940d4fe987e2f82a902bd1db0fbe2a9ff1e30c94c60",
    elementMeaning: "earth",
  },
];

/** Lookup helper used by ApprenticeCard, DuelStage, etc. */
export function championByTokenId(tokenId: bigint | number | undefined): ChampionMeta | undefined {
  if (tokenId === undefined) return undefined;
  const t = BigInt(tokenId);
  return CHAMPIONS.find((c) => c.tokenId === t);
}

/** Returns a display name for any Apprentice — Champion's hand-tuned name if
 *  registered, else `Apprentice #N`. */
export function nameOf(tokenId: bigint | number | undefined, fallback?: string): string {
  if (tokenId === undefined) return fallback ?? "—";
  const champ = championByTokenId(tokenId);
  if (champ) return champ.name;
  return fallback ?? `Apprentice #${tokenId}`;
}
