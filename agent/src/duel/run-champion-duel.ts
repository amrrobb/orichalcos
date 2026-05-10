/**
 * Autonomous Champion-vs-Champion duel runner.
 *
 * Picks two Champions from data/champions.json, runs a full Scrying Duel:
 *   1. Set MockPyth BTC/USD price (seed value)
 *   2. challenge() — challenger=Champion[i], defender=Champion[j]
 *   3. Run TEE inference for BOTH apprentices in parallel:
 *      a. Download encrypted soul from 0G Storage
 *      b. Decrypt with derived key
 *      c. POST to 0G Compute provider (Qwen 2.5 7B in TDX)
 *      d. processResponse → verify TEE attestation
 *   4. Upload BOTH public tells to 0G Storage
 *   5. commitDirection() for each
 *   6. Wait the settle window (real wall clock)
 *   7. Move MockPyth price ($60k → $60.5k by default)
 *   8. settle() → Codex updates
 *   9. Print verification summary
 *
 * Runs ONE duel per invocation. For continuous mode, wrap in a shell loop.
 *
 * Run: cd agent && node_modules/.bin/tsx src/duel/run-champion-duel.ts
 */

import { ethers } from "ethers";
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "node:url";

import { initDuelStorage, uploadPublicTell } from "./storage.js";
import { initDuelCompute, acknowledgeProvider, runApprenticeInference } from "./tee-inference.js";
import type { ApprenticeSoul, MarketContext } from "./types.js";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env") });

const {
  PRIVATE_KEY,
  RPC_URL,
  STORAGE_INDEXER_URL,
  COMPUTE_PROVIDER_ADDRESS,
  APPRENTICE_INFT_V2,
  CODEX_V2,
  SCRYING_DUEL_V2,
  MOCK_PYTH_V2,
  SOUL_KEY_SEED,
} = process.env;

for (const [k, v] of Object.entries({
  PRIVATE_KEY, RPC_URL, STORAGE_INDEXER_URL, COMPUTE_PROVIDER_ADDRESS,
  APPRENTICE_INFT_V2, CODEX_V2, SCRYING_DUEL_V2, MOCK_PYTH_V2, SOUL_KEY_SEED,
})) {
  if (!v) throw new Error(`Missing env var: ${k}`);
}

const SCRYING_DUEL_ABI = [
  "function challenge(uint256 challengerTokenId, uint256 defenderTokenId, bytes32 priceFeedId, uint64 windowSeconds) payable returns (uint256 duelId)",
  "function commitDirection(uint256 duelId, uint256 tokenId, uint8 direction, bytes32 tellHash, bytes32 attestationHash)",
  "function settle(uint256 duelId)",
  "function nextDuelId() view returns (uint256)",
  "function getDuel(uint256 duelId) view returns (tuple(uint256 challengerTokenId, uint256 defenderTokenId, bytes32 priceFeedId, int64 priceAtCommit, uint256 commitTimestamp, uint256 settleTimestamp, uint64 windowSeconds, uint8 challengerCall, uint8 defenderCall, bytes32 challengerTellHash, bytes32 defenderTellHash, bytes32 challengerAttestationHash, bytes32 defenderAttestationHash, uint256 stake, uint8 status, bool challengerCommitted, bool defenderCommitted))",
  "event DuelChallenged(uint256 indexed duelId, uint256 indexed challengerTokenId, uint256 indexed defenderTokenId, bytes32 priceFeedId, uint64 windowSeconds, uint256 stake)",
];

const APPRENTICE_INFT_ABI = [
  "function getData(uint256 tokenId) view returns (tuple(uint8 apprenticeType, uint8 currentTitle, uint16 elo, uint32 wins, uint32 losses, bytes32 sealedSoulRoot, bytes32 metadataHash, address mintedBy, uint256 mintedAt, bool championBeaten))",
];

const MOCK_PYTH_ABI = [
  "function setPrice(bytes32 id, int64 price, uint64 conf, int32 expo)",
  "function getPriceUnsafe(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime))",
];

const BTC_USD_FEED = "0x0000000000000000000000000000000000000000000000000000000000000001";
const WINDOW_SECONDS = 60n;
const STAKE_WEI = ethers.parseEther("0.001");

const DIRECTION_LONG = 0;
const DIRECTION_SHORT = 1;

