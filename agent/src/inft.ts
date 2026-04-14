import { ethers } from "ethers";
import { storeAttestation } from "./storage.js";
import type { AttestationData } from "./types.js";

const INFT_ABI = [
  "function mint(address to, bytes32[] dataHashes, string[] dataDescriptions) returns (uint256 tokenId)",
  "function updateData(uint256 tokenId, bytes32[] newDataHashes)",
  "function intelligentDataOf(uint256 tokenId) view returns (tuple(string dataDescription, bytes32 dataHash)[])",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)",
];

let tokenId: number | null = null;

export async function mintAgentINFT(
  wallet: ethers.Wallet,
  inftAddress: string,
  strategyConfig: object
): Promise<number> {
  const inft = new ethers.Contract(inftAddress, INFT_ABI, wallet);

  // Store strategy config on 0G Storage
  const configAttestation: AttestationData = {
    tradeId: "genesis",
    model: "config",
    inputHash: ethers.ZeroHash,
    outputHash: ethers.ZeroHash,
    timestamp: Date.now(),
    chatId: "",
    isValid: true,
    decision: { action: "hold", tokenIn: "", tokenOut: "", amount: "0", reasoning: "Initial config" },
    marketContext: {
      reserve0: "0", reserve1: "0", token0: "", token1: "",
      price: 0, vaultBalance0: "0", vaultBalance1: "0", recentTrades: [],
    },
  };

  const configRootHash = await storeAttestation(configAttestation);

  const dataHashes = [configRootHash, ethers.ZeroHash]; // config + performance (empty initially)
  const dataDescriptions = ["strategy_config", "performance_log"];

  console.log("[inft] Minting agent INFT...");
  const tx = await inft.mint(wallet.address, dataHashes, dataDescriptions);
  const receipt = await tx.wait();

  // Get tokenId from event
  const mintEvent = receipt.logs.find((log: any) => {
    try {
      const parsed = inft.interface.parseLog({ topics: log.topics, data: log.data });
      return parsed?.name === "AgentMinted";
    } catch {
      return false;
    }
  });

  if (mintEvent) {
    const parsed = inft.interface.parseLog({ topics: mintEvent.topics, data: mintEvent.data });
    tokenId = Number(parsed!.args.tokenId);
  } else {
    // Fallback: read totalSupply - 1
    const supply = await inft.totalSupply();
    tokenId = Number(supply) - 1;
  }

  console.log(`[inft] Agent INFT minted. Token ID: ${tokenId}`);
  return tokenId;
}

export async function updateINFTPerformance(
  wallet: ethers.Wallet,
  inftAddress: string,
  performanceSummary: object,
  configRootHash: string
): Promise<void> {
  if (tokenId === null) {
    console.log("[inft] No INFT minted yet, skipping update");
    return;
  }

  try {
    // Store performance summary on 0G Storage
    const perfAttestation: AttestationData = {
      tradeId: "performance-update",
      model: "summary",
      inputHash: ethers.ZeroHash,
      outputHash: ethers.ZeroHash,
      timestamp: Date.now(),
      chatId: "",
      isValid: true,
      decision: { action: "hold", tokenIn: "", tokenOut: "", amount: "0", reasoning: JSON.stringify(performanceSummary) },
      marketContext: {
        reserve0: "0", reserve1: "0", token0: "", token1: "",
        price: 0, vaultBalance0: "0", vaultBalance1: "0", recentTrades: [],
      },
    };

    const perfRootHash = await storeAttestation(perfAttestation);

    const inft = new ethers.Contract(inftAddress, INFT_ABI, wallet);
    const newHashes = [configRootHash, perfRootHash];

    const tx = await inft.updateData(tokenId, newHashes);
    await tx.wait();

    console.log(`[inft] INFT performance updated. Token ID: ${tokenId}`);
  } catch (e: any) {
    console.log(`[inft] Performance update failed (non-blocking): ${e.message?.slice(0, 100)}`);
  }
}

export function getTokenId(): number | null {
  return tokenId;
}
