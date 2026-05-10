/**
 * TEE inference for Scrying Duels — Tier 2-real wired end-to-end.
 *
 * Flow per duel call:
 *   1. Download encrypted soul blob from 0G Storage by sealedSoulRoot
 *   2. Derive the per-Apprentice symmetric key from SOUL_KEY_SEED + tokenId
 *      (HKDF-SHA256, in soul-encryption.ts)
 *   3. Decrypt the blob locally → plaintext system prompt
 *   4. Build user prompt with market context + nonce
 *   5. POST to 0G Compute provider's OpenAI-compatible endpoint
 *   6. Receive Qwen 2.5 7B response (running inside Intel TDX + H100 enclave)
 *   7. broker.inference.processResponse(providerAddress, chatId, usageData)
 *      verifies the TEE attestation signature; returns true on valid
 *   8. Parse the structured JSON output (direction + publicTell + confidence)
 *
 * Per 0G-CLAUDE.md ALWAYS rules:
 *  - processResponse(providerAddress, chatID, usageData) — exact param order
 *  - chatID extracted from completion.id (ZG-Res-Key header would require raw fetch)
 *  - ethers v6 only
 */

import { ethers } from "ethers";
import type { ApprenticeSoul, DuelCall, MarketContext, TEEAttestedCall } from "./types.js";
import { buildDuelUserPrompt } from "./prompts/archetype-prompts.js";
import { deriveApprenticeKey, decryptSoul } from "./soul-encryption.js";
import { downloadSealedSoul } from "./storage.js";

let broker: any = null;
let providerEndpoint: string | null = null;
let providerModel: string | null = null;

const MOCK_MODE = process.env.MOCK_COMPUTE === "true";

export async function initDuelCompute(wallet: ethers.Wallet, providerAddress: string) {
  console.log("[duel-tee] initializing 0G Compute broker...");
  // ESM export is broken on some Node versions — force CJS require like compute.ts
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");
  broker = await createZGComputeNetworkBroker(wallet);

  const metadata = await broker.inference.getServiceMetadata(providerAddress);
  providerEndpoint = metadata.endpoint;
  providerModel = metadata.model;
  console.log(`[duel-tee] provider: ${providerAddress}`);
  console.log(`[duel-tee] model: ${providerModel}`);
  console.log(`[duel-tee] endpoint: ${providerEndpoint}`);
}

/**
 * Acknowledge the provider signer once per signer/provider pair (idempotent).
 * Required before the TEE will attest responses for this signer.
 */
export async function acknowledgeProvider(providerAddress: string) {
  if (!broker) throw new Error("call initDuelCompute first");
  try {
    await broker.inference.acknowledgeProviderSigner(providerAddress);
    console.log(`[duel-tee] provider signer acknowledged`);
  } catch (e: any) {
    if (e.message?.includes("already acknowledged") || e.message?.includes("execution reverted")) {
      console.log("[duel-tee] provider signer already acknowledged");
    } else {
      throw e;
    }
  }
}

/**
 * Download + decrypt the Apprentice's sealed soul from 0G Storage.
 * Honest scope: the symmetric key is held in the agent runner's env (Tier 2-real).
 */
async function fetchAndDecryptSoul(soul: ApprenticeSoul, masterSeed: string): Promise<string> {
  const blob = await downloadSealedSoul(soul.sealedSoulRoot);
  const key = deriveApprenticeKey(masterSeed, soul.tokenId);
  return decryptSoul(blob, key);
}

/**
 * Run TEE inference for one Apprentice in a duel.
 */
