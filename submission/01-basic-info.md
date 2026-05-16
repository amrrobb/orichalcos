# 1. Basic Project Information

**Project Name:** Orichalcos

**Tagline:** A promise-kept market for AI trading agents — bond, challenge, settle on chain.

**Track:** Track 2 — Agentic Trading Arena / Verifiable Finance

**Live demo:** https://orichalcos.vercel.app
**Repository:** https://github.com/amrrobb/orichalcos
**Pitch deck:** [`docs/pitch-deck.html`](../docs/pitch-deck.html) (open via `file://`)
**Demo video:** _<paste YouTube URL after upload>_

**0G mainnet contract address (canonical for the HackQuest "0G mainnet contract" field):**
> StrategyINFT (ERC-7857) — `0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db`
> Chainscan: https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db

---

## One-sentence description (≤ 30 words)

> Orichalcos is a promise-kept market for AI trading agents: traders bond USDC against a drawdown promise sealed in 0G TEE, challengers stake against it, settlement is permissionless on 0G mainnet.

---

## Short summary

### What it does

Orichalcos is a **two-sided market where AI traders bond their own credibility, and challengers take the other side**. A trader writes a free-text promise — for example *"I will stay within 20% drawdown across this 24-hour epoch"* — and posts a USDC bond to back it. The promise is encrypted to **0G Storage**, sealed and signed inside **0G Compute TEE** (Qwen 2.5 VL 72B on Intel TDX + H100), and committed to an **ERC-7857 INFT** on **0G Chain mainnet**. Trades fill on Hyperliquid testnet, attested on chain alongside the original TEE-signed wager.

### Both sides risk capital — both sides can earn

Challengers stake against the promise. If the trader **keeps** it, the stake splits 60% to the trader / 40% to the LP pool — the trader earns real yield for being right, not reputation alone. If the trader **breaks** it, the bond pays the challenger pro-rata; residual sweeps to LPs; the trader receives zero. Settlement is permissionless — `markBreach()` and `settleEpoch()` are open to any wallet. **No oracle. No admin. No off-chain arbiter.**

### Problem solved

The AI trading bot economy is structurally untrustable. Reveal the strategy → alpha decays. Hide it → nobody can verify the track record → rugs follow. Existing "answers" are anon Twitter screenshots, opaque vaults, and trust-me-bro APRs. Orichalcos separates the **strategy** (kept secret in TEE) from the **promise** (committed on-chain with a bond). The market then prices the promise: a trader with a track record of kept promises commands higher stake volume; a fresh trader with a fat bond earns trust the only way it should be earned — by surviving epochs on chain.

### 0G components integrated (4 of 5, end-to-end on mainnet)

- **0G Chain** (Aristotle mainnet, chainId 16661) — 5 contracts deployed and wired: MockUSDC, StrategyINFT (ERC-7857), InsurancePool, TradeAttestation, MockYieldVault. 50/50 Foundry tests pass.
- **0G INFT (ERC-7857)** — each wager is a transferable INFT. The `Updated(tokenId, oldHash, newHash, updatedBy)` event matches the ERC-7857 spec; `sealedSoulRoot` and `metadataHash` are first-class fields, both pointing to real off-chain TEE + Storage data.
- **0G Storage** — every wager's encrypted soul is uploaded via `@0gfoundation/0g-ts-sdk` to `indexer-storage-turbo.0g.ai`; the merkle root is committed to the INFT at mint time. Live evidence: token #1 root `0x8c295ccf1a0df5c9…`, token #2 root `0x157a2a3aa79419de…`.
- **0G Compute (TEE)** — every mint triggers a real inference call on Qwen 2.5 VL 72B inside Intel TDX + H100 via `@0glabs/0g-serving-broker`. `broker.inference.processResponse(...)` verifies the chatId enclave signature; the verified chatId is committed to the INFT's `metadataHash`. Live evidence: token #1 chatId `5740115b-4729-42ee…` ✓ TEE-valid, token #2 chatId `e976a328-b765-450d…` ✓ TEE-valid.

### Why both networks appear in the submission

The mainnet deployment (chainId 16661) is the canonical "0G mainnet contract address" referenced above — five contracts wired and verified, with TEE-attested wagers minted on chain. The lifecycle demo scenarios (a kept-promise settle with 60/40 split, a breach payout, an LP deposit/withdraw) were walked on 0G Galileo testnet earlier in the build cycle because Hyperliquid is the execution venue and re-running the full sequence on mainnet duplicates the same on-chain math without adding new evidence. Both networks carry real on-chain activity; the README "Deployments" section has the full table for each.
