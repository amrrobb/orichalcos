import { ethers } from "ethers";
import OpenAI from "openai";
import type { MarketContext, TradeDecision, TEEAttestation, TradeSignal } from "./types.js";

let broker: any = null;
let providerEndpoint: string | null = null;
let providerModel: string | null = null;

export async function initCompute(wallet: ethers.Wallet, providerAddress: string) {
  console.log("[compute] Initializing 0G Compute broker...");
  // Force CJS require — ESM export is broken on Node 23
  const { createRequire } = await import("module");
  const require = createRequire(import.meta.url);
  const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");
  broker = await createZGComputeNetworkBroker(wallet);

  // Get provider metadata
  const metadata = await broker.inference.getServiceMetadata(providerAddress);
  providerEndpoint = metadata.endpoint;
  providerModel = metadata.model;
  console.log(`[compute] Provider: ${providerAddress}`);
  console.log(`[compute] Model: ${providerModel}`);
  console.log(`[compute] Endpoint: ${providerEndpoint}`);
}

export async function setupComputeProvider(providerAddress: string) {
  if (!broker) throw new Error("Broker not initialized. Call initCompute first.");

  console.log("[compute] Setting up ledger + provider...");

  // Create ledger with 3 OG minimum
  try {
    await broker.ledger.addLedger(3);
    console.log("[compute] Ledger created with 3 OG");
  } catch (e: any) {
    if (e.message?.includes("already exists") || e.message?.includes("execution reverted")) {
      console.log("[compute] Ledger already exists, skipping");
    } else {
      throw e;
    }
  }

  // Transfer 1 OG to provider
  try {
    const amount = ethers.parseEther("1.0");
    await broker.ledger.transferFund(providerAddress, "inference", amount);
    console.log("[compute] Transferred 1 OG to provider");
  } catch (e: any) {
    console.log("[compute] Transfer fund note:", e.message?.slice(0, 100));
  }

  // Acknowledge provider signer (once per provider)
  try {
    await broker.inference.acknowledgeProviderSigner(providerAddress);
    console.log("[compute] Provider signer acknowledged");
  } catch (e: any) {
    if (e.message?.includes("already acknowledged") || e.message?.includes("execution reverted")) {
      console.log("[compute] Provider already acknowledged, skipping");
    } else {
      throw e;
    }
  }
}

function buildPrompt(context: MarketContext): string {
  const price = context.price.toFixed(2);
  return `You are an autonomous DeFi trading agent managing a vault.

Current market state:
- Pool: ${context.token0}/${context.token1}
- Reserves: ${context.reserve0} / ${context.reserve1}
- Price: 1 token0 = ${price} token1
- Vault holdings: ${context.vaultBalance0} token0, ${context.vaultBalance1} token1
- Recent trades: ${context.recentTrades.length} in history

Analyze the market and decide your next trade. Consider:
1. Current portfolio balance between the two tokens
2. Price movement opportunity
3. Risk management (don't go all-in on one side)

Respond in EXACTLY this JSON format:
{
  "action": "buy" | "sell" | "hold",
  "token": "token0" | "token1",
  "percentage": 5-20,
  "reasoning": "brief explanation"
}

Where "buy" means buy token0 (sell token1), "sell" means sell token0 (buy token1).
percentage is the % of vault holdings to trade.`;
}

function parseDecision(response: string, context: MarketContext): TradeDecision {
  try {
    // Extract JSON from response (may have markdown wrapping)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);
    const action = parsed.action as "buy" | "sell" | "hold";

    if (action === "hold") {
      return { action: "hold", tokenIn: "", tokenOut: "", amount: "0", reasoning: parsed.reasoning || "Holding" };
    }

    const percentage = Math.min(Math.max(parsed.percentage || 10, 1), 25); // Clamp 1-25%

    let tokenIn: string, tokenOut: string, balance: bigint;
    if (action === "buy") {
      // Buy token0 = sell token1
      tokenIn = context.token1;
      tokenOut = context.token0;
      balance = BigInt(context.vaultBalance1);
    } else {
      // Sell token0 = buy token1
      tokenIn = context.token0;
      tokenOut = context.token1;
      balance = BigInt(context.vaultBalance0);
    }

    const amount = (balance * BigInt(percentage)) / 100n;
    return {
      action,
      tokenIn,
      tokenOut,
      amount: amount.toString(),
      reasoning: parsed.reasoning || `${action} at ${percentage}%`,
    };
  } catch {
    console.log("[compute] Failed to parse model response, defaulting to hold");
    return { action: "hold", tokenIn: "", tokenOut: "", amount: "0", reasoning: "Parse error — holding" };
  }
}

