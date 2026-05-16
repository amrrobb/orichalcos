# 1. Basic Project Information

**Project Name:** Orichalcos

**Live demo:** https://orichalcos.vercel.app
**Repository:** https://github.com/amrrobb/orichalcos

**One-sentence description (≤ 30 words, currently 29):**
> A promise-keeping market for autonomous AI trading agents — traders bond against a drawdown promise sealed in 0G TEE, allocators take the other side, settlement is permissionless on 0G Chain.

**Short summary:**

**What the project does.**
Orichalcos is a **two-sided market where AI trading agents bond their own credibility**, and allocators take the other side. A trader (human or AI) declares an on-chain promise — for example, "I will stay within 20% drawdown across this epoch" — and posts a USDC bond to back it. The strategy runs sealed inside 0G Compute's TEE so the alpha never leaks. Trades execute as real perpetual fills on Hyperliquid testnet. Every fill is attested on-chain with the TEE `chatId`, a 0G Storage merkle root for the reasoning bundle, and the Hyperliquid L1 tx hash — so the track record is verifiable without revealing the strategy.

**Both sides risk capital, and both sides can win the other side's capital.** Allocators stake a premium that pays out from the trader's bond if the promise breaks. If the promise holds, the trader collects 60% of that premium (40% goes to LPs who underwrite the float). The trader's upside is no longer "reputation only" — they earn real yield for being right. The allocator's upside is no longer "insurance on exposure they don't have" — they're taking a position on whether the bonded promise survives the epoch. LPs absorb the residual on breach and earn the steady premium flow. Settlement is permissionless: any wallet can call `markBreach()` and `settleEpoch()` on chain. No oracle, no admin, no off-chain arbiter.

**Which problem it solves.**
The AI trading bot economy is structurally untrustable. If a trader reveals their strategy to prove it works, the alpha decays. If they hide it, no allocator can verify the track record — and rugs follow. Existing "answers" are anon Twitter screenshots, opaque vaults, and trust-me-bro APRs. Orichalcos resolves the dilemma by separating the *strategy* (kept secret in TEE) from the *promise* (committed on-chain with a bond). The market then prices the promise: a trader with a long track record of kept promises commands higher allocator volume; a trader with a fresh strategy and a fat bond earns trust the only way it should be earned — by surviving epochs on chain.

**Why this is a market, not insurance.** v1 of this idea was framed as insurance: allocator pays premium, trader has no upside on success. We pivoted to symmetric settlement because the v1 economics didn't make sense — a rational trader has no reason to bond capital with zero upside. v2's 60/40 split (trader / LP on a kept promise) creates the bilateral economic loop that turns the protocol into an actual market for trader reputation.

**Which 0G components are used.**
- **0G Compute TEE** — sealed inference for the trading strategy. Operator cannot read weights or prompt; every inference returns a signed `chatId` recorded on-chain per trade.
- **0G Storage** — content-addressed merkle root for each trade's reasoning bundle (prompt, response, signature). On-chain attestation carries only the root; full payload is fetchable from 0G Storage.
- **0G Chain (Galileo testnet)** — five contracts deployed: `MockUSDC`, `StrategyINFT`, `InsurancePool`, `TradeAttestation`, and the demo-grade `MockYieldVault`. Settlement, bond escrow, breach detection, claim payout, and idle-LP yield simulation all happen on-chain. 50 / 50 Foundry tests pass; end-to-end lifecycle smoke at `agent/src/v3/integration-smoke.ts` re-verifiable any time.
