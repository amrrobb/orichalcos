/**
 * 0G Storage helpers for the Scrying Duel runner.
 *
 * Handles two kinds of payloads:
 *  - Encrypted soul blobs (binary AES-256-GCM ciphertext) — uploaded once at mint
 *  - Public tells (JSON) — uploaded per duel, content-addressed forever
 *
 * Reuses the working pattern from agent/src/storage.ts:
 *   indexer.upload(memData, rpcUrl, signer) returns [tx, error]
 *
 * Per 0G-CLAUDE.md ALWAYS rules:
 *  - close ZgFile in finally (we use MemData here, no handle to close)
 *  - indexer.download() can THROW in addition to returning errors
 */

import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

let indexer: Indexer | null = null;
let rpcUrl: string;
let signer: ethers.Wallet;

export function initDuelStorage(_rpcUrl: string, _signer: ethers.Wallet, indexerUrl: string) {
  rpcUrl = _rpcUrl;
  signer = _signer;
  indexer = new Indexer(indexerUrl);
  console.log(`[duel-storage] Initialized indexer: ${indexerUrl}`);
}

function ensureReady() {
  if (!indexer) throw new Error("Duel storage not initialized — call initDuelStorage first");
}

/**
 * Upload an encrypted soul blob. Returns the merkle root that goes into
 * ApprenticeINFT.sealedSoulRoot.
 */
export async function uploadSealedSoul(blob: Buffer): Promise<string> {
  ensureReady();
  const memData = new MemData(new Uint8Array(blob));
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr) throw new Error(`merkle tree error: ${treeErr}`);
  const root = tree!.rootHash() ?? "";

  console.log(`[duel-storage] uploading sealed soul (${blob.length} bytes), root=${root}`);
  const [, uploadErr] = await indexer!.upload(memData, rpcUrl, signer);
  if (uploadErr) throw new Error(`upload error: ${uploadErr}`);
  return root;
}

/**
 * Download an encrypted soul blob by its merkle root.
 * Wraps indexer.download in try/catch since it can throw OR return error.
 */
export async function downloadSealedSoul(rootHash: string): Promise<Buffer> {
  ensureReady();
  const tmpFile = path.join(os.tmpdir(), `soul-${rootHash.replace(/[^a-fA-F0-9]/g, "").slice(0, 16)}-${Date.now()}.bin`);
  try {
    const err = await indexer!.download(rootHash, tmpFile, true);
    if (err) throw new Error(`download error: ${err}`);
    return fs.readFileSync(tmpFile);
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

/**
 * Upload a public tell (JSON-serializable). Returns the merkle root that
 * gets committed on-chain in ScryingDuel.commitDirection().
 */
export async function uploadPublicTell(payload: object): Promise<string> {
  ensureReady();
  const json = JSON.stringify(payload, null, 2);
  const bytes = new TextEncoder().encode(json);
  const memData = new MemData(bytes);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr) throw new Error(`merkle tree error: ${treeErr}`);
  const root = tree!.rootHash() ?? "";

  console.log(`[duel-storage] uploading public tell (${bytes.length} bytes), root=${root}`);
  const [, uploadErr] = await indexer!.upload(memData, rpcUrl, signer);
  if (uploadErr) throw new Error(`upload error: ${uploadErr}`);
  return root;
}

export async function downloadPublicTell(rootHash: string): Promise<any> {
  ensureReady();
  const tmpFile = path.join(os.tmpdir(), `tell-${rootHash.replace(/[^a-fA-F0-9]/g, "").slice(0, 16)}-${Date.now()}.json`);
  try {
    const err = await indexer!.download(rootHash, tmpFile, true);
    if (err) throw new Error(`download error: ${err}`);
    return JSON.parse(fs.readFileSync(tmpFile, "utf-8"));
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}
