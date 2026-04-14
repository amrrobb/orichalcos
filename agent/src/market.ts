import { ethers } from "ethers";
import type { MarketContext, TradeRecord } from "./types.js";

const PAIR_ABI = [
  "function getReserves() view returns (uint112, uint112)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
];

const VAULT_ABI = [
  "function getBalance(address token) view returns (uint256)",
  "function getTradeCount() view returns (uint256)",
  "function getTrade(uint256 index) view returns (tuple(bytes32 tradeId, uint256 timestamp, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, bytes32 attestationRoot))",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
];

export async function getMarketContext(
  provider: ethers.Provider,
  pairAddress: string,
  vaultAddress: string
): Promise<MarketContext> {
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);

  const [reserves, token0, token1] = await Promise.all([
    pair.getReserves(),
    pair.token0(),
    pair.token1(),
  ]);

  const [balance0, balance1, tradeCount] = await Promise.all([
    vault.getBalance(token0),
    vault.getBalance(token1),
    vault.getTradeCount(),
  ]);

  // Get recent trades (last 5)
  const recentTrades: TradeRecord[] = [];
  const start = Math.max(0, Number(tradeCount) - 5);
  for (let i = start; i < Number(tradeCount); i++) {
    const trade = await vault.getTrade(i);
    recentTrades.push({
      tradeId: trade.tradeId,
      timestamp: Number(trade.timestamp),
      tokenIn: trade.tokenIn,
      tokenOut: trade.tokenOut,
      amountIn: trade.amountIn.toString(),
      amountOut: trade.amountOut.toString(),
      attestationRoot: trade.attestationRoot,
    });
  }

  // Price: token0 per token1
  const r0 = Number(ethers.formatUnits(reserves[0], 18));
  const r1 = Number(ethers.formatUnits(reserves[1], 6));
  const price = r0 > 0 ? r1 / r0 : 0;

  return {
    reserve0: reserves[0].toString(),
    reserve1: reserves[1].toString(),
    token0,
    token1,
    price,
    vaultBalance0: balance0.toString(),
    vaultBalance1: balance1.toString(),
    recentTrades,
  };
}
