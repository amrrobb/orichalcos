/**
 * Scrying Duel runner — orchestrates a single duel end-to-end.
 *
 * Lifecycle:
 *   1. ScryingDuel.challenge() opens a duel (caller pays stake)
 *   2. For each side: TEE inference → upload publicTell to 0G Storage →
 *      commitDirection() with tellHash + attestationHash
 *   3. Wait for the settle window (block.timestamp + windowSeconds)
 *   4. ScryingDuel.settle() — anyone can call; reads Pyth, dispatches to Codex
 *
 * SKELETON — does not run end-to-end yet. Day 4 in HANDOFF.md is the integration
 * day where this is wired to live testnet contracts.
 */

import { ethers } from "ethers";
import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { runApprenticeInference } from "./tee-inference.js";
import type { DuelTask, TEEAttestedCall } from "./types.js";

const SCRYING_DUEL_ABI = [
  "function commitDirection(uint256 duelId, uint256 tokenId, uint8 direction, bytes32 tellHash, bytes32 attestationHash) external",
  "function settle(uint256 duelId) external",
  "function getDuel(uint256 duelId) external view returns (tuple(uint256 challengerTokenId,uint256 defenderTokenId,bytes32 priceFeedId,int64 priceAtCommit,uint256 commitTimestamp,uint256 settleTimestamp,uint64 windowSeconds,uint8 challengerCall,uint8 defenderCall,bytes32 challengerTellHash,bytes32 defenderTellHash,bytes32 challengerAttestationHash,bytes32 defenderAttestationHash,uint256 stake,uint8 status,bool challengerCommitted,bool defenderCommitted))",
];

export interface DuelRunnerCtx {
  signer: ethers.Wallet;
  scryingDuelAddress: string;
  computeProvider: string;
  storageIndexer: Indexer;
  storageRpcUrl: string;
}

const DIRECTION_LONG = 0;
const DIRECTION_SHORT = 1;

/**
 * Run a duel end-to-end. Caller is expected to have already issued
 * ScryingDuel.challenge() and stored the duelId in `task.duelId`.
 */
export async function runDuel(ctx: DuelRunnerCtx, task: DuelTask): Promise<{
  challengerResult: TEEAttestedCall;
  defenderResult: TEEAttestedCall;
}> {
  const duelContract = new ethers.Contract(ctx.scryingDuelAddress, SCRYING_DUEL_ABI, ctx.signer);

  // 1. Run TEE inference for both Apprentices (in parallel)
  console.log(`[duel] [${task.duelId}] running TEE inference for both sides...`);
  const [challengerResult, defenderResult] = await Promise.all([
    runApprenticeInference(ctx.computeProvider, task.challenger, task.market, task.duelId, task.windowSeconds),
    runApprenticeInference(ctx.computeProvider, task.defender, task.market, task.duelId, task.windowSeconds),
  ]);

  console.log(`[duel] [${task.duelId}] challenger ${task.challenger.name}: ${challengerResult.call.direction}`);
  console.log(`[duel] [${task.duelId}] defender ${task.defender.name}: ${defenderResult.call.direction}`);

  // 2. Upload publicTells to 0G Storage and capture roots
  const challengerTellRoot = await uploadTell(ctx, {
    duelId: task.duelId.toString(),
    role: "challenger",
    apprentice: task.challenger.name,
    archetype: task.challenger.archetype,
    direction: challengerResult.call.direction,
    publicTell: challengerResult.call.publicTell,
    confidence: challengerResult.call.confidence,
    attestation: challengerResult.attestation,
  });
  const defenderTellRoot = await uploadTell(ctx, {
    duelId: task.duelId.toString(),
    role: "defender",
    apprentice: task.defender.name,
    archetype: task.defender.archetype,
    direction: defenderResult.call.direction,
    publicTell: defenderResult.call.publicTell,
    confidence: defenderResult.call.confidence,
    attestation: defenderResult.attestation,
  });

  // 3. Commit on-chain
  const challengerTellHash = ethers.keccak256(ethers.toUtf8Bytes(challengerTellRoot));
  const defenderTellHash = ethers.keccak256(ethers.toUtf8Bytes(defenderTellRoot));
  const challengerAttHash = ethers.keccak256(ethers.toUtf8Bytes(challengerResult.attestation.chatId));
  const defenderAttHash = ethers.keccak256(ethers.toUtf8Bytes(defenderResult.attestation.chatId));

  const dir = (d: "LONG" | "SHORT") => (d === "LONG" ? DIRECTION_LONG : DIRECTION_SHORT);

  console.log(`[duel] [${task.duelId}] committing challenger...`);
  await (await duelContract.commitDirection(
    task.duelId, task.challenger.tokenId, dir(challengerResult.call.direction),
    challengerTellHash, challengerAttHash
  )).wait();

  console.log(`[duel] [${task.duelId}] committing defender...`);
  await (await duelContract.commitDirection(
    task.duelId, task.defender.tokenId, dir(defenderResult.call.direction),
    defenderTellHash, defenderAttHash
  )).wait();

  // 4. Wait the settle window
  const duelData = await duelContract.getDuel(task.duelId);
  const settleAt = Number(duelData.settleTimestamp);
  const waitMs = Math.max(0, (settleAt - Math.floor(Date.now() / 1000) + 2) * 1000);
  console.log(`[duel] [${task.duelId}] waiting ${waitMs}ms for settle window...`);
  await new Promise((resolve) => setTimeout(resolve, waitMs));

  // 5. Settle
  console.log(`[duel] [${task.duelId}] settling...`);
  await (await duelContract.settle(task.duelId)).wait();
  console.log(`[duel] [${task.duelId}] settled.`);

  return { challengerResult, defenderResult };
}

async function uploadTell(ctx: DuelRunnerCtx, payload: object): Promise<string> {
  const json = JSON.stringify(payload, null, 2);
  const bytes = new TextEncoder().encode(json);
  const memData = new MemData(bytes);

  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);
  const rootHash: string = tree!.rootHash() ?? "";

  // ALWAYS pass (file, rpcUrl, signer) per 0G-CLAUDE.md
  const [, uploadErr] = await ctx.storageIndexer.upload(memData, ctx.storageRpcUrl, ctx.signer);
  if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

  return rootHash;
}
