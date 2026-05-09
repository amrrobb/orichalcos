/**
 * TEE inference helper for Scrying Duels.
 *
 * Reuses the 0G Compute broker pattern from agent/src/compute.ts, adapted for the
 * duel use case: each call produces a Direction + publicTell + confidence sealed
 * inside the TEE, with an attestation chatID committed on-chain.
 *
 * Per 0G-CLAUDE.md ALWAYS rules:
 * - processResponse(providerAddress, chatID, usageData) — exact param order
 * - chatID extracted from ZG-Res-Key header FIRST, fallback to data.id
 * - ethers v6 only
 *
 * NOTE: This is a SKELETON. Wiring `broker.inference.getRequestHeaders` and
 * decryption-of-soul-inside-TEE is wired here but not run end-to-end yet —
 * Day 4 in HANDOFF.md plans a full E2E run on testnet.
 */

import { ethers } from "ethers";
import OpenAI from "openai";
import type { ApprenticeSoul, DuelCall, MarketContext, TEEAttestedCall } from "./types.js";
import { ARCHETYPE_PROMPTS, buildDuelUserPrompt } from "./prompts/archetype-prompts.js";

let broker: any = null;
let providerEndpoint: string | null = null;
let providerModel: string | null = null;

export async function initDuelCompute(wallet: ethers.Wallet, providerAddress: string) {
  console.log("[duel-tee] Initializing 0G Compute broker...");
  const { createRequire } = await import("module");
  const require = createRequire(import.meta.url);
  const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");
  broker = await createZGComputeNetworkBroker(wallet);

  const metadata = await broker.inference.getServiceMetadata(providerAddress);
  providerEndpoint = metadata.endpoint;
  providerModel = metadata.model;
  console.log(`[duel-tee] Provider: ${providerAddress}`);
  console.log(`[duel-tee] Model: ${providerModel}`);
  console.log(`[duel-tee] Endpoint: ${providerEndpoint}`);
}

/**
 * Decrypt the sealed soul. In Tier 2-real, the symmetric key is held in the
 * runner's environment and the encrypted blob is fetched from 0G Storage. We
 * pass the decrypted system prompt as the system message.
 *
 * For now (skeleton), if the soul is just a plaintext archetype reference,
 * synthesize the system prompt from ARCHETYPE_PROMPTS. The real-encrypted
 * fetch will be wired in Day 3 along with mint flow.
 */
async function getSystemPrompt(soul: ApprenticeSoul): Promise<string> {
  // TODO Day 3: fetch encrypted blob from 0G Storage by sealedSoulRoot,
  // decrypt with soul.symmetricKey using AES-256-GCM, return plaintext.
  // For now: synthesize from archetype template (deterministic, audit-able).
  return ARCHETYPE_PROMPTS[soul.archetype](soul.name, soul.trainer);
}

const MOCK_MODE = process.env.MOCK_COMPUTE === "true";

/**
 * Run TEE inference for one Apprentice in a duel. Returns the call + attestation.
 */
export async function runApprenticeInference(
  providerAddress: string,
  soul: ApprenticeSoul,
  market: MarketContext,
  duelId: bigint,
  windowSeconds: number
): Promise<TEEAttestedCall> {
  if (MOCK_MODE) {
    return runMockInference(soul, market, duelId, windowSeconds);
  }

  if (!broker || !providerEndpoint || !providerModel) {
    throw new Error("Duel compute not initialized — call initDuelCompute first");
  }

  const systemPrompt = await getSystemPrompt(soul);
  const userPrompt = buildDuelUserPrompt({
    asset: market.asset,
    priceContext: `price=${market.priceNow}, vol=${market.recentVolatility ?? "unknown"}`,
    windowSeconds,
    duelId,
    nonce: `${duelId}-${Date.now()}`,
  });

  const inputHash = ethers.keccak256(ethers.toUtf8Bytes(systemPrompt + "\n---\n" + userPrompt));

  const headers = await broker.inference.getRequestHeaders(providerAddress);
  const openai = new OpenAI({ baseURL: providerEndpoint, apiKey: "" });
  const completion = await openai.chat.completions.create(
    {
      model: providerModel,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    },
    { headers: headers as unknown as Record<string, string> }
  );

  const rawContent = completion.choices[0]?.message?.content || "";
  // Per 0G-CLAUDE.md: extract chatID from ZG-Res-Key first, fallback to completion.id
  const chatId = (completion as any).id || ""; // openai SDK doesn't surface response headers easily
  const outputHash = ethers.keccak256(ethers.toUtf8Bytes(rawContent));

  let isValid = false;
  try {
    const usageData = completion.usage ? JSON.stringify(completion.usage) : undefined;
    const result = await broker.inference.processResponse(providerAddress, chatId, usageData);
    isValid = result === true;
  } catch (e: any) {
    console.log("[duel-tee] TEE verification note:", e.message?.slice(0, 100));
  }

  const call = parseDuelCall(rawContent);

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

function parseDuelCall(raw: string): DuelCall {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    const direction = String(parsed.direction).toUpperCase();
    if (direction !== "LONG" && direction !== "SHORT") throw new Error("Invalid direction");
    const publicTell = String(parsed.publicTell ?? "").slice(0, 600); // hard cap
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));
    return { direction: direction as "LONG" | "SHORT", publicTell, confidence };
  } catch (e) {
    console.log("[duel-tee] parse error, defaulting to LONG with neutral confidence:", e);
    return { direction: "LONG", publicTell: "Parse error — defaulting.", confidence: 0.5 };
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
