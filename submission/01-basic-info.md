# 1. Basic Project Information

**Project Name:** Orichalcos

**Live demo:** https://orichalcos.vercel.app
**Repository:** https://github.com/amrrobb/orichalcos

**One-sentence description (≤ 30 words):**
> A promise-kept market for AI trading agents — bond, challenge, settle on chain. Traders bond against a drawdown promise sealed in 0G TEE; challengers stake against it; settlement is permissionless on 0G Chain.

**Short summary:**

**What the project does.**
Orichalcos is a **two-sided market where AI trading agents bond their own credibility**, and challengers take the other side. A trader (human or AI) declares an on-chain promise — for example, "I will stay within 20% drawdown across this epoch" — and posts a USDC bond to back it. The strategy runs sealed inside 0G Compute's TEE so the alpha never leaks. Trades execute as real perpetual fills on Hyperliquid testnet. Every fill is attested on-chain with the TEE `chatId`, a 0G Storage merkle root for the reasoning bundle, and the Hyperliquid L1 tx hash — so the track record is verifiable without revealing the strategy.

**Both sides risk capital, and both sides can win the other side's capital.** Challengers stake against the promise — if the trader keeps the promise, the trader earns the stake; if they break it, the bond pays the challenger. If the promise holds, the trader collects 60% of that stake (40% goes to LPs who underwrite the float). The trader's upside is no longer "reputation only" — they earn real yield for being right. The challenger's upside is no longer abstract exposure — they're taking a direct position on whether the bonded promise survives the epoch. LPs absorb the residual on breach and earn the steady stake flow. Settlement is permissionless: any wallet can call `markBreach()` and `settleEpoch()` on chain. No oracle, no admin, no off-chain arbiter.

**Which problem it solves.**
The AI trading bot economy is structurally untrustable. If a trader reveals their strategy to prove it works, the alpha decays. If they hide it, no allocator can verify the track record — and rugs follow. Existing "answers" are anon Twitter screenshots, opaque vaults, and trust-me-bro APRs. Orichalcos resolves the dilemma by separating the *strategy* (kept secret in TEE) from the *promise* (committed on-chain with a bond). The market then prices the promise: a trader with a long track record of kept promises commands higher allocator volume; a trader with a fresh strategy and a fat bond earns trust the only way it should be earned — by surviving epochs on chain.

**Which 0G components are used.**
- **0G Compute TEE** — sealed inference for the trading strategy. Operator cannot read weights or prompt; every inference returns a signed `chatId` recorded on-chain per trade.
- **0G Storage** — content-addressed merkle root for each trade's reasoning bundle (prompt, response, signature). On-chain attestation carries only the root; full payload is fetchable from 0G Storage.
- **0G Chain (Galileo testnet)** — five contracts deployed: `MockUSDC`, `StrategyINFT`, `InsurancePool`, `TradeAttestation`, `MockYieldVault`. Settlement, bond escrow, breach detection, and claim payout all happen on-chain. 50 / 50 Foundry tests pass; end-to-end lifecycle smoke at `agent/src/v3/integration-smoke.ts` re-verifies the full path against deployed contracts.
