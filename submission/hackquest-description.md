# HackQuest form — Description field

Copy everything below the next `---` line (including markdown syntax) and paste into the **Description** field. HackQuest's editor renders the bold, headings, and bullets natively.

---

## What it does

Orichalcos is a **two-sided market where AI traders bond their own credibility, and challengers take the other side**. A trader writes a free-text drawdown promise — for example, *"I will stay within 20% drawdown across this 24-hour epoch"* — and posts a USDC bond to back it. The promise is encrypted to **0G Storage**, sealed and signed inside **0G Compute TEE** on Qwen 2.5 VL 72B (Intel TDX + H100), and committed to an **ERC-7857 INFT** on **0G Chain mainnet**. Trades fill on Hyperliquid testnet, attested on chain alongside the original TEE-signed wager.

## Both sides risk capital — both sides can earn

Challengers stake against the promise.

- If the trader **keeps** it, the stake splits **60% to the trader / 40% to the LP pool** — the trader earns real yield for being right, not reputation alone.
- If the trader **breaks** it, the bond pays the challenger; residual sweeps to LPs; the trader receives zero.

Settlement is **permissionless**: any wallet can call `markBreach()` and `settleEpoch()` on chain. **No oracle. No admin. No off-chain arbiter.**

## Problem it solves

The AI trading bot economy is structurally untrustable. Reveal the strategy → alpha decays. Hide it → no challenger can verify the track record → rugs follow. Existing "answers" are anon Twitter screenshots, opaque vaults, and trust-me-bro APRs.

Orichalcos separates the **strategy** (kept secret in TEE) from the **promise** (committed on-chain with a bond). The market then prices the promise: a trader with a record of kept promises commands higher stake volume; a fresh trader with a fat bond earns trust the only way it should be earned — by surviving epochs on chain.

## 0G components integrated (4 of 5, end-to-end on mainnet)

**0G Chain** (Aristotle mainnet, chainId 16661) — 5 contracts deployed and wired: `MockUSDC`, `StrategyINFT` (ERC-7857), `InsurancePool`, `TradeAttestation`, `MockYieldVault`. 50/50 Foundry tests pass.

**0G INFT (ERC-7857)** — each wager is a transferable INFT. The `Updated(tokenId, oldHash, newHash, updatedBy)` event matches the ERC-7857 spec; `sealedSoulRoot` and `metadataHash` are first-class fields, both pointing to real off-chain TEE + Storage data.

**0G Storage** — every wager's encrypted soul is uploaded via @0gfoundation/0g-ts-sdk to indexer-storage-turbo.0g.ai; the merkle root is committed to the INFT at mint time.

Live evidence:
- token #1 root: 0x8c295ccf1a0df5c994a2398e5b2a18ea939d56404c515fe3dba5050f000815a8
- token #2 root: 0x157a2a3aa79419de03da9497b6c71b2650f47cc760e21ee0948d4ec1a15dfb06

**0G Compute (TEE)** — every mint triggers a real inference call on Qwen 2.5 VL 72B inside Intel TDX + H100 via @0glabs/0g-serving-broker. broker.inference.processResponse(...) verifies the chatId enclave signature; the verified chatId is committed to the INFT's metadataHash field.

Live evidence:
- token #1 chatId: 5740115b-4729-42ee-b904-64abcbe86578 ✓ TEE-valid
- token #2 chatId: e976a328-b765-450d-bc98-9e7a1baa598b ✓ TEE-valid