export async function runApprenticeInference(
  providerAddress: string,
  soul: ApprenticeSoul,
  market: MarketContext,
  duelId: bigint,
  windowSeconds: number,
  masterSeed: string
): Promise<TEEAttestedCall> {
  if (MOCK_MODE) {
    return runMockInference(soul, market, duelId, windowSeconds);
  }
  if (!broker || !providerEndpoint || !providerModel) {
    throw new Error("Duel compute not initialized — call initDuelCompute first");
  }

  console.log(`[duel-tee] [${soul.name}/${soul.tokenId}] fetching+decrypting sealed soul...`);
  const systemPrompt = await fetchAndDecryptSoul(soul, masterSeed);

  const userPrompt = buildDuelUserPrompt({
    asset: market.asset,
    priceContext: `current price=${market.priceNow}, recentVolatility=${market.recentVolatility ?? "moderate"}`,
    windowSeconds,
    duelId,
    nonce: `${duelId}-${soul.tokenId}-${Date.now()}`,
  });

  const inputHash = ethers.keccak256(ethers.toUtf8Bytes(systemPrompt + "\n---\n" + userPrompt));

  console.log(`[duel-tee] [${soul.name}] requesting TEE-attested headers...`);
  const headers = await broker.inference.getRequestHeaders(providerAddress);

  console.log(`[duel-tee] [${soul.name}] calling 0G Compute (${providerModel})...`);
  // Use raw fetch (not the OpenAI SDK) so we can read the ZG-Res-Key response
  // header — that's the chatID the verifier looks up for signature.
  const requestBody = {
    model: providerModel,
    temperature: 0.4,
    max_tokens: 280,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  const response = await fetch(`${providerEndpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`0G Compute HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }
  // Per 0G-CLAUDE.md: ZG-Res-Key header FIRST, completion.id as fallback
  const zgResKey = response.headers.get("ZG-Res-Key") || response.headers.get("zg-res-key") || "";
  const completion = await response.json();
  const chatId = zgResKey || completion.id || "";
  const rawContent = completion.choices?.[0]?.message?.content || "";
  const outputHash = ethers.keccak256(ethers.toUtf8Bytes(rawContent));
  if (!zgResKey) {
    console.log(`[duel-tee] [${soul.name}] WARN: no ZG-Res-Key header, using completion.id=${chatId}`);
  }

  // TEE attestation verification — MUST be called for fee settlement
  let isValid = false;
  try {
    const usageData = completion.usage ? JSON.stringify(completion.usage) : undefined;
    const result = await broker.inference.processResponse(providerAddress, chatId, usageData);
    isValid = result === true;
  } catch (e: any) {
    console.log(`[duel-tee] [${soul.name}] processResponse error:`, e.message?.slice(0, 120));
  }

  const call = parseDuelCall(rawContent, soul.archetype);

  console.log(`[duel-tee] [${soul.name}] direction=${call.direction} confidence=${call.confidence} TEE-valid=${isValid}`);

  return {
    call,
    attestation: {
      chatId,
      model: providerModel,
      isValid,
      timestamp: Date.now(),
      inputHash,
      outputHash,
    },
  };
}

function parseDuelCall(raw: string, archetype: ApprenticeSoul["archetype"]): DuelCall {
  try {
    // Strip markdown fences if model wrapped in ```json ... ```
    const cleaned = raw.replace(/```(json)?/g, "");
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON found");
    const parsed = JSON.parse(jsonMatch[0]);
    const direction = String(parsed.direction).toUpperCase();
    if (direction !== "LONG" && direction !== "SHORT") throw new Error(`invalid direction: ${direction}`);
    const publicTell = String(parsed.publicTell ?? "").slice(0, 600);
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));
    return { direction: direction as "LONG" | "SHORT", publicTell, confidence };
  } catch (e: any) {
    console.log(`[duel-tee] parse error (${e.message?.slice(0, 80)}), defaulting`);
    // Archetype-defaulted fallback so the duel can still settle
    const defaultDirection = archetype === "Bold" || archetype === "Sharp" ? "LONG" : "SHORT";
    return {
      direction: defaultDirection,
      publicTell: `[parse-fallback] Defaulting to ${defaultDirection} based on archetype tendency.`,
      confidence: 0.5,
    };
  }
}

// ─────────── Mock mode (no compute spend, deterministic per duelId) ───────────

function runMockInference(
  soul: ApprenticeSoul,
  market: MarketContext,
  duelId: bigint,
  windowSeconds: number
): TEEAttestedCall {
  const seed = Number(duelId % 100n);
  const archDirectionBias: Record<string, "LONG" | "SHORT"> = {
    Bold: "LONG",
    Patient: "SHORT",
    Sharp: seed % 2 === 0 ? "LONG" : "SHORT",
    Stoic: "SHORT",
  };
  const direction = archDirectionBias[soul.archetype];
  const publicTell = `[MOCK] ${soul.name} (${soul.archetype}) calls ${direction} on ${market.asset} for ${windowSeconds}s. Mock seed=${seed}.`;
  const confidence = 0.5 + (seed % 30) / 100;

  const inputHash = ethers.keccak256(ethers.toUtf8Bytes(`${soul.name}|${market.asset}|${duelId}`));
  const outputHash = ethers.keccak256(ethers.toUtf8Bytes(publicTell));

  return {
    call: { direction, publicTell, confidence },
    attestation: {
      chatId: `mock-${duelId}-${soul.tokenId}`,
      model: "mock-archetype-v1",
      isValid: true,
      timestamp: Date.now(),
      inputHash,
      outputHash,
    },
  };
}
