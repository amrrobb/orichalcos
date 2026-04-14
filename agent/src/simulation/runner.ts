import { ethers } from "ethers";
import http from "http";
import type { AgentConfig, MarketContext, TradeDecision } from "../types.js";
import { getMarketContext } from "../market.js";
import { getTradeSignal } from "../compute.js";

interface AgentState {
  name: string;
  pnl: number;
  trades: TradeEntry[];
  balance0: bigint;
  balance1: bigint;
  initialValue: number;
}

interface TradeEntry {
  timestamp: number;
  action: string;
  amountIn: string;
  amountOut: string;
  pnlAfter: number;
  mevExtracted?: number;
}

interface SimulationState {
  sealed: AgentState;
  exposed: AgentState;
  mevBot: { profit: number; extractions: number };
  cycle: number;
  running: boolean;
}

let state: SimulationState = {
  sealed: { name: "Orichalcos (TEE Sealed)", pnl: 0, trades: [], balance0: 0n, balance1: 0n, initialValue: 0 },
  exposed: { name: "Exposed Agent (No TEE)", pnl: 0, trades: [], balance0: 0n, balance1: 0n, initialValue: 0 },
  mevBot: { profit: 0, extractions: 0 },
  cycle: 0,
  running: false,
};

// MEV extraction rate: 2-5% of each exposed trade
const MEV_RATE_MIN = 0.02;
const MEV_RATE_MAX = 0.05;

function calculateValue(balance0: bigint, balance1: bigint, price: number): number {
  // Value in token1 terms (USDC)
  const val0 = Number(ethers.formatUnits(balance0, 18)) * price;
  const val1 = Number(ethers.formatUnits(balance1, 6));
  return val0 + val1;
}

function simulateMevExtraction(amountOut: string, decimalsOut: number): number {
  const rate = MEV_RATE_MIN + Math.random() * (MEV_RATE_MAX - MEV_RATE_MIN);
  const amount = Number(ethers.formatUnits(amountOut, decimalsOut));
  return amount * rate;
}