interface ChampionRoster {
  champions: Array<{
    name: string;
    type: "Bold" | "Patient" | "Sharp" | "Stoic";
    tokenId: string;
    sealedSoulRoot: string;
  }>;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL!);
  const signer = new ethers.Wallet(
    PRIVATE_KEY!.startsWith("0x") ? PRIVATE_KEY! : `0x${PRIVATE_KEY!}`,
    provider
  );
  console.log(`[duel] signer: ${signer.address}`);

  // Load Champion roster
  const rosterPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/champions.json");
  const roster: ChampionRoster = JSON.parse(fs.readFileSync(rosterPath, "utf-8"));
  if (roster.champions.length < 2) throw new Error("need at least 2 Champions in roster");

  // Pick the two Champions for this duel
  const challengerArg = process.argv[2] ?? "Agni";
  const defenderArg = process.argv[3] ?? "Tirta";
  const champ = (name: string) => {
    const c = roster.champions.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (!c) throw new Error(`Champion not in roster: ${name}`);
    return c;
  };
  const challenger = champ(challengerArg);
  const defender = champ(defenderArg);

  console.log(`[duel] === ${challenger.name} (${challenger.type}, token ${challenger.tokenId}) vs ${defender.name} (${defender.type}, token ${defender.tokenId}) ===`);

  // Init services
  initDuelStorage(RPC_URL!, signer, STORAGE_INDEXER_URL!);
  await initDuelCompute(signer, COMPUTE_PROVIDER_ADDRESS!);
  await acknowledgeProvider(COMPUTE_PROVIDER_ADDRESS!);

  // Contracts
  const duelContract = new ethers.Contract(SCRYING_DUEL_V2!, SCRYING_DUEL_ABI, signer);
  const inft = new ethers.Contract(APPRENTICE_INFT_V2!, APPRENTICE_INFT_ABI, provider);
  const pyth = new ethers.Contract(MOCK_PYTH_V2!, MOCK_PYTH_ABI, signer);

  // Capture pre-duel state for verification later
  const preChallenger = await inft.getData(BigInt(challenger.tokenId));
  const preDefender = await inft.getData(BigInt(defender.tokenId));
  console.log(`[duel] pre: challenger ELO=${preChallenger.elo} W/L=${preChallenger.wins}/${preChallenger.losses}`);
  console.log(`[duel] pre: defender   ELO=${preDefender.elo} W/L=${preDefender.wins}/${preDefender.losses}`);

  // 1. Seed Pyth price (initial). We'll re-seed right before commits since
  //    TEE inference + storage uploads can take >60s and Pyth reads stale prices.
  console.log(`[duel] step 1/9: seeding MockPyth BTC/USD = $60,000`);
  const seedTx = await pyth.setPrice(BTC_USD_FEED, 60000_00000000n, 1000n, -8);
  await seedTx.wait();

  // 2. Challenge
  console.log(`[duel] step 2/9: challenge()`);
  const challengeTx = await duelContract.challenge(
    BigInt(challenger.tokenId),
    BigInt(defender.tokenId),
    BTC_USD_FEED,
    WINDOW_SECONDS,
    { value: STAKE_WEI }
  );
  const challengeReceipt = await challengeTx.wait();
  // Extract duelId from DuelChallenged event
  const challengedLog = challengeReceipt!.logs.find((l: any) => {
    try { return duelContract.interface.parseLog(l)?.name === "DuelChallenged"; }
    catch { return false; }
  });
  if (!challengedLog) throw new Error("DuelChallenged event not found");
  const duelId: bigint = duelContract.interface.parseLog(challengedLog as any)!.args.duelId;
  console.log(`[duel]   duelId = ${duelId}, tx = ${challengeTx.hash}`);

  // 3. Build market context + run TEE inference for both sides in parallel
  const market: MarketContext = {
    asset: "BTC/USD",
    pythFeedId: BTC_USD_FEED,
    priceNow: 60000.0,
    priceWindowSeconds: 60,
    recentVolatility: "moderate; small chop in past 5 minutes",
    timeOfDay: "Asian session opening",
  };

  const challengerSoul: ApprenticeSoul = {
    tokenId: BigInt(challenger.tokenId),
    archetype: challenger.type,
    name: challenger.name,
    trainer: signer.address,
    sealedSoulRoot: challenger.sealedSoulRoot,
  };
  const defenderSoul: ApprenticeSoul = {
    tokenId: BigInt(defender.tokenId),
    archetype: defender.type,
    name: defender.name,
    trainer: signer.address,
    sealedSoulRoot: defender.sealedSoulRoot,
  };

  console.log(`[duel] step 3/9: TEE inference for both Apprentices (parallel)`);
  const [challengerResult, defenderResult] = await Promise.all([
    runApprenticeInference(COMPUTE_PROVIDER_ADDRESS!, challengerSoul, market, duelId, Number(WINDOW_SECONDS), SOUL_KEY_SEED!),
    runApprenticeInference(COMPUTE_PROVIDER_ADDRESS!, defenderSoul, market, duelId, Number(WINDOW_SECONDS), SOUL_KEY_SEED!),
  ]);

  console.log(`[duel]   challenger ${challenger.name}: ${challengerResult.call.direction}`);
  console.log(`[duel]     tell: "${challengerResult.call.publicTell.slice(0, 120)}..."`);
  console.log(`[duel]     TEE valid: ${challengerResult.attestation.isValid}`);
  console.log(`[duel]   defender ${defender.name}: ${defenderResult.call.direction}`);
  console.log(`[duel]     tell: "${defenderResult.call.publicTell.slice(0, 120)}..."`);
  console.log(`[duel]     TEE valid: ${defenderResult.attestation.isValid}`);

  // 4. Upload public tells to 0G Storage
  console.log(`[duel] step 4/9: uploading public tells to 0G Storage`);
  const challengerTellPayload = {
    version: 1,
    duelId: duelId.toString(),
    tokenId: challenger.tokenId,
    apprentice: challenger.name,
    archetype: challenger.type,
    asset: market.asset,
    direction: challengerResult.call.direction,
    publicTell: challengerResult.call.publicTell,
    confidence: challengerResult.call.confidence,
    teeAttestation: {
      chatId: challengerResult.attestation.chatId,
      model: challengerResult.attestation.model,
      isValid: challengerResult.attestation.isValid,
      timestamp: challengerResult.attestation.timestamp,
      inputHash: challengerResult.attestation.inputHash,
      outputHash: challengerResult.attestation.outputHash,
    },
  };
  const defenderTellPayload = {
    ...challengerTellPayload,
    tokenId: defender.tokenId,
    apprentice: defender.name,
    archetype: defender.type,
    direction: defenderResult.call.direction,
    publicTell: defenderResult.call.publicTell,
    confidence: defenderResult.call.confidence,
    teeAttestation: {
      chatId: defenderResult.attestation.chatId,
      model: defenderResult.attestation.model,
      isValid: defenderResult.attestation.isValid,
      timestamp: defenderResult.attestation.timestamp,
      inputHash: defenderResult.attestation.inputHash,
      outputHash: defenderResult.attestation.outputHash,
    },
  };
  // Sequential — both uploads sign txs from the same wallet, same nonce-space.
  // Parallel triggers REPLACEMENT_UNDERPRICED on the second tx.
  const challengerTellRoot = await uploadPublicTell(challengerTellPayload);
  const defenderTellRoot = await uploadPublicTell(defenderTellPayload);
  console.log(`[duel]   challenger tell root: ${challengerTellRoot}`);
  console.log(`[duel]   defender   tell root: ${defenderTellRoot}`);

  // The on-chain commit only stores 32 bytes — use the raw merkle roots
  // (already 0x-prefixed 32-byte hashes from MemData). Attestation hash is
  // a keccak of the chatId so judges can verify the same chatId was used.
  const challengerAttHash = ethers.keccak256(ethers.toUtf8Bytes(challengerResult.attestation.chatId));
  const defenderAttHash = ethers.keccak256(ethers.toUtf8Bytes(defenderResult.attestation.chatId));
  const directionToInt = (d: "LONG" | "SHORT") => (d === "LONG" ? DIRECTION_LONG : DIRECTION_SHORT);

  // 5. Re-seed price right before commits (Pyth read happens at the 2nd commit
  //    when both flags become true; price publishTime must be < 60s old).
  console.log(`[duel] step 5/9: re-seeding MockPyth BTC/USD = $60,000 (fresh publishTime)`);
  const reseedTx = await pyth.setPrice(BTC_USD_FEED, 60000_00000000n, 1000n, -8);
  await reseedTx.wait();

  // commitDirection() x 2
  console.log(`[duel]   commitDirection() x 2`);
  const commit1 = await duelContract.commitDirection(
    duelId,
    BigInt(challenger.tokenId),
    directionToInt(challengerResult.call.direction),
    challengerTellRoot,
    challengerAttHash
  );
  await commit1.wait();
  console.log(`[duel]   challenger committed, tx=${commit1.hash}`);

  const commit2 = await duelContract.commitDirection(
    duelId,
    BigInt(defender.tokenId),
    directionToInt(defenderResult.call.direction),
    defenderTellRoot,
    defenderAttHash
  );
  await commit2.wait();
  console.log(`[duel]   defender   committed, tx=${commit2.hash}`);

  // 6. Wait for settle window
  const duelData = await duelContract.getDuel(duelId);
  const settleAt = Number(duelData.settleTimestamp);
  const nowSec = Math.floor(Date.now() / 1000);
  const waitSec = Math.max(0, settleAt - nowSec + 3);
  console.log(`[duel] step 6/9: waiting ${waitSec}s for settle window (settleAt=${settleAt}, now=${nowSec})`);
  await sleep(waitSec * 1000);

  // 7. Move price RANDOMLY ±0.5%. Critical for the demo: the agents must win
  //    on archetype skill alone. Hardcoded UP-moves would let LONG-biased
  //    Apprentices (Bold) sweep the ladder, undermining the verifiable-signal
  //    thesis. v2 should pull a real Pyth feed; this random walk is the demo
  //    substitute.
  const SEED_PRICE_E8 = 60000_00000000n;
  const moveBps = Math.floor(Math.random() * 100) - 50;        // -50..+49 bps (-0.5%..+0.49%)
  const moveAbs = (SEED_PRICE_E8 * BigInt(moveBps)) / 10000n;
  const finalPrice = SEED_PRICE_E8 + moveAbs;
  const finalPriceUsd = (Number(finalPrice) / 1e8).toFixed(2);
  console.log(`[duel] step 7/9: moving MockPyth BTC/USD = $${finalPriceUsd} (Δ=${moveBps}bps)`);
  const priceTx = await pyth.setPrice(BTC_USD_FEED, finalPrice, 1000n, -8);
  await priceTx.wait();

  // 8. Settle
  console.log(`[duel] step 8/9: settle()`);
  const settleTx = await duelContract.settle(duelId);
  const settleReceipt = await settleTx.wait();
  console.log(`[duel]   settled, tx=${settleTx.hash}`);

  // 9. Verify state
  console.log(`[duel] step 9/9: verifying final state`);
  const finalDuel = await duelContract.getDuel(duelId);
  const postChallenger = await inft.getData(BigInt(challenger.tokenId));
  const postDefender = await inft.getData(BigInt(defender.tokenId));

  console.log(`[duel] === RESULTS ===`);
  console.log(`[duel] duel status: ${["Open", "Committed", "Settled", "Cancelled"][Number(finalDuel.status)]}`);
  console.log(`[duel] price moved: ${finalDuel.priceAtCommit} -> ${finalPrice}`);
  console.log(`[duel] challenger ${challenger.name}:  ELO ${preChallenger.elo} -> ${postChallenger.elo}  W/L ${preChallenger.wins}/${preChallenger.losses} -> ${postChallenger.wins}/${postChallenger.losses}`);
  console.log(`[duel] defender   ${defender.name}:    ELO ${preDefender.elo} -> ${postDefender.elo}  W/L ${preDefender.wins}/${preDefender.losses} -> ${postDefender.wins}/${postDefender.losses}`);

  // Save the duel record for the dashboard
  const recordsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/duels");
  fs.mkdirSync(recordsDir, { recursive: true });
  const record = {
    duelId: duelId.toString(),
    challenger: {
      name: challenger.name, type: challenger.type, tokenId: challenger.tokenId,
      direction: challengerResult.call.direction,
      publicTell: challengerResult.call.publicTell,
      tellRoot: challengerTellRoot,
      teeChatId: challengerResult.attestation.chatId,
      teeValid: challengerResult.attestation.isValid,
      eloBefore: Number(preChallenger.elo),
      eloAfter: Number(postChallenger.elo),
    },
    defender: {
      name: defender.name, type: defender.type, tokenId: defender.tokenId,
      direction: defenderResult.call.direction,
      publicTell: defenderResult.call.publicTell,
      tellRoot: defenderTellRoot,
      teeChatId: defenderResult.attestation.chatId,
      teeValid: defenderResult.attestation.isValid,
      eloBefore: Number(preDefender.elo),
      eloAfter: Number(postDefender.elo),
    },
    txs: {
      seedPrice: seedTx.hash,
      challenge: challengeTx.hash,
      reseedPrice: reseedTx.hash,
      commitChallenger: commit1.hash,
      commitDefender: commit2.hash,
      settlePrice: priceTx.hash,
      settle: settleTx.hash,
    },
    priceMove: {
      seedUsd: 60000.0,
      finalUsd: Number(finalPriceUsd),
      bps: moveBps,
    },
    timestamp: new Date().toISOString(),
  };
  const recordPath = path.join(recordsDir, `duel-${duelId}.json`);
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2));
  console.log(`[duel] record saved to ${recordPath}`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
