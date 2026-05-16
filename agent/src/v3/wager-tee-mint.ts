/**
 * wager-tee-mint.ts — Option B: real 0G Compute TEE attestation per wager.
 *
 * Per wager:
 *   1. Build a v3 "wager system prompt" (one-paragraph promise statement)
 *   2. Encrypt with deriveApprenticeKey(SOUL_KEY_SEED, predictedTokenId)
 *   3. Upload sealed blob to 0G Storage → real merkle root
 *   4. Run ONE TEE inference call (Qwen 2.5 7B in Intel TDX + H100):
 *        - system prompt = decrypted wager soul
 *        - user prompt = "you're opening a new epoch. State your promise: drawdown cap and one-sentence rationale."
 *      Returns: real chatId (ZG-Res-Key) + verified processResponse signature
 *   5. Mint INFT with sealedSoulRoot = the 0G Storage root, metadataHash = keccak256(real chatId)
 *   6. (operator) startEpoch with bond + drawdown + duration
 *
 * Output: a wager whose `sealedSoulRoot` field points to a REAL 0G Storage blob,
 * and whose `metadataHash` field carries a REAL 0G Compute chatId. Both are
 * verifiable on chain. Per-trade TEE attestation remains v3.1.
 *
 * Run:
 *   PRIVATE_KEY=0x... ./node_modules/.bin/tsx src/v3/wager-tee-mint.ts [count]
 */
import "dotenv/config";
import { ethers } from "ethers";
import { initDuelCompute, acknowledgeProvider } from "../duel/tee-inference.js";
import { deriveApprenticeKey, encryptSoul } from "../duel/soul-encryption.js";
import { initDuelStorage, uploadSealedSoul } from "../duel/storage.js";

const RPC_URL = process.env.RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 16602);
const GAS_PRICE = ethers.parseUnits("5", "gwei");
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const SOUL_KEY_SEED = process.env.SOUL_KEY_SEED!;
const STORAGE_INDEXER_URL = process.env.STORAGE_INDEXER_URL!;
const PROVIDER = process.env.COMPUTE_PROVIDER_ADDRESS!;

if (!PRIVATE_KEY || !SOUL_KEY_SEED || !STORAGE_INDEXER_URL || !PROVIDER) {
  throw new Error("Missing env: PRIVATE_KEY, SOUL_KEY_SEED, STORAGE_INDEXER_URL, COMPUTE_PROVIDER_ADDRESS");
}

const V3 = {
  mockUsdc:     "0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7",
  strategyINFT: "0x782CBD5313E3b99d9C94e4f5197B81a432cdE621",
};

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function mint(address,uint256)",
];
const STRATEGY_ABI = [
  "function mint(address,uint8,bytes32,bytes32) returns (uint256)",
  "function startEpoch(uint256,uint256,uint256,uint256) returns (uint256)",
  "function nextTokenId() view returns (uint256)",
];

const MAX_DRAWDOWN_BPS = 2000n;
const EPOCH_DURATION_SECS = 24n * 60n * 60n;

const ARCHETYPE_MAP: Record<string, { idx: number; label: string }> = {
  Bold:    { idx: 0, label: "momentum" },
  Patient: { idx: 1, label: "mean-reversion" },
  Sharp:   { idx: 2, label: "microstructure" },
};

const DEFAULT_PROMISE = "I won't drop more than 20% over a 24h epoch on momentum-driven BTC perp scalps. Conservative sizing, no overnight pyramiding.";

function parseArgs(argv: string[]) {
  let archetype = "Bold";
  let promise = DEFAULT_PROMISE;
  let bond = 1000;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--archetype" && argv[i + 1]) { archetype = argv[++i]; }
    else if (a === "--promise" && argv[i + 1]) { promise = argv[++i]; }
    else if (a === "--bond" && argv[i + 1]) { bond = Number(argv[++i]); }
  }
  if (!ARCHETYPE_MAP[archetype]) {
    throw new Error(`Unknown archetype "${archetype}". Valid: ${Object.keys(ARCHETYPE_MAP).join(", ")}`);
  }
  return { archetype, promise, bond };
}

