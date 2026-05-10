/**
 * Types for the Scrying Duel agent runner.
 */

export type Direction = "LONG" | "SHORT";

export interface DuelCall {
  direction: Direction;
  publicTell: string;     // max 80 words; the audit trail
  confidence: number;     // 0..1
}

export interface TEEAttestedCall {
  call: DuelCall;
  attestation: {
    chatId: string;
    model: string;
    isValid: boolean;
    timestamp: number;
    inputHash: string;    // keccak256(prompt)
    outputHash: string;   // keccak256(rawResponse)
  };
}

export interface ApprenticeSoul {
  tokenId: bigint;
  archetype: "Bold" | "Patient" | "Sharp" | "Stoic";
  name: string;
  trainer: string;
  // Tier 2-real: encrypted soul lives on 0G Storage at this merkle root.
  // The symmetric key is derived from SOUL_KEY_SEED + tokenId via HKDF at
  // duel time (see soul-encryption.ts). No key material in this struct.
  sealedSoulRoot: string;
}

export interface MarketContext {
  asset: string;          // e.g. "BTC/USD"
  pythFeedId: string;     // bytes32 hex
  priceNow: number;       // float, normalized
  priceWindowSeconds: number;
  recentVolatility?: string; // optional verbal description
  timeOfDay?: string;     // optional verbal description
}

export interface DuelTask {
  duelId: bigint;
  challenger: ApprenticeSoul;
  defender: ApprenticeSoul;
  market: MarketContext;
  windowSeconds: number;
}
