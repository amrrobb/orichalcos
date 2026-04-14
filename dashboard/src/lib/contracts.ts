export const CHAIN_ID = 16602;
export const RPC_URL = "https://evmrpc-testnet.0g.ai";
export const EXPLORER_URL = "https://chainscan-galileo.0g.ai";
export const SIMULATION_API = "http://localhost:3001";

// Filled after deployment
export const ADDRESSES = {
  vault: process.env.NEXT_PUBLIC_VAULT_ADDRESS || "",
  pair: process.env.NEXT_PUBLIC_PAIR_ADDRESS || "",
  inft: process.env.NEXT_PUBLIC_INFT_ADDRESS || "",
  weth: process.env.NEXT_PUBLIC_WETH_ADDRESS || "",
  usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
};

export const VAULT_ABI = [
  "function getBalance(address token) view returns (uint256)",
  "function getTradeCount() view returns (uint256)",
  "function getTrade(uint256 index) view returns (tuple(bytes32 tradeId, uint256 timestamp, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, bytes32 attestationRoot))",
  "function tradeAttestations(bytes32 tradeId) view returns (bytes32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function agent() view returns (address)",
  "function owner() view returns (address)",
] as const;

export const PAIR_ABI = [
  "function getReserves() view returns (uint112, uint112)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
] as const;

export const INFT_ABI = [
  "function intelligentDataOf(uint256 tokenId) view returns (tuple(string dataDescription, bytes32 dataHash)[])",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function dataHashesOf(uint256 tokenId) view returns (bytes32[])",
  "function dataDescriptionsOf(uint256 tokenId) view returns (string[])",
] as const;