const MOCK_MODE = process.env.MOCK_COMPUTE === "true";

export async function getTradeSignal(
  providerAddress: string,
  context: MarketContext
): Promise<TradeSignal> {
  if (MOCK_MODE) {
    return getMockTradeSignal(context);
  }

  if (!broker || !providerEndpoint || !providerModel) {
    throw new Error("Compute not initialized");
  }

  const prompt = buildPrompt(context);
  const inputHash = ethers.keccak256(ethers.toUtf8Bytes(prompt));

  // Get single-use headers (chatbot: no body needed for signing)
  const headers = await broker.inference.getRequestHeaders(providerAddress);

  // Call via OpenAI-compatible API
  const openai = new OpenAI({ baseURL: providerEndpoint, apiKey: "" });
  const completion = await openai.chat.completions.create(
    {
      messages: [{ role: "user", content: prompt }],
      model: providerModel,
      temperature: 0.3,
    },
    { headers: headers as unknown as Record<string, string> }
  );

  const content = completion.choices[0]?.message?.content || "";
  const chatId = completion.id || "";
  const outputHash = ethers.keccak256(ethers.toUtf8Bytes(content));

  // Process response — MUST be called for fee settlement + TEE verification
  // Signature: processResponse(providerAddress, chatID, usageData)
  // chatID from ZG-Res-Key header first, fallback to completion.id
  let isValid = false;
  try {
    const usageData = completion.usage ? JSON.stringify(completion.usage) : undefined;
    const result = await broker.inference.processResponse(providerAddress, chatId, usageData);
    isValid = result === true;
  } catch (e: any) {
    console.log("[compute] TEE verification note:", e.message?.slice(0, 100));
  }

  const decision = parseDecision(content, context);

  const attestation: TEEAttestation = {
    chatId,
    model: providerModel,
    isValid,
    timestamp: Date.now(),
    inputHash,
    outputHash,
  };

  console.log(`[compute] Signal: ${decision.action} | TEE valid: ${isValid} | Reasoning: ${decision.reasoning.slice(0, 80)}`);

  return { decision, attestation };
}

function getMockTradeSignal(context: MarketContext): TradeSignal {
  // Deterministic mock: alternate buy/sell based on balance ratio
  const bal0 = Number(ethers.formatUnits(context.vaultBalance0, 18));
  const bal1 = Number(ethers.formatUnits(context.vaultBalance1, 6));
  const val0 = bal0 * context.price;
  const ratio = val0 / (val0 + bal1 + 0.001);

  let action: "buy" | "sell" | "hold";
  let reasoning: string;

  if (ratio > 0.6) {
    action = "sell";
    reasoning = "Portfolio overweight token0, rebalancing to token1";
  } else if (ratio < 0.4) {
    action = "buy";
    reasoning = "Portfolio underweight token0, rebalancing to token0";
  } else {
    // 50% chance of small trade, 50% hold
    if (Math.random() > 0.5) {
      action = "hold";
      reasoning = "Portfolio balanced, holding position";
    } else {
      action = Math.random() > 0.5 ? "buy" : "sell";
      reasoning = "Small rebalance trade for demo";
    }
  }

  let tokenIn = "", tokenOut = "", amount = "0";
  if (action !== "hold") {
    const percentage = 5 + Math.floor(Math.random() * 10); // 5-15%
    if (action === "sell") {
      tokenIn = context.token0;
      tokenOut = context.token1;
      amount = ((BigInt(context.vaultBalance0) * BigInt(percentage)) / 100n).toString();
    } else {
      tokenIn = context.token1;
      tokenOut = context.token0;
      amount = ((BigInt(context.vaultBalance1) * BigInt(percentage)) / 100n).toString();
    }
  }

  const prompt = `[MOCK] Market price: ${context.price.toFixed(2)}, ratio: ${ratio.toFixed(2)}`;
  const inputHash = ethers.keccak256(ethers.toUtf8Bytes(prompt));
  const outputHash = ethers.keccak256(ethers.toUtf8Bytes(reasoning));

  console.log(`[compute:mock] Signal: ${action} | Reasoning: ${reasoning}`);

  return {
    decision: { action, tokenIn, tokenOut, amount, reasoning },
    attestation: {
      chatId: `mock-${Date.now()}`,
      model: "mock-strategy-v1",
      isValid: true,
      timestamp: Date.now(),
      inputHash,
      outputHash,
    },
  };
}
