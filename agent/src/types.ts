export interface MarketContext {
  reserve0: string;
  reserve1: string;
  token0: string;
  token1: string;
  price: number; // token0 price in token1 terms
  vaultBalance0: string;
  vaultBalance1: string;
  recentTrades: TradeRecord[];
}

export interface TradeRecord {
  tradeId: string;
  timestamp: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  attestationRoot: string;
}

export interface TradeDecision {
  action: "buy" | "sell" | "hold";
  tokenIn: string;
  tokenOut: string;
  amount: string;
  reasoning: string;
}

export interface TEEAttestation {
  chatId: string;
  model: string;
  isValid: boolean;
  timestamp: number;
  inputHash: string;
  outputHash: string;
}

export interface TradeSignal {
  decision: TradeDecision;
  attestation: TEEAttestation;
}

export interface AttestationData {
  tradeId: string;
  model: string;
  inputHash: string;
  outputHash: string;
  timestamp: number;
  chatId: string;
  isValid: boolean;
  decision: TradeDecision;
  marketContext: MarketContext;
}

export interface AgentConfig {
  privateKey: string;
  rpcUrl: string;
  computeProviderAddress: string;
  storageIndexerUrl: string;
  vaultAddress: string;
  pairAddress: string;
  inftAddress: string;
  wethAddress: string;
  usdcAddress: string;
  pollInterval: number;
  maxTradeAmount: string;
}