export async function runSimulation(
  config: AgentConfig,
  provider: ethers.Provider
) {
  state.running = true;

  // Initialize balances (mirror vault)
  const context = await getMarketContext(provider, config.pairAddress, config.vaultAddress);
  const initBalance0 = BigInt(context.vaultBalance0);
  const initBalance1 = BigInt(context.vaultBalance1);
  const initValue = calculateValue(initBalance0, initBalance1, context.price);

  state.sealed.balance0 = initBalance0;
  state.sealed.balance1 = initBalance1;
  state.sealed.initialValue = initValue;

  state.exposed.balance0 = initBalance0;
  state.exposed.balance1 = initBalance1;
  state.exposed.initialValue = initValue;

  console.log(`[sim] Starting simulation. Initial value: $${initValue.toFixed(2)}`);

  while (state.running) {
    try {
      state.cycle++;
      const ctx = await getMarketContext(provider, config.pairAddress, config.vaultAddress);

      // Both agents get the same signal from 0G Compute
      let signal;
      try {
        signal = await getTradeSignal(config.computeProviderAddress, ctx);
      } catch {
        // If compute is down, simulate a random signal for demo
        signal = {
          decision: generateDemoSignal(ctx),
          attestation: { chatId: "", model: "demo", isValid: false, timestamp: Date.now(), inputHash: "", outputHash: "" },
        };
      }

      const decision = signal.decision;
      if (decision.action === "hold") {
        console.log(`[sim] Cycle ${state.cycle}: HOLD`);
        await sleep(config.pollInterval);
        continue;
      }

      // Simulate the trade amount for both agents
      const tradeAmount = BigInt(decision.amount);
      const isToken0In = decision.tokenIn === ctx.token0;

      // Calculate expected output using constant product formula
      const r0 = BigInt(ctx.reserve0);
      const r1 = BigInt(ctx.reserve1);
      const amountInWithFee = tradeAmount * 997n;
      const [reserveIn, reserveOut] = isToken0In ? [r0, r1] : [r1, r0];
      const amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000n + amountInWithFee);
      const decimalsOut = isToken0In ? 6 : 18;

      // === SEALED AGENT ===
      // Gets full output — MEV bot can't see the trade
      if (isToken0In) {
        state.sealed.balance0 -= tradeAmount;
        state.sealed.balance1 += amountOut;
      } else {
        state.sealed.balance1 -= tradeAmount;
        state.sealed.balance0 += amountOut;
      }
      const sealedValue = calculateValue(state.sealed.balance0, state.sealed.balance1, ctx.price);
      state.sealed.pnl = ((sealedValue - state.sealed.initialValue) / state.sealed.initialValue) * 100;
      state.sealed.trades.push({
        timestamp: Date.now(),
        action: decision.action,
        amountIn: tradeAmount.toString(),
        amountOut: amountOut.toString(),
        pnlAfter: state.sealed.pnl,
      });

      // === EXPOSED AGENT ===
      // MEV bot sandwiches the trade — loses a percentage of output
      const mevAmount = simulateMevExtraction(amountOut.toString(), decimalsOut);
      const mevAmountWei = ethers.parseUnits(mevAmount.toFixed(decimalsOut), decimalsOut);
      const exposedAmountOut = amountOut - mevAmountWei;

      if (isToken0In) {
        state.exposed.balance0 -= tradeAmount;
        state.exposed.balance1 += exposedAmountOut;
      } else {
        state.exposed.balance1 -= tradeAmount;
        state.exposed.balance0 += exposedAmountOut;
      }
      const exposedValue = calculateValue(state.exposed.balance0, state.exposed.balance1, ctx.price);
      state.exposed.pnl = ((exposedValue - state.exposed.initialValue) / state.exposed.initialValue) * 100;
      state.exposed.trades.push({
        timestamp: Date.now(),
        action: decision.action,
        amountIn: tradeAmount.toString(),
        amountOut: exposedAmountOut.toString(),
        pnlAfter: state.exposed.pnl,
        mevExtracted: mevAmount,
      });

      // MEV bot profits
      state.mevBot.profit += mevAmount;
      state.mevBot.extractions++;

      console.log(`[sim] Cycle ${state.cycle}: ${decision.action} | Sealed PnL: ${state.sealed.pnl.toFixed(2)}% | Exposed PnL: ${state.exposed.pnl.toFixed(2)}% | MEV extracted: $${mevAmount.toFixed(4)}`);
    } catch (e: any) {
      console.error(`[sim] Cycle error: ${e.message?.slice(0, 100)}`);
    }

    await sleep(config.pollInterval);
  }
}

function generateDemoSignal(ctx: MarketContext): TradeDecision {
  // Simple alternating buy/sell for demo when compute is unavailable
  const actions: Array<"buy" | "sell"> = ["buy", "sell"];
  const action = actions[Math.floor(Math.random() * 2)];
  const balance = action === "buy" ? BigInt(ctx.vaultBalance1) : BigInt(ctx.vaultBalance0);
  const amount = (balance * 10n) / 100n; // 10% of holdings

  return {
    action,
    tokenIn: action === "buy" ? ctx.token1 : ctx.token0,
    tokenOut: action === "buy" ? ctx.token0 : ctx.token1,
    amount: amount.toString(),
    reasoning: "Demo signal (compute unavailable)",
  };
}

export function getSimulationState(): SimulationState {
  return {
    ...state,
    sealed: { ...state.sealed, balance0: state.sealed.balance0, balance1: state.sealed.balance1 },
    exposed: { ...state.exposed, balance0: state.exposed.balance0, balance1: state.exposed.balance1 },
  };
}

export function stopSimulation() {
  state.running = false;
}

// Simple HTTP server for dashboard polling
export function startSimulationAPI(port = 3001) {
  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    if (req.url === "/api/simulation") {
      const s = getSimulationState();
      // Convert bigints to strings for JSON
      const jsonSafe = {
        sealed: {
          ...s.sealed,
          balance0: s.sealed.balance0.toString(),
          balance1: s.sealed.balance1.toString(),
        },
        exposed: {
          ...s.exposed,
          balance0: s.exposed.balance0.toString(),
          balance1: s.exposed.balance1.toString(),
        },
        mevBot: s.mevBot,
        cycle: s.cycle,
        running: s.running,
      };
      res.end(JSON.stringify(jsonSafe));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  server.listen(port, () => {
    console.log(`[sim] Simulation API running on http://localhost:${port}/api/simulation`);
  });

  return server;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
