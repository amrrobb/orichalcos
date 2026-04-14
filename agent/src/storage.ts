import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { AttestationData } from "./types.js";

let indexer: Indexer | null = null;
let rpcUrl: string;
let signer: ethers.Wallet;

export function initStorage(
  _rpcUrl: string,
  _signer: ethers.Wallet,
  indexerUrl: string
) {
  rpcUrl = _rpcUrl;
  signer = _signer;
  indexer = new Indexer(indexerUrl);
  console.log(`[storage] Initialized with indexer: ${indexerUrl}`);
}

export async function storeAttestation(
  attestation: AttestationData
): Promise<string> {
  if (!indexer) throw new Error("Storage not initialized");

  const json = JSON.stringify(attestation, null, 2);
  const bytes = new TextEncoder().encode(json);
  const memData = new MemData(bytes);

  // Compute Merkle root BEFORE upload
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);
  const rootHash: string = tree!.rootHash() ?? "";

  console.log(`[storage] Uploading attestation (${bytes.length} bytes), root: ${rootHash}`);

  // Upload
  const [tx, uploadErr] = await indexer.upload(memData, rpcUrl, signer);
  if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

  console.log(`[storage] Upload complete. Root hash: ${rootHash}`);
  return rootHash;
}

export async function retrieveAttestation(
  rootHash: string
): Promise<AttestationData> {
  if (!indexer) throw new Error("Storage not initialized");

  const tmpDir = os.tmpdir();
  const outputPath = path.join(tmpDir, `attestation-${rootHash.slice(0, 10)}.json`);

  const err = await indexer.download(rootHash, outputPath, true);
  if (err) throw new Error(`Download error: ${err}`);

  const content = fs.readFileSync(outputPath, "utf-8");
  fs.unlinkSync(outputPath); // Clean up

  return JSON.parse(content) as AttestationData;
}
