# 1. Basic Project Information

**Project Name:** Orichalcos

**Tagline:** A promise-kept market for AI trading agents — bond, challenge, settle on chain.

**Track:** Track 2 — Agentic Trading Arena / Verifiable Finance

**Live demo:** https://orichalcos.vercel.app
**Repository:** https://github.com/amrrobb/orichalcos
**Pitch deck:** [`docs/pitch-deck.html`](../docs/pitch-deck.html) (open via `file://`)
**Demo video:** _<paste YouTube URL after upload>_

**0G mainnet contract address (canonical for HackQuest "0G mainnet contract" field):**
> `0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db` — StrategyINFT (ERC-7857 INFT) on 0G Aristotle mainnet (chainId 16661)
> Chainscan: https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db

---

**One-sentence description (≤ 30 words):**
> A promise-kept market for AI trading agents — traders bond USDC against a verifiable drawdown promise sealed in 0G TEE; challengers stake against it; settlement is permissionless on 0G mainnet.

---

## Short summary

### What the project does
Orichalcos is a **two-sided market where AI trading agents bond their own credibility, and challengers take the other side**. A trader declares an on-chain promise — for example, *"I will stay within 20% drawdown across this 24-hour epoch"* — in free text, and posts a USDC bond to back it. The promise is sealed inside **0G Compute TEE** (Qwen 2.5 VL 72B running in Intel TDX + H100); the encrypted soul is committed to **0G Storage**; the verified inference `chatId` is committed to the **INFT (ERC-7857)** on **0G Chain mainnet**. Trades execute as real perpetual fills on Hyperliquid testnet, attested on chain alongside the original TEE-signed wager.

### Both sides risk capital — both sides can earn
Challengers stake against the promise. If the trader **keeps** the promise, the stake splits 60% to the trader / 40% to the LP pool — the trader earns real yield for being right, not reputation alone. If the trader **breaks** the promise, the bond pays the challenger pro-rata; residual sweeps to LPs; the trader receives zero. Settlement is permissionless — `markBreach()` and `settleEpoch()` are open to any wallet. **No oracle. No admin. No off-chain arbiter.**

### Problem it solves
The AI trading bot economy is structurally untrustable. Reveal the strategy → alpha decays. Hide it → no challenger can verify the track record → rugs follow. Existing "answers" are anon Twitter PnL screenshots, opaque vaults, and trust-me-bro APRs. Orichalcos resolves the dilemma by separating the **strategy** (kept secret in TEE) from the **promise** (committed on-chain with a bond). The market then prices the promise: a trader with a track record of kept promises commands higher stake volume; a fresh trader with a fat bond earns trust the only way it should be earned — by surviving epochs on chain.

### 0G components integrated (4 of 5, end-to-end on mainnet)
- **0G Chain (Aristotle mainnet, chainId 16661)** — 5 contracts deployed + wired: `MockUSDC`, `StrategyINFT` (ERC-7857), `InsurancePool`, `TradeAttestation`, `MockYieldVault`. 50/50 Foundry tests pass; end-to-end lifecycle smoke verified on testnet.
- **0G INFT (ERC-7857)** — each wager is a transferable INFT. `Updated(tokenId, oldHash, newHash, updatedBy)` event matches the ERC-7857 spec; `sealedSoulRoot` + `metadataHash` are first-class fields, both pointing to real off-chain TEE+Storage data.
- **0G Storage** — per-wager encrypted soul uploaded via `@0gfoundation/0g-ts-sdk` to `https://indexer-storage-turbo.0g.ai`; merkle root committed to INFT at mint. Live evidence: token #1 root `0x8c295ccf1a0df5c9…`, token #2 root `0x157a2a3aa79419de…`.
- **0G Compute (TEE)** — every mint triggers one real inference on Qwen 2.5 VL 72B inside Intel TDX + H100 via `@0glabs/0g-serving-broker`. `broker.inference.processResponse(...)` verifies the chatId enclave signature; the verified chatId is committed to the INFT's `metadataHash` field. Live evidence: token #1 chatId `5740115b-4729-42ee…` ✓ TEE-valid, token #2 chatId `e976a328-b765-450d…` ✓ TEE-valid.

### Honest scope statement
- **What's real on v3:** the wager lifecycle (mint → bond → stake → breach detection → permissionless settlement), the TEE attestation at mint time, the encrypted soul on 0G Storage, the ERC-7857 INFT semantics. All five contracts deploy + wire on 0G mainnet.
- **What's deferred to v3.5:** per-trade TEE attestation (today's strategy runner uses a deterministic-seeded decision shim; the rewiring to call the same Compute pipeline per fill is the v3.5 milestone — `agent/src/v3/strategy-runner.ts:84` documents the swap). Idle-capital yield routing into MockYieldVault. Multi-dimensional promise (`minTrades + minPnL`). Per-strategy HL execution keys derived inside TEE.
- **What's deferred to v4:** Sealed challenger bids (TEE-batched buyPolicy clearing). TEE-priced stake (private trader history → signed `riskScoreBps`).

### Why the demo video uses testnet
The lifecycle Scenarios A/B/C (kept promise / breach payout / LP yield) were walked on Galileo testnet earlier in the build cycle, with real Hyperliquid testnet fills and real on-chain MockUSDC flows. Re-running them on mainnet would just duplicate the same math without adding new evidence. The submission addresses the "0G mainnet contract address" rule via the mainnet table above; the lifecycle proof is testnet + chainscan-galileo. Both are real, both are on chain. See `README.md` "Deployments" section for the full mainnet/testnet split.
