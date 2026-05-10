/**
 * Mint the four Type Champions: Agni, Tirta, Bayu, Pertiwi.
 *
 * For each Champion:
 *   1. Read hand-tuned soul JSON from agent/src/duel/champions/
 *   2. Pre-derive a per-Apprentice key from SOUL_KEY_SEED + tokenId
 *      (we don't know the tokenId yet — solve by minting first with a
 *      placeholder root, then re-encrypting + uploading + ... no, simpler:
 *      mint sequentially. The next-tokenId is predictable: read nextTokenId()
 *      before each mint.)
 *   3. Encrypt the soulPrompt with the per-Apprentice key
 *   4. Upload encrypted blob to 0G Storage → get merkle root
 *   5. Call ApprenticeINFT.mint(deployer, type, sealedSoulRoot, metaHash)
 *   6. Call Codex.registerChampion(type, tokenId)
 *
 * Idempotent: if a Champion is already registered for a given Type, skips.
 *
 * Run: cd agent && node_modules/.bin/tsx src/duel/mint-champions.ts
 */

import { ethers } from "ethers";
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "node:url";

import { deriveApprenticeKey, encryptSoul } from "./soul-encryption.js";
import { initDuelStorage, uploadSealedSoul } from "./storage.js";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env") });

const {
  PRIVATE_KEY,
  RPC_URL,
  STORAGE_INDEXER_URL,
  APPRENTICE_INFT_V2,
  CODEX_V2,
  SOUL_KEY_SEED,
} = process.env;

if (!PRIVATE_KEY || !RPC_URL || !STORAGE_INDEXER_URL || !APPRENTICE_INFT_V2 || !CODEX_V2 || !SOUL_KEY_SEED) {
  throw new Error("Missing required env vars. Check agent/.env.");
}

const APPRENTICE_INFT_ABI = [
  "function nextTokenId() view returns (uint256)",
  "function mint(address trainer, uint8 apprenticeType, bytes32 sealedSoulRoot, bytes32 metadataHash) returns (uint256)",
  "function getData(uint256 tokenId) view returns (tuple(uint8,uint8,uint16,uint32,uint32,bytes32,bytes32,address,uint256,bool))",
];

const CODEX_ABI = [
  "function championOf(uint8) view returns (uint256)",
  "function registerChampion(uint8 apprenticeType, uint256 tokenId)",
];

// ApprenticeType enum order in the contract: Bold=0, Patient=1, Sharp=2, Stoic=3
const TYPE_ENUM: Record<string, number> = { Bold: 0, Patient: 1, Sharp: 2, Stoic: 3 };

interface ChampionJson {
  name: string;
  type: keyof typeof TYPE_ENUM;
  soulPrompt: string;
  version: number;
}

const CHAMPION_FILES = ["agni.json", "tirta.json", "bayu.json", "pertiwi.json"];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL!);
  const signer = new ethers.Wallet(PRIVATE_KEY!.startsWith("0x") ? PRIVATE_KEY! : `0x${PRIVATE_KEY!}`, provider);
  console.log(`[mint-champions] signer: ${signer.address}`);

  initDuelStorage(RPC_URL!, signer, STORAGE_INDEXER_URL!);

  const inft = new ethers.Contract(APPRENTICE_INFT_V2!, APPRENTICE_INFT_ABI, signer);
  const codex = new ethers.Contract(CODEX_V2!, CODEX_ABI, signer);

  // Read current state
  const nextId: bigint = await inft.nextTokenId();
  console.log(`[mint-champions] nextTokenId starts at: ${nextId}`);

  // If we're at tokenId 0, mint a genesis burner first (Codex reserves tokenId 0)
  if (nextId === 0n) {
    console.log("[mint-champions] minting genesis burner at tokenId 0...");
    // Burner is Stoic type, dummy root. metadataHash also dummy.
    const burnerSoulRoot = ethers.keccak256(ethers.toUtf8Bytes("genesis-burner"));
    const tx = await inft.mint(signer.address, TYPE_ENUM.Stoic, burnerSoulRoot, ethers.ZeroHash);
    await tx.wait();
    console.log(`[mint-champions]   burner minted, tx=${tx.hash}`);
  }

  const championsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "champions");
  const minted: Array<{ name: string; type: string; tokenId: string; sealedSoulRoot: string; symmetricKey: string }> = [];

  for (const fileName of CHAMPION_FILES) {
    const champ: ChampionJson = JSON.parse(fs.readFileSync(path.join(championsDir, fileName), "utf-8"));
    const typeEnum = TYPE_ENUM[champ.type];

    console.log(`\n[mint-champions] === ${champ.name} (${champ.type}, enum=${typeEnum}) ===`);

    // Skip if already registered
    const existing: bigint = await codex.championOf(typeEnum);
    if (existing !== 0n) {
      console.log(`[mint-champions]   already registered as tokenId ${existing}, skipping`);
      continue;
    }

    // Predict tokenId (next mint), derive key, encrypt soul, upload, mint, register
    const predictedTokenId: bigint = await inft.nextTokenId();
    console.log(`[mint-champions]   will mint at tokenId ${predictedTokenId}`);

    const key = deriveApprenticeKey(SOUL_KEY_SEED!, predictedTokenId);
    const blob = encryptSoul(champ.soulPrompt, key);
    console.log(`[mint-champions]   encrypted soul: ${blob.length} bytes`);

    const sealedSoulRoot = await uploadSealedSoul(blob);
    console.log(`[mint-champions]   sealed soul root: ${sealedSoulRoot}`);

    // metadataHash = keccak256(name + type + sealedSoulRoot)  — informational
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(`${champ.name}|${champ.type}|${sealedSoulRoot}`));

    console.log(`[mint-champions]   minting INFT...`);
    const mintTx = await inft.mint(signer.address, typeEnum, sealedSoulRoot, metadataHash);
    const receipt = await mintTx.wait();
    console.log(`[mint-champions]   minted, tx=${mintTx.hash}, gas=${receipt!.gasUsed}`);

    // Confirm tokenId. We can re-read nextTokenId — predictedTokenId should now equal nextTokenId-1.
    const actualNext: bigint = await inft.nextTokenId();
    const actualTokenId = actualNext - 1n;
    if (actualTokenId !== predictedTokenId) {
      throw new Error(`tokenId mismatch: predicted=${predictedTokenId} actual=${actualTokenId}. Aborting.`);
    }

    console.log(`[mint-champions]   registering Champion in Codex...`);
    const regTx = await codex.registerChampion(typeEnum, actualTokenId);
    await regTx.wait();
    console.log(`[mint-champions]   registered, tx=${regTx.hash}`);

    minted.push({
      name: champ.name,
      type: champ.type,
      tokenId: actualTokenId.toString(),
      sealedSoulRoot,
      symmetricKey: key.toString("hex"),
    });
  }

  console.log("\n[mint-champions] === Summary ===");
  console.table(minted.map((m) => ({ name: m.name, type: m.type, tokenId: m.tokenId, sealedSoulRoot: m.sealedSoulRoot.slice(0, 16) + "..." })));

  // Write the result for downstream scripts (duel runner, frontend)
  const outPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/champions.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        deployedAt: new Date().toISOString(),
        contracts: { ApprenticeINFT: APPRENTICE_INFT_V2, Codex: CODEX_V2 },
        champions: minted,
      },
      null,
      2
    )
  );
  console.log(`[mint-champions] saved roster to ${outPath}`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
