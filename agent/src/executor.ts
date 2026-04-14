import { ethers } from "ethers";
import type { TradeDecision } from "./types.js";

const VAULT_ABI = [
  "function executeTrade(address tokenIn, uint256 amountIn, uint256 amountOutMin) returns (bytes32 tradeId, uint256 amountOut)",
  "function registerAttestation(bytes32 tradeId, bytes32 attestationRoot)",
  "function getBalance(address token) view returns (uint256)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
];

export async function executeTrade(
  wallet: ethers.Wallet,
  vaultAddress: string,
  decision: TradeDecision
): Promise<{ tradeId: string; amountOut: string }> {
  const vault = new ethers.Contract(vaultAddress, VAULT_ABI, wallet);

  console.log(`[executor] Executing ${decision.action}: ${decision.amount} of ${decision.tokenIn}`);

  const tx = await vault.executeTrade(
    decision.tokenIn,
    decision.amount,
    0 // amountOutMin = 0 for demo (accept any slippage)
  );
  const receipt = await tx.wait();

  // Parse TradeExecuted event from receipt logs
  let tradeId = ethers.ZeroHash;
  let amountOut = "0";

  const iface = new ethers.Interface([
    "event TradeExecuted(bytes32 indexed tradeId, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
  ]);

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if (parsed && parsed.name === "TradeExecuted") {
        tradeId = parsed.args[0]; // tradeId (indexed)
        amountOut = parsed.args[4].toString(); // amountOut
        break;
      }
    } catch {
      // Not our event, skip
    }
  }

  console.log(`[executor] Trade executed. ID: ${tradeId.slice(0, 10)}... AmountOut: ${amountOut}`);
  return { tradeId, amountOut };
}

export async function registerAttestation(
  wallet: ethers.Wallet,
  vaultAddress: string,
  tradeId: string,
  attestationRoot: string
): Promise<void> {
  const vault = new ethers.Contract(vaultAddress, VAULT_ABI, wallet);

  const tx = await vault.registerAttestation(tradeId, attestationRoot);
  await tx.wait();

  console.log(`[executor] Attestation registered: ${attestationRoot.slice(0, 10)}... for trade ${tradeId.slice(0, 10)}...`);
}