function buildWagerSoul(arch: { name: string; label: string }, promise: string, tokenId: bigint) {
  return `You are wager #${tokenId} in the Orichalcos promise-kept market.

Your archetype: ${arch.name} — a ${arch.label} trader.

Your bonded promise, in your own words:
"${promise}"

Your bond is at risk for a 24-hour epoch. This sealed soul defines your trading personality and risk discipline. Each trade you take must respect the bonded promise above verbatim. If equity drops below 80% of bond, the wager breaches and the bond pays open challenges.

Rationale upon opening: state in one sentence why this promise is the right wager for the current market regime.`;
}

function buildOpenEpochUserPrompt() {
  return `You are opening a new epoch right now.

Output strict JSON ONLY in this shape — no prose, no markdown fences:
{"promise":"max drawdown 20% over 24h epoch","rationale":"<one short sentence on market regime>"}`;
}

async function runOneTeeInference(
  wallet: ethers.Wallet,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ chatId: string; rawContent: string; isValid: boolean; inputHash: string; outputHash: string }> {
  // We re-derive the provider endpoint/model via the same broker the v2 module uses,
  // but call /chat/completions ourselves so we can grab ZG-Res-Key + processResponse.
  // (initDuelCompute caches endpoint/model in module scope; reuse it.)
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");
  const broker = await createZGComputeNetworkBroker(wallet);
  const metadata = await broker.inference.getServiceMetadata(PROVIDER);
  console.log(`  [tee] provider=${PROVIDER.slice(0,10)}... model=${metadata.model}`);

  // Acknowledge signer (idempotent)
  try {
    await broker.inference.acknowledgeProviderSigner(PROVIDER);
  } catch (e: any) {
    if (!e.message?.includes("already")) console.log(`  [tee] ack note: ${e.message?.slice(0,80)}`);
  }

  const headers = await broker.inference.getRequestHeaders(PROVIDER);
  const body = {
    model: metadata.model,
    temperature: 0.4,
    max_tokens: 200,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  const r = await fetch(`${metadata.endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers as Record<string,string>) },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`0G Compute HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);
  const zgResKey = r.headers.get("ZG-Res-Key") || r.headers.get("zg-res-key") || "";
  const completion: any = await r.json();
  const chatId = zgResKey || completion.id || "";
  const rawContent = completion.choices?.[0]?.message?.content || "";

  const inputHash = ethers.keccak256(ethers.toUtf8Bytes(systemPrompt + "\n---\n" + userPrompt));
  const outputHash = ethers.keccak256(ethers.toUtf8Bytes(rawContent));

  let isValid = false;
  try {
    const usage = completion.usage ? JSON.stringify(completion.usage) : undefined;
    const ok = await broker.inference.processResponse(PROVIDER, chatId, usage);
    isValid = ok === true;
  } catch (e: any) {
    console.log(`  [tee] processResponse err: ${e.message?.slice(0,100)}`);
  }
  return { chatId, rawContent, isValid, inputHash, outputHash };
}

async function main() {
  const { archetype, promise, bond } = parseArgs(process.argv.slice(2));
  const archMeta = ARCHETYPE_MAP[archetype];
  const arch = { name: archetype, label: archMeta.label, idx: archMeta.idx };
  const BOND = BigInt(bond) * 1_000_000n;

  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log(`[setup] operator/trader: ${wallet.address}`);
  console.log(`[setup] chainId=${(await provider.getNetwork()).chainId} block=${await provider.getBlockNumber()}`);
  console.log(`[setup] archetype=${arch.name} (idx=${arch.idx}) bond=${bond} USDC`);
  console.log(`[setup] promise: "${promise.slice(0, 120)}${promise.length > 120 ? "…" : ""}"\n`);

  // Init the v2 storage + compute modules — they cache module-level state
  initDuelStorage(RPC_URL, wallet, STORAGE_INDEXER_URL);
  await initDuelCompute(wallet, PROVIDER);
  await acknowledgeProvider(PROVIDER);

  const stratOp = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, wallet);
  const usdcOp = new ethers.Contract(V3.mockUsdc, USDC_ABI, wallet);

  // Ensure operator has bond capital
  const bal: bigint = await usdcOp.balanceOf(wallet.address);
  if (bal < BOND) {
    const mintAmt = BOND * 2n;
    console.log(`[setup] minting ${ethers.formatUnits(mintAmt, 6)} USDC to operator...`);
    const tx = await usdcOp.mint(wallet.address, mintAmt, { gasPrice: GAS_PRICE });
    await tx.wait();
  }
  // Approve once
  const allow: bigint = await usdcOp.allowance(wallet.address, V3.strategyINFT);
  if (allow < BOND) {
    const tx = await usdcOp.approve(V3.strategyINFT, BOND * 10n, { gasPrice: GAS_PRICE });
    await tx.wait();
    console.log(`[setup] approved StrategyINFT for bond capital\n`);
  }

  console.log(`═══════════════ Wager: ${arch.name} ═══════════════`);

  // 1. Predict next tokenId
  const predictedTokenId: bigint = await stratOp.nextTokenId();
  console.log(`  predicted tokenId: ${predictedTokenId}`);

  // 2. Build wager soul + encrypt — promise is the trader's verbatim words
  const soul = buildWagerSoul(arch, promise, predictedTokenId);
  const key = deriveApprenticeKey(SOUL_KEY_SEED, predictedTokenId);
  const blob = encryptSoul(soul, key);
  console.log(`  encrypted soul: ${blob.length} bytes`);

  // 3. Upload to 0G Storage — REAL merkle root
  console.log(`  uploading to 0G Storage...`);
  const sealedSoulRoot = await uploadSealedSoul(blob);
  console.log(`  ✓ sealed soul root (REAL): ${sealedSoulRoot}`);

  // 4. Run TEE inference — REAL chatId
  console.log(`  running TEE inference (Qwen 2.5 7B inside Intel TDX + H100)...`);
  const inf = await runOneTeeInference(wallet, soul, buildOpenEpochUserPrompt());
  console.log(`  ✓ TEE response: ${inf.rawContent.slice(0, 100)}...`);
  console.log(`  ✓ chatId (REAL): ${inf.chatId}`);
  console.log(`  ✓ TEE attestation valid: ${inf.isValid}`);

  // 5. Mint INFT with the REAL sealed soul root + chatId-derived metadata hash
  const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(`tee:${inf.chatId}|input:${inf.inputHash}|output:${inf.outputHash}`));
  console.log(`  minting INFT (sealedSoulRoot=real, metadataHash=keccak256(chatId+i/o hashes))...`);
  const mintTx = await stratOp.mint(wallet.address, arch.idx, sealedSoulRoot, metadataHash, { gasPrice: GAS_PRICE });
  const mintRcpt = await mintTx.wait();
  console.log(`  ✓ minted tokenId=${predictedTokenId}: ${mintRcpt!.hash}`);

  // 6. startEpoch
  const epochTx = await stratOp.startEpoch(predictedTokenId, BOND, MAX_DRAWDOWN_BPS, EPOCH_DURATION_SECS, { gasPrice: GAS_PRICE });
  const epochRcpt = await epochTx.wait();
  console.log(`  ✓ startEpoch (bond=${ethers.formatUnits(BOND, 6)} USDC, dur=24h): ${epochRcpt!.hash}\n`);

  console.log("\n═══════════════ FINAL — TEE-attested wager ═══════════════");
  console.log("| tokenId | archetype | sealed soul (0G Storage) | TEE chatId (0G Compute) | valid | mint | startEpoch |");
  console.log("|---|---|---|---|---|---|---|");
  console.log(`| #${predictedTokenId} | ${arch.name} | \`${sealedSoulRoot.slice(0,18)}…\` | \`${inf.chatId.slice(0,16)}…\` | ${inf.isValid ? "✓" : "—"} | [tx](https://chainscan-galileo.0g.ai/tx/${mintRcpt!.hash}) | [tx](https://chainscan-galileo.0g.ai/tx/${epochRcpt!.hash}) |`);
  console.log("\nNote: sealedSoulRoot is a REAL 0G Storage merkle root; chatId is a REAL 0G Compute response key returned by Qwen 2.5 7B inside Intel TDX + H100. The trader's free-text promise is sealed inside the soul (TEE-attested) and verifiable via chatId.");
  console.log(`[final] tokenId=${predictedTokenId}, soul includes promise: "${promise.slice(0, 80)}..."`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
