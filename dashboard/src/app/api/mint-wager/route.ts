/**
 * POST /api/mint-wager — Path C mint endpoint.
 *
 * Body: {
 *   trader: "0x...",          // EVM address that will own the wager INFT
 *   archetype: "Bold" | "Patient" | "Sharp" | "Stoic",
 *   promise: "free text — the trader's verbatim commitment",
 *   bond: number,             // USDC, whole units, e.g. 1000
 *   drawdownBps: number,      // e.g. 2000 = 20%
 *   epochSecs: number,        // e.g. 86400 = 24h
 * }
 *
 * Server-side flow (mirrors agent/src/v3/wager-tee-mint.ts):
 *   1. Build wager soul (system prompt embeds free-text promise verbatim)
 *   2. Encrypt with HKDF-derived per-token key (SOUL_KEY_SEED + tokenId)
 *   3. Upload to 0G Storage → real merkle root
 *   4. Run ONE TEE inference (Qwen 2.5 7B inside Intel TDX + H100)
 *   5. Mint INFT (operator pays gas, trader is the owner argument)
 *   6. startEpoch from operator (since operator currently runs trade execution)
 *
 * Returns: { tokenId, sealedSoulRoot, chatId, teeValid, mintTx, epochTx }
 *
 * IMPORTANT honest scope: v3 binds EVM identity 1:1 to Hyperliquid identity for
 * execution trust. A wager minted via this endpoint will appear on chain with
 * TEE attestation, but trade execution from a non-operator trader address
 * requires per-strategy HL keys derived inside TEE — that's v3.5. Until then,
 * minted-via-UI wagers exist as TEE-attested commitments without trade flow.
 */
import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import * as crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── env (server-only) ─────────────────────────────────────────────
const RPC_URL = process.env.RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 16602);
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SOUL_KEY_SEED = process.env.SOUL_KEY_SEED;
const STORAGE_INDEXER_URL = process.env.STORAGE_INDEXER_URL;
const PROVIDER = process.env.COMPUTE_PROVIDER_ADDRESS;

// Env-driven so the route works on both testnet (Galileo) and mainnet
// (0G Aristotle, chainId 16661). Fallback to testnet for local dev convenience.
const V3 = {
  mockUsdc:     (process.env.NEXT_PUBLIC_V3_MOCK_USDC     ?? "0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7") as `0x${string}`,
  strategyINFT: (process.env.NEXT_PUBLIC_V3_STRATEGY_INFT ?? "0x782CBD5313E3b99d9C94e4f5197B81a432cdE621") as `0x${string}`,
};

const GAS_PRICE = ethers.parseUnits("5", "gwei");

const STRATEGY_ABI = [
  "function mint(address,uint8,bytes32,bytes32) returns (uint256)",
  "function startEpoch(uint256,uint256,uint256,uint256) returns (uint256)",
  "function nextTokenId() view returns (uint256)",
];
const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function mint(address,uint256)",
];

const ARCHETYPE_MAP: Record<string, { idx: number; label: string }> = {
  Bold:    { idx: 0, label: "momentum" },
  Patient: { idx: 1, label: "mean-reversion" },
  Sharp:   { idx: 2, label: "microstructure" },
  Stoic:   { idx: 3, label: "grid" },
};

// ─── soul encryption (inlined from agent/src/duel/soul-encryption.ts) ─
function deriveKey(masterSeedHex: string, tokenId: bigint): Buffer {
  const seed = masterSeedHex.startsWith("0x") ? masterSeedHex.slice(2) : masterSeedHex;
  if (seed.length !== 64) throw new Error("SOUL_KEY_SEED must be 32 bytes (64 hex chars)");
  const master = Buffer.from(seed, "hex");
  const info = Buffer.from(`orichalcos/wager/${tokenId}`, "utf-8");
  // HKDF-SHA256 (info-only, no salt — matches v2 semantics)
  const prk = crypto.createHmac("sha256", Buffer.alloc(32)).update(master).digest();
  const t1 = crypto.createHmac("sha256", prk).update(Buffer.concat([info, Buffer.from([0x01])])).digest();
  return t1; // 32 bytes
}
function encryptSoul(plaintext: string, key: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12) || tag(16) || ciphertext
  return Buffer.concat([iv, tag, enc]);
}

