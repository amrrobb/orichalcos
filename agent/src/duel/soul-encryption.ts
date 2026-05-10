/**
 * Sealed Soul encryption — Tier 2-real per HANDOFF Section 4.
 *
 * Each Apprentice has a system prompt ("soul") that defines its trading
 * personality. We encrypt the soul with AES-256-GCM, upload the ciphertext to
 * 0G Storage, and commit the merkle root on-chain. At duel time, the agent
 * runner downloads the ciphertext, decrypts it locally (the symmetric key
 * lives in the runner's env, NOT in the TEE persistently), and feeds the
 * plaintext into the 0G Compute TEE for inference.
 *
 * Honest scope: the symmetric key is held by the agent runner's environment.
 * Tier-1 ("TEE-only key derivation with re-encryption oracle on transfer") is
 * the v2 roadmap — see HANDOFF Section 4 + README "Honest Scope".
 *
 * No external deps — uses Node's built-in crypto.
 */

import { createHmac, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;        // 256-bit AES key
const NONCE_LEN = 12;      // 96-bit GCM nonce (standard)
const TAG_LEN = 16;        // 128-bit auth tag (standard)
const HKDF_INFO = "orichalcos-apprentice-soul-v1";

/**
 * Derive a per-Apprentice key from the master SOUL_KEY_SEED + tokenId.
 * Uses HKDF-Extract-then-Expand with HMAC-SHA256.
 *
 * In production: replace SOUL_KEY_SEED-driven derivation with a TEE-bound
 * key derivation flow per ERC-7857 Tier-1.
 */
export function deriveApprenticeKey(masterSeedHex: string, tokenId: bigint | number): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(masterSeedHex)) {
    throw new Error("SOUL_KEY_SEED must be 32 bytes (64 hex chars), no 0x prefix");
  }
  const seed = Buffer.from(masterSeedHex, "hex");

  // HKDF-Extract: PRK = HMAC(salt=tokenId, IKM=seed)
  const salt = Buffer.from(`apprentice-${tokenId.toString()}`, "utf8");
  const prk = createHmac("sha256", salt).update(seed).digest();

  // HKDF-Expand: T(1) = HMAC(PRK, info || 0x01) — single block, 32 bytes
  const info = Buffer.from(HKDF_INFO, "utf8");
  const okm = createHmac("sha256", prk).update(Buffer.concat([info, Buffer.from([0x01])])).digest();

  return okm.subarray(0, KEY_LEN);
}

/**
 * Encrypt plaintext soul with AES-256-GCM. Returns a ciphertext blob:
 *   [ NONCE (12) | TAG (16) | CIPHERTEXT ]
 * which is the format we upload to 0G Storage.
 */
export function encryptSoul(plaintext: string, key: Buffer): Buffer {
  if (key.length !== KEY_LEN) throw new Error(`key must be ${KEY_LEN} bytes`);

  const nonce = randomBytes(NONCE_LEN);
  const cipher = createCipheriv(ALGO, key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([nonce, tag, ciphertext]);
}

/**
 * Decrypt the blob format produced by encryptSoul.
 * Throws if the auth tag doesn't verify (tampering or wrong key).
 */
export function decryptSoul(blob: Buffer, key: Buffer): string {
  if (key.length !== KEY_LEN) throw new Error(`key must be ${KEY_LEN} bytes`);
  if (blob.length < NONCE_LEN + TAG_LEN) throw new Error("blob too short");

  const nonce = blob.subarray(0, NONCE_LEN);
  const tag = blob.subarray(NONCE_LEN, NONCE_LEN + TAG_LEN);
  const ciphertext = blob.subarray(NONCE_LEN + TAG_LEN);

  const decipher = createDecipheriv(ALGO, key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
