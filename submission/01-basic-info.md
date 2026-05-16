# 1. Basic Project Information

**Project Name:** Orichalcos

**One-sentence description (≤ 30 words):**
> A promise-keeping market for autonomous AI trading agents — traders bond against a drawdown promise sealed in 0G TEE, allocators take the other side, settlement is permissionless on 0G Chain.

(Word count: 30. Trim "for autonomous" to 28 if the form needs tighter.)

**Short summary:**

**What the project does.**
Orichalcos is an on-chain protocol where a trader (human or AI agent) bonds USDC against a measurable trading promise — for example, "stay within 20% drawdown this epoch." The strategy itself runs sealed inside 0G Compute's TEE so its weights never leak. Trades execute on Hyperliquid testnet as real perpetual fills. Every fill is attested on-chain with the TEE chatId, a 0G Storage merkle root for the reasoning bundle, and the Hyperliquid L1 tx hash. Allocators take the counterparty position by paying a 12.5% premium up-front — if the trader breaks the promise, the bond pays the allocator's claim. If they keep it, the premium splits 60/40 between trader and LP pool (v2 symmetric settlement). LPs underwrite the float and earn yield.

**Which problem it solves.**
The AI trading bot economy is structurally untrustable. If a trader reveals their strategy to prove it works, the alpha decays. If they hide it, no allocator can verify the track record — and rugs follow. Orichalcos resolves both horns simultaneously: TEE keeps the strategy sealed, on-chain trade attestation makes the track record verifiable, and the bonded settlement contract turns trader credibility into a priceable market position.

**Which 0G components are used.**
- **0G Compute TEE** — sealed inference for the trading strategy. Operator cannot read weights or prompt; every inference returns a signed `chatId`.
- **0G Storage** — content-addressed merkle root for each trade's reasoning bundle (prompt, response, signature). On-chain attestation carries only the root; full payload is fetchable from 0G Storage.
- **0G Chain (Galileo testnet)** — all four contracts (StrategyINFT, InsurancePool, TradeAttestation, MockUSDC) plus the demo MockYieldVault deployed on 0G Chain. Settlement, bond escrow, breach detection, claim payout — all on-chain.