// ─── 0G Storage upload (inlined) ──────────────────────────────────
let _indexer: Indexer | null = null;
function getIndexer() {
  if (!_indexer) _indexer = new Indexer(STORAGE_INDEXER_URL!);
  return _indexer;
}
async function uploadSealedSoul(blob: Buffer, signer: ethers.Wallet): Promise<string> {
  const memData = new MemData(new Uint8Array(blob));
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr) throw new Error(`merkle tree error: ${treeErr}`);
  const root = tree!.rootHash() ?? "";
  const [, uploadErr] = await getIndexer().upload(memData, RPC_URL, signer);
  if (uploadErr) throw new Error(`upload error: ${uploadErr}`);
  return root;
}

// ─── 0G Compute TEE inference (inlined) ───────────────────────────
async function runTeeInference(
  signer: ethers.Wallet,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ chatId: string; rawContent: string; isValid: boolean; inputHash: string; outputHash: string }> {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");
  const broker = await createZGComputeNetworkBroker(signer);
  const metadata = await broker.inference.getServiceMetadata(PROVIDER!);
  try {
    await broker.inference.acknowledgeProviderSigner(PROVIDER!);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (!msg.includes("already")) console.log(`[mint-wager] ack note: ${msg.slice(0, 80)}`);
  }
  const headers = await broker.inference.getRequestHeaders(PROVIDER!);
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
    headers: { "Content-Type": "application/json", ...(headers as Record<string, string>) },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`0G Compute HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const zgResKey = r.headers.get("ZG-Res-Key") || r.headers.get("zg-res-key") || "";
  const completion: { id?: string; choices?: { message?: { content?: string } }[]; usage?: unknown } = await r.json();
  const chatId = zgResKey || completion.id || "";
  const rawContent = completion.choices?.[0]?.message?.content || "";
  const inputHash = ethers.keccak256(ethers.toUtf8Bytes(systemPrompt + "\n---\n" + userPrompt));
  const outputHash = ethers.keccak256(ethers.toUtf8Bytes(rawContent));
  let isValid = false;
  try {
    const usage = completion.usage ? JSON.stringify(completion.usage) : undefined;
    const ok = await broker.inference.processResponse(PROVIDER!, chatId, usage);
    isValid = ok === true;
  } catch (e: unknown) {
    console.log(`[mint-wager] processResponse err: ${e instanceof Error ? e.message.slice(0, 100) : "unknown"}`);
  }
  return { chatId, rawContent, isValid, inputHash, outputHash };
}

// ─── prompt construction ──────────────────────────────────────────
function buildWagerSoul(arch: { name: string; label: string }, promise: string, tokenId: bigint) {
  return `You are wager #${tokenId} in the Orichalcos promise-kept market.

Your archetype: ${arch.name} — a ${arch.label} trader.

Your bonded promise, in your own words:
"${promise}"

Your bond is at risk for this epoch. This sealed soul defines your trading personality and risk discipline. Each trade you take must respect the bonded promise above verbatim. If equity drops below 80% of bond, the wager breaches and the bond pays open challenges.

Rationale upon opening: state in one sentence why this promise is the right wager for the current market regime.`;
}
function buildOpenEpochPrompt() {
  return `You are opening a new epoch right now.

Output strict JSON ONLY in this shape — no prose, no markdown fences:
{"promise":"<echo the bonded promise in 12 words>","rationale":"<one short sentence on current regime>"}`;
}

// ─── handler ──────────────────────────────────────────────────────
const HEX_ADDR = /^0x[0-9a-fA-F]{40}$/;

export async function POST(req: NextRequest) {
  if (!PRIVATE_KEY || !SOUL_KEY_SEED || !STORAGE_INDEXER_URL || !PROVIDER) {
    return Response.json({ error: "server env missing PRIVATE_KEY / SOUL_KEY_SEED / STORAGE_INDEXER_URL / COMPUTE_PROVIDER_ADDRESS" }, { status: 500 });
  }

  let body: { trader?: string; archetype?: string; promise?: string; bond?: number; drawdownBps?: number; epochSecs?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { trader, archetype, promise, bond, drawdownBps, epochSecs } = body;

  if (!trader || !HEX_ADDR.test(trader)) return Response.json({ error: "invalid trader address" }, { status: 400 });
  if (!archetype || !(archetype in ARCHETYPE_MAP)) return Response.json({ error: "archetype must be Bold|Patient|Sharp|Stoic" }, { status: 400 });
  if (!promise || typeof promise !== "string" || promise.length < 10 || promise.length > 500) return Response.json({ error: "promise must be 10–500 chars" }, { status: 400 });
  if (!bond || bond < 10 || bond > 10000) return Response.json({ error: "bond must be 10–10000 USDC" }, { status: 400 });
  if (!drawdownBps || drawdownBps < 100 || drawdownBps >= 10000) return Response.json({ error: "drawdownBps must be 100–9999" }, { status: 400 });
  if (!epochSecs || epochSecs < 60 || epochSecs > 7 * 24 * 60 * 60) return Response.json({ error: "epochSecs must be 60s–7d" }, { status: 400 });

  const archMeta = ARCHETYPE_MAP[archetype];
  const arch = { name: archetype, label: archMeta.label };
  const BOND = BigInt(bond) * 1_000_000n;

  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const operator = new ethers.Wallet(PRIVATE_KEY, provider);

  const strat = new ethers.Contract(V3.strategyINFT, STRATEGY_ABI, operator);
  const usdc = new ethers.Contract(V3.mockUsdc, USDC_ABI, operator);

  try {
    // Bond capital: operator funds + approves (operator is the bond signer for now)
    const bal: bigint = await usdc.balanceOf(operator.address);
    if (bal < BOND) {
      const tx = await usdc.mint(operator.address, BOND * 2n, { gasPrice: GAS_PRICE });
      await tx.wait();
    }
    const allow: bigint = await usdc.allowance(operator.address, V3.strategyINFT);
    if (allow < BOND) {
      const tx = await usdc.approve(V3.strategyINFT, BOND * 10n, { gasPrice: GAS_PRICE });
      await tx.wait();
    }

    // Pre-mint setup — predict tokenId, build soul, encrypt, upload, run TEE
    const predictedTokenId: bigint = await strat.nextTokenId();
    const soul = buildWagerSoul(arch, promise, predictedTokenId);
    const key = deriveKey(SOUL_KEY_SEED, predictedTokenId);
    const blob = encryptSoul(soul, key);
    const sealedSoulRoot = await uploadSealedSoul(blob, operator);
    const inf = await runTeeInference(operator, soul, buildOpenEpochPrompt());

    // Mint INFT (trader address is the owner, operator pays gas)
    const metadataHash = ethers.keccak256(
      ethers.toUtf8Bytes(`tee:${inf.chatId}|input:${inf.inputHash}|output:${inf.outputHash}`),
    );
    const mintTx = await strat.mint(trader, archMeta.idx, sealedSoulRoot, metadataHash, { gasPrice: GAS_PRICE });
    const mintRcpt = await mintTx.wait();

    // startEpoch — for v3 demo, operator-owned wagers can call startEpoch directly.
    // For user-owned wagers (trader != operator), the trader must call startEpoch
    // themselves from their wallet to satisfy the ERC-721 owner check. We return
    // the tokenId here; the UI exposes a follow-up "start epoch" step if needed.
    let epochTx: string | null = null;
    if (trader.toLowerCase() === operator.address.toLowerCase()) {
      const tx = await strat.startEpoch(predictedTokenId, BOND, BigInt(drawdownBps), BigInt(epochSecs), { gasPrice: GAS_PRICE });
      const r = await tx.wait();
      epochTx = r!.hash;
    }

    return Response.json({
      tokenId: predictedTokenId.toString(),
      sealedSoulRoot,
      chatId: inf.chatId,
      teeValid: inf.isValid,
      mintTx: mintRcpt!.hash,
      epochTx,
      trader,
      archetype,
      promise: promise.slice(0, 120),
      note: epochTx
        ? "Wager minted + epoch opened by operator (operator==trader). Real TEE attestation. Per-trade attestation is v3.5."
        : "Wager minted with TEE attestation; trader must call startEpoch from their wallet to lock the bond. EVM↔HL pairing (operator HL only) means trade execution is operator-driven in v3 — per-strategy HL keys derived inside TEE are v3.5.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mint-wager] FATAL:", msg);
    return Response.json({ error: msg.slice(0, 400) }, { status: 502 });
  }
}
