# Orichalcos

**A promise-kept market for AI trading agents.**

*Strategies stay sealed. Capital stays safe. Every trade is verifiable.*

Built for **0G APAC Hackathon — Track 2 (Agentic Trading Arena / Verifiable Finance)** — May 2026.

**Live on 0G Mainnet** (Aristotle, chainId 16661): [StrategyINFT `0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db`](https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db). 4 of 5 0G components wired end-to-end (Chain · INFT · Storage · Compute TEE).

| | Mainnet | Live URL | Demo video |
|---|---|---|---|
| 🔗 | [chainscan.0g.ai/…56db](https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db) | https://orichalcos.vercel.app | _<paste YouTube URL>_ |

---

> **On the contract names.** The deployed contracts are named `InsurancePool` / `buyPolicy` / `Policy` for legacy reasons — the v3 mechanism was originally scoped as an insurance market on May 11. The mechanism that actually shipped is a **promise-kept market**: a trader bonds USDC against a verifiable promise; challengers stake against the promise; if the trader keeps it, the trader earns the stake; if they break it, the bond pays the challenger. Same on-chain artifact, sharper framing. The contract names are kept as-is because the addresses are deployed, verified, and the entire submission's on-chain proof depends on them.

---

## The dilemma we solve

Every autonomous AI strategy sits on one of two horns:

- **Reveal the strategy** ⇒ alpha decays on contact. Open-source bots get front-run; "alpha" Discords are dead before retail can copy. Edge that's legible is edge that's gone.
- **Hide the strategy** ⇒ challengers can't tell a rug from a real edge. Anon vaults rug. Screenshots can't be audited. Capital can't price a black-box claim.

Orichalcos is a primitive for **verifiable performance without revealed alpha**: a promise-keeping market built around Sealed Inference and TEE-based execution, with permissionless settlement on 0G Chain.

## Three roles, one protocol

| Role | What they do | Stake | Reward |
|---|---|---|---|
| **Trader** | Mints a Strategy Agent (INFT). Posts a USDC bond against a drawdown promise. Strategy runs sealed inside 0G Compute TEE; trades fill on **Hyperliquid testnet**. | Bond at risk | Keeps trading P&L. Bond returned on a kept promise + **60% of the stake**. Bond fully slashed on breach. |
| **Challenger** | Browses Strategy Agents by verified on-chain track record. Places a stake against the promise that pays out from the bond if the agent breaks its drawdown promise. | Stake up-front | Claim payout from the bond on breach; expires worthless on kept promise. |
| **LP** | Deposits USDC into the protocol pool — the underwriting capacity provider. | Pool deposit | Stake yield (40% on kept promise) + residual from slashed bonds. |

When a strategy breaches its drawdown threshold, the protocol **enforces the rules on-chain** — bond pays open stakes first, residual sweeps to LPs, trader receives zero. No admin. No multi-sig. No human arbiter.

## Economic simulation — both sides earn

This is a two-sided wager, not insurance. **Trader and challenger each have a path to recurring income**, paid by each other. LPs collect a yield slice without taking a directional position on any trader.

Numbers below are computed exactly the way the contract computes them (`premiumBps = 1250`, kept-promise split `60/40`, bond pays claims first-come-first-served, residual sweeps to LP). Currency: USDC.

### Sim 1 · One trader, one challenger, kept promise

This is **Scenario A** that ran live on chain (settle tx [`0x037c19ac6c…`](https://chainscan-galileo.0g.ai/tx/0x037c19ac6c14591ba61885dfd59b584565a31344682dbe084660f71a5a001d0a)). Same numbers, here as a math reference.

| Inputs |
|---|
| Trader bond: **100 USDC** · Drawdown promise: 20% (floor at 80) · Epoch: 10 min |
| Challenger #1 claim size: **50 USDC** → stake = 12.5% × 50 = **6.25 USDC** paid up-front |

Outcome: **trader keeps the promise** (equity ends at 112).

| Role | P&L | Reasoning |
|---|---|---|
| Trader | **+3.75 USDC** | Bond returned (100). Earned 60% of the 6.25 stake. Their fee for signing a real, verifiable promise the market doubted. |
| Challenger | **−6.25 USDC** | Staked against a trader who delivered. Lost the wager. |
| LP | **+2.50 USDC** | 40% of the stake. Principal untouched. |

### Sim 2 · One trader, **three challengers**, kept promise — *the recurring-income case*

This is the case the deck slide 5 highlights: **as more challengers doubt a trader, the trader's reward for being right scales linearly.**

| Inputs |
|---|
| Trader bond: **100 USDC** |
| Challenger #1 claim 40 → stake 5.00 |
| Challenger #2 claim 30 → stake 3.75 |
| Challenger #3 claim 20 → stake 2.50 |
| Total claims posted: 90 of 100 bond (90% utilization) · Total stakes pooled: **11.25 USDC** |

Outcome: **trader keeps the promise.**

| Role | P&L | Reasoning |
|---|---|---|
| Trader | **+6.75 USDC** | Bond returned. Earned 60% of every challenger's stake. **One epoch, three skeptics, +6.75% on bond. Stack epochs → recurring income from being correct.** |
| Challenger #1 | −5.00 USDC | Lost their wager. |
| Challenger #2 | −3.75 USDC | Lost their wager. |
| Challenger #3 | −2.50 USDC | Lost their wager. |
| LP | **+4.50 USDC** | 40% of every stake. Principal untouched. |

The trader earned **+6.75 USDC per epoch on a 100 USDC bond — 6.75% per epoch — just by keeping a verifiable promise.** A trader who keeps 4 such 10-minute epochs in a row earns ~27% on bond in 40 minutes, paid by skeptics who priced them wrong. That's *the trader yield*. It does not come from the LP pool. It comes from the *cost of being wrong about the trader*.

### Sim 3 · One trader, three challengers, **breach** — *the challenger payout case*

Same setup as Sim 2, but the trader broke the promise.

| Role | P&L | Reasoning |
|---|---|---|
| Trader | **−100 USDC** | Full bond slashed. Earned 0. Broke a real, verifiable promise. |
| Challenger #1 | **+35.00 USDC** | Claim 40 paid in full from bond. Stake 5.00 was the cost of being right. |
| Challenger #2 | **+26.25 USDC** | Claim 30 paid in full. Stake 3.75 cost. |
| Challenger #3 | **+17.50 USDC** | Claim 20 paid in full. Stake 2.50 cost. |
| LP | **+21.25 USDC** | The 11.25 stake pool + 10 USDC bond residual (bond was 100, claims took 90, 10 left). |

### Sim 4 · Oversubscription is **impossible by design**

If a fourth challenger tries to add a 15 USDC claim (total 90+15 = 105 > bond 100), `buyPolicy()` reverts `CoverageExceedsBond`. The contract enforces `Σ maxClaim ≤ bondAmount` at every policy purchase, which is why **LPs bear zero principal risk in v3** — the bond is always enough to pay every open challenger in full.

### Conservation check (all four sims)

Sum across all roles = 0 in every scenario. No protocol fee skimmed. No external subsidy. Every USDC anyone earned was a USDC someone else lost — that's what makes this a verifiable wager rather than yield-farming.

### One sentence to remember

> **Both the trader and the challenger earn yield from being right.** The trader earns from skeptics who doubt them; the challenger earns from traders who break promises. LPs earn from total wager volume. The protocol skims nothing.

## Track 2 alignment

Orichalcos is built directly against the Track 2 — Agentic Trading Arena vocabulary:

- **AI-driven perpetual strategy agents.** Every Strategy Agent INFT is one — a self-contained, sealed AI trader running real perpetual fills.
- **Sealed Inference and TEE-based execution.** Weights live encrypted on 0G Storage; decryption + inference happen only inside 0G Compute TEE.
- **Front-running mitigation.** There is nothing to front-run: signals never leave the enclave, only signed fills.
- **Verifiable finance.** Every trade carries a TEE chatId + 0G Storage merkle root + Hyperliquid order ID, committed on 0G Chain.

## Why this is fair

Three contract-level invariants close the obvious attacks:

- **Traders cannot stake against themselves.** `buyPolicy()` reverts with `AllocatorIsTrader` if `msg.sender == ownerOf(strategyId)`. A trader can't take both sides of their own promise.
- **A trader's bond is always ≥ the challenger's maximum claim.** `buyPolicy()` reverts with `CoverageExceedsBond` if requested claim size exceeds available bond headroom. LPs bear no principal risk in v3 — they are an underwriting layer, not a backstop.
- **Settlement is permissionless.** `markBreach()` and `settleEpoch()` are open to any wallet. The trader, a challenger, an LP, or a passing keeper can trigger settlement once the on-chain equity crosses the threshold. No oracle. No multisig. No special role.

## Roadmap

- **v3 (this submission).** Bond + policy + permissionless settlement. The strategy itself is sealed inside 0G Compute TEE. On a kept promise, premium splits **60% to the trader, 40% to the LP pool** — the trader's reward for keeping a real promise, the pool's reward for underwriting the bond capacity that made the policy issuable in the first place. On breach, the bond pays open policies and the residual sweeps to LPs.
- **v3.5 — wake the pool, enrich the promise.** Two contract changes batched into one milestone — both deferred from this submission because v3's five addresses are the verified demo surface.
  - **Idle wager capital earns yield.** Three pools of USDC sit inside `InsurancePool` between settlements: LP deposits, active-but-unresolved stake premiums, and the contractually-committed bond capacity. The total balance that the pool *actually holds* (LP deposits + active stakes) sits at 0% APY today. v3.5 enforces an on-chain invariant `liquidityBuffer ≥ Σ open maxClaim` and routes everything above the buffer into `MockYieldVault` (already deployed at `0x5c16…2fE1`, currently unwired). On `settleClaim` and LP `withdraw` the pool auto-pulls from the vault first if cash is short — synchronous, no keeper, no oracle. **The vault yield accrues to `totalAssets`, increasing LP share value pro-rata** — it's the *infrastructure rent the protocol pays its float providers*, uncorrelated with any specific trader's win/loss. Traders still earn their 60% stake split; challengers still claim from the bond on breach. LP yield becomes three uncorrelated streams: stake share + breach residual + vault yield on idle capital. *Minimum demo:* during Sim 2 above (1 trader, 3 challengers, 90 USDC committed against 1,011 USDC pool), v3.5 routes the 921 USDC surplus into MockYieldVault. Pool earns 8% APR on 91% of its balance while the wager is still live. *Settlement test:* breach the trader; settleClaim auto-pulls 90 USDC back from vault to pay challengers. ~60 LOC: a buffer check, a `_sweepIdle()` admin function, and `_pullFromVaultIfNeeded()` in settleClaim and withdraw.
  - **Multi-dimensional promise.** Today the only verifiable promise is `maxDrawdownBps`. v3.5 adds two more dimensions to `StrategyData` so a trader can promise *"drawdown ≤ Y% **and** at least N fills **and** at least X% net PnL"* — a three-tuple any one of which, if broken, triggers breach. `markBreach` becomes `markBreach(reason)` where reason ∈ {Drawdown, MinTrades, MinPnL}; `isInBreach` returns the failing dimension(s). The richer promise is what justifies a higher premium and gives allocators more legible underwriting surface. *Minimum demo:* mint a Strategy Agent that promises "drawdown ≤ 20% AND ≥ 10 trades AND ≥ 5% net PnL", let it underdeliver on `minTrades`, challenger claims paid even though equity stayed above the drawdown floor. ~60 LOC + breach-reason enum.
  - **Per-strategy HL execution keys derived inside TEE.** Today v3 requires the trader to use the *same wallet identity* on both 0G (for bond/promise/INFT ownership) and Hyperliquid testnet (for fills) — because no on-chain proof binds an HL fill hash to a specific INFT, sharing one HL execution wallet across multiple INFTs would let an operator mis-allocate fills (exploit: claim fill X belonged to strategy Y when it actually fed strategy Z, contaminating equity attestations and breach triggers). The 0G↔HL **wallet-pairing** is what makes the trust model honest today — and what limits the protocol to traders willing to run two wallets in lockstep. v3.5 closes the gap by minting an **HL key inside 0G Compute TEE** per strategy at `startEpoch`. The enclave holds the HL private key; only the enclave can sign HL fills for that strategy; the TEE attestation binds every fill hash to the originating tokenId. A trader only needs an EVM wallet; the HL identity is protocol-derived and unforgeable. *Minimum demo:* fresh trader wallet calls `startEpoch`, the TEE returns a derived HL address (deterministic from tokenId + enclave secret), trader funds that HL address from any faucet/wallet, fills land on HL with the enclave's signature, on-chain attestation links each fill to the strategy. ~120 LOC across the enclave handler + a `pubKey/attestation` field on `StrategyData`.
- **v4 — TEE at the economic edges.** v3 seals the *strategy*. v4 extends sealed execution to the two seams where Orichalcos would bleed value at production scale.
  - **(1) Sealed allocator bids.** Today every `buyPolicy` is a public mempool tx — whale-sized policies signal the market and invite other allocators to front-run the next round of pricing. v4 routes allocator intents through a TEE that batches, clears, and reveals only the aggregated price + per-allocator allocations. The trader side is unchanged. *Minimum demo:* TEE accepts encrypted bid intents, emits a clearing price after a window, contract pulls premium per allocator. Real on-chain txs with MockUSDC; encrypted payload is the only mocked part. Single epoch, two allocator wallets, observable mempool footprint reduction.
  - **(2) TEE-priced premium.** The flat 12.5% premium doesn't reflect trader skill. v4 lets a trader optionally submit private trading history into a TEE that emits a signed risk score; the protocol prices per-trader premium BPS off that score. History never leaves the enclave; the score does. First-epoch traders default to the flat rate; veterans earn pricing power without revealing why. *Minimum demo:* a CLI submits a real (testnet) wallet's trade history to a 0G Compute TEE handler, gets back a signed `riskScoreBps`, calls `InsurancePool.setTraderPremium(token, score, attestation)` which verifies the signature on-chain and applies the discounted rate. Real txs with MockUSDC; one trader, one allocator, premium BPS visibly different from the default.
- **Beyond v4.** A first-class **AI-agent allocator** that buys policies across Strategy Agents the way a fund-of-funds buys exposure — sealed reasoning, on-chain portfolio.

> *"Orichalcos is built for the emerging class of pseudonymous AI traders who want to monetize their bot's track record without revealing the strategy, and the capital allocators who want exposure without the rug risk. This category is small today — maybe a few thousand people — but it's the same shape of problem Nexus Mutual solved for smart contract risk in 2018, before that became a $1B category. We're building the protocol the category needs before the category exists."*

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│ FRONTEND (Next.js 16 on Vercel)                                  │
│  • /strategies/[id] — sparkline + trade modal + breach banner    │
│  • /protocol — LP deposit + active strategies grid              │
│  • /strategies/[id]/insure — buyPolicy flow                     │
└──────┬─────────────────────────────────┬───────────────────────┘
       │                                 │
┌──────▼────────────────────┐  ┌─────────▼──────────────────────┐
│ 0G LAYER (verifiability)   │  │ HYPERLIQUID TESTNET (execution)│
│                            │  │                                │
│  Compute TEE ──────────────┼──┤ Real perpetual DEX             │
│   (sealed wager promise)   │  │ Real testnet order ids         │
│  Storage                   │  │  https://api.hyperliquid-      │
│   (encrypted soul +        │  │       testnet.xyz              │
│    trade attestation blobs)│◀─┤                                │
│  Chain — Aristotle mainnet │  │                                │
│   (chainId 16661):         │  │                                │
│   StrategyINFT (ERC-7857)  │  │                                │
│   InsurancePool            │  │                                │
│   TradeAttestation         │  │                                │
│   MockUSDC + MockYieldVault│  │                                │
│  4 of 5 0G components used │  │                                │
└────────────────────────────┘  └────────────────────────────────┘
```

## 0G modules used (4 of 5)

| Module | What we use it for | v3 status |
|---|---|---|
| **0G Chain (Aristotle mainnet, chainId 16661)** | 5 deployed contracts (`StrategyINFT`, `InsurancePool`, `TradeAttestation`, `MockUSDC`, `MockYieldVault`). Every mint, startEpoch, buyPolicy, markBreach, settleEpoch is a real on-chain tx. 50/50 Foundry tests pass. | ✅ Fully wired |
| **0G INFT (ERC-7857)** | Each wager is an INFT. `Updated(tokenId, oldHash, newHash, updatedBy)` event matches the ERC-7857 spec; `metadataHash` and `sealedSoulRoot` are first-class fields, both pointing to real off-chain TEE + Storage data. Transferable, track record bound. | ✅ Fully wired |
| **0G Storage** | Per-wager encrypted soul (the trader's verbatim free-text promise) uploaded to 0G Storage mainnet at mint time via `@0gfoundation/0g-ts-sdk`. The returned merkle root is committed to the INFT's `sealedSoulRoot` field. Dashboard's `/api/tell` route downloads + decrypts these blobs server-side. | ✅ Fully wired (per mint) |
| **0G Compute (TEE)** | Every mint triggers one TEE-attested inference call against Qwen 2.5 VL 72B running inside Intel TDX + H100 via `@0glabs/0g-serving-broker`. The encrypted soul decrypts only inside the enclave; the response chatId is verified via `broker.inference.processResponse(...)` and committed to the INFT's `metadataHash`. **Live mainnet evidence:** token [#1](https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db) chatId `5740115b-4729-42ee…` ✓, token #2 chatId `e976a328-b765-450d…` ✓. Entry point: `agent/src/v3/wager-tee-mint.ts` + `dashboard/src/app/api/mint-wager/route.ts`. | ✅ Wired (per mint); per-trade attestation is v3.5 |
| 0G DA | Not used; commitment layer covered by Storage merkle roots. | — |

**Honest scope statement.** In v3, the *opening of each wager* is real-TEE-attested — the sealed soul, the inference, the verified chatId all flow end-to-end through 0G's stack. The *per-trade* attestation surface in `TradeAttestation.recordTrade(tokenId, chatId, storageRoot, hlTxHash, ...)` is fully on-chain, but the off-chain decisions feeding it (which `chatId`/`storageRoot` to write) currently use a deterministic-seeded runner (`agent/src/v3/strategy-runner.ts:mockDecide`) rather than a fresh TEE inference per fill. v3.5 swaps that runner for per-trade TEE inference using the same pipeline that's already proven end-to-end at mint time.

## Smart contracts

Five contracts on mainnet. State variables + external function signatures only:

### `StrategyINFT.sol` — ERC-721 + ERC-7857 INFT with inlined per-wager vault
- Each wager is one INFT
- Vault state lives in the token: `startingBond`, `bondAmount`, `maxDrawdownBps`, `currentEquity`, `status` (Idle/Active/Breached/Settled)
- Epoch lifecycle: `startEpoch` → trades record via TradeAttestation → `markBreach` (anyone) → `settleEpoch` (anyone)
- `sealedSoulRoot` field → real 0G Storage merkle root for the encrypted promise
- `metadataHash` field → `keccak256(chatId, inputHash, outputHash)` of the verified TEE attestation

### `InsurancePool.sol` — global stake pool (ERC-4626-lite)
- Challengers pay stake for a claim on a trader's bond. `buyPolicy(strategyId, maxClaim)` blocks self-staking
- LPs deposit USDC, earn stake yield (40% of every kept-promise stake) + breach residuals
- v3 invariant: `Σ open maxClaim ≤ bondAmount` — LPs bear **zero principal risk**
- *(Contract names `InsurancePool` / `buyPolicy` / `Policy` are legacy from the v3 build — see top-of-README note. Mechanism is a promise-kept wager market, not insurance.)*

### `TradeAttestation.sol` — append-only TEE-attested trade log
- Operator-only `recordTrade(strategyId, chatId, storageRoot, hyperliquidTxHash, pnlDelta, equityAfter)`
- Mirrors equity into StrategyINFT in the same tx
- Breach detection lives in StrategyINFT, fed by these equity updates

### `MockUSDC.sol` — permissionless ERC-20 used as stable on testnet AND mainnet
- `mint(address, uint256)` is permissionless — anyone can faucet up for demo
- Same contract bytecode deployed at the testnet + mainnet addresses; chain disambiguates

### `MockYieldVault.sol` — demo-grade simulated 8% APR vault, currently unwired (v3.5 milestone)
- Deployed at mainnet `0xA7289d4f49E01c3aDEb5987091B23c67a0aa2C02`
- v3.5 wires it into InsurancePool for idle-capital routing — see roadmap

## Deployments

### 0G Mainnet (Aristotle, chainId 16661) — submission deployments

| Contract | Mainnet address | Chainscan |
|---|---|---|
| **MockUSDC** | `0x998Bbb06e6313FE48BD040B4247aeE67bD46fE52` | [view](https://chainscan.0g.ai/address/0x998Bbb06e6313FE48BD040B4247aeE67bD46fE52) |
| **StrategyINFT** | `0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db` | [view](https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db) |
| **InsurancePool** | `0xE61Cb4adB78f4aD4D36cf2A262532Ed3Ba9E8941` | [view](https://chainscan.0g.ai/address/0xE61Cb4adB78f4aD4D36cf2A262532Ed3Ba9E8941) |
| **TradeAttestation** | `0x6F677989784Cc214E4Ee02257Fad3fc4374dD383` | [view](https://chainscan.0g.ai/address/0x6F677989784Cc214E4Ee02257Fad3fc4374dD383) |
| **MockYieldVault** | `0xA7289d4f49E01c3aDEb5987091B23c67a0aa2C02` | [view](https://chainscan.0g.ai/address/0xA7289d4f49E01c3aDEb5987091B23c67a0aa2C02) |

**RPC:** `https://evmrpc.0g.ai` · **Explorer:** https://chainscan.0g.ai · **Storage indexer:** `https://indexer-storage-turbo.0g.ai` · **Compute provider (Qwen 2.5 VL 72B):** `0x4415ef5CBb415347bb18493af7cE01f225Fc0868`

**Deployer:** `0x1E7EC0af660e34Aa6d5b990D8a6aFB62A3fCf801` · See `deployments-v3-mainnet.json` for the full wiring map.

**First TEE-attested wagers on mainnet (live evidence of 4-of-5 0G integration):**

| tokenId | archetype | sealedSoulRoot (real 0G Storage) | chatId (real 0G Compute) | mint tx |
|---|---|---|---|---|
| **#1** | Sharp | `0x8c295ccf1a0df5c9…` | `5740115b-4729-42ee…` ✓ TEE-valid | [`0xf5162e30d01f15f4…`](https://chainscan.0g.ai/tx/0xf5162e30d01f15f4f0d8) |
| **#2** | Bold | `0x157a2a3aa79419de…` | `e976a328-b765-450d…` ✓ TEE-valid | [`0x36382b3dd607f303…`](https://chainscan.0g.ai/tx/0x36382b3dd607f303b330a2b75756be4576739533d52cec59532a191aa790ebd8) |

### 0G Galileo Testnet (chainId 16602) — lifecycle demo + recorded video

| Contract | Address |
|---|---|
| MockUSDC | `0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7` |
| StrategyINFT | `0x782CBD5313E3b99d9C94e4f5197B81a432cdE621` |
| InsurancePool | `0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57` |
| TradeAttestation | `0x892872eF9490683604EE53B90c5c21e1B4E6eeda` |
| MockYieldVault | `0x5c16FeF4d883A489525469e5f61B222328022fE1` |

Explorer: https://chainscan-galileo.0g.ai · See `deployments-v3-galileo.json` for the full wiring map.

> **Why both networks.** Mainnet contracts are the canonical deployment that satisfies the hackathon's "0G mainnet contract address" requirement; all 5 contracts deploy + wire successfully on 0G Aristotle with real TEE attestation per mint. The lifecycle demo (Scenarios A/B/C — kept promise, breach payout, LP deposit/withdraw) was walked on Galileo testnet earlier in the build cycle because Hyperliquid testnet is the execution venue and re-running the full sequence on mainnet would just duplicate the same on-chain math without adding new evidence. Both are real, both are on chain.

## Demo strategies on chain

Eight strategies are minted on Galileo from this submission cycle. Strategies #5–#8 carry **real Hyperliquid L1 transaction hashes** per fill — directly clickable on [Hyperliquid's testnet explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d). Strategies #1–#3 are earlier mints with legacy oid encoding; #4 was settled.

| Token | Archetype | Status | Equity | Trades | Hash encoding |
|---|---|---|---|---|---|
| #1 | Bold / Momentum | Active | $1,135 (+13.5%) | 10 | Legacy oid |
| #2 | Patient / Mean-Reversion | Active | $1,055 (+5.5%) | 10 | Legacy oid |
| #3 | Sharp / Microstructure | Active | $1,041 (+4.1%) | 10 | Legacy oid |
| #4 | Stoic / Grid | Idle (settled) | — | — | Legacy oid |
| #5 | Bold / Momentum | Active | $1,135 (+13.5%) | 10 | **Real L1 hash** ✓ |
| #6 | Patient / Mean-Reversion | Active | $1,055 (+5.5%) | 10 | **Real L1 hash** ✓ |
| #7 | Sharp / Microstructure | Active | $1,041 (+4.1%) | 10 | **Real L1 hash** ✓ |
| **#8** | **Stoic / Grid** | **Breached** | **$790 (−21%)** | **11** | **Real L1 hash** ✓ |

Strategy **#8** is the canonical breach demo. It already received `markBreach()` and is ready to settle. The dashboard's slug resolver lands `/strategies/breached` on the newest breached strategy automatically — judges can open that URL directly without remembering token IDs.

## Live demo scenarios (full lifecycle, real txs)

Three end-to-end lifecycles were walked on Galileo on 2026-05-16. Every trade fill on Hyperliquid is a **real testnet order** (per-fill hashes below); every USDC flow is a **real on-chain MockUSDC transfer**. The only thing mocked is the TEE *decision* upstream of the fill (the same v3.1 scope already documented elsewhere). Wallets: trader `0x77C0…8812`, allocator (derived) `0x2CE7…5Ebd`, LP (derived) `0x06C0…cE58`.

### Scenario A — kept promise (clean settle, 60/40 split) · tokenId 11

Trader minted a Sharp strategy, posted a 100 USDC bond against a 20% drawdown over a 600-second epoch. Three real Hyperliquid testnet fills (+5, +3, +4 USDC) drove equity to 112 USDC — comfortably above the 80 USDC threshold. Allocator paid 6.25 USDC premium for 50 USDC of coverage. At epoch end, `settleEpoch` triggered `expirePolicy`: **premiumToLP=2.50 USDC, premiumToTrader=3.75 USDC** (60/40 split confirmed). Trader received bond (100) + 3.75 premium = **103.75 USDC**. Allocator received 0 — policy expired worthless, as designed.

| Step | 0G Galileo tx |
|---|---|
| mint Sharp strategy | [0xdb92c8051f…](https://chainscan-galileo.0g.ai/tx/0xdb92c8051faa46233434e629d94e0fd651a496342c384ad53ccf7f0c5f9110a2) |
| approve(StrategyINFT) | [0x691acb8eb8…](https://chainscan-galileo.0g.ai/tx/0x691acb8eb818d9cb786b2a26a684839544760630bb78a1184a8cee57b38b64fd) |
| startEpoch (600s, 20%) | [0x1776bc2428…](https://chainscan-galileo.0g.ai/tx/0x1776bc24287a54209639cb6fcd38c4532957a6908469ef0276c49bf9bceb2657) |
| recordTrade #1 Δ+5 | [0x4f3dafbb2f…](https://chainscan-galileo.0g.ai/tx/0x4f3dafbb2f5e1fd2c62e5bd86abdd8173245b7c879ce61491eb5a8a530b0d1c9) |
| recordTrade #2 Δ+3 | [0x8984549fd6…](https://chainscan-galileo.0g.ai/tx/0x8984549fd6b5e904b19a7448259c693c0ddb6cbf50c9da954e87bc2291e5acf3) |
| recordTrade #3 Δ+4 | [0x782733a500…](https://chainscan-galileo.0g.ai/tx/0x782733a500c0c91f85525f78a48bad4bc33acdba7c2378aa6d1ab9ca2fe608d5) |
| approve(pool) allocator | [0x6c815c6522…](https://chainscan-galileo.0g.ai/tx/0x6c815c65228232570e38df03ec2bdf21a223dafed41fc43ce7a6670d8471217b) |
| buyPolicy policyId=3 | [0xce20c2b606…](https://chainscan-galileo.0g.ai/tx/0xce20c2b606958ee6f71fb12b7652baf628008435a3a4390d34f70c67e1b194f5) |
| **settleEpoch (kept, 60/40)** | [0x037c19ac6c…](https://chainscan-galileo.0g.ai/tx/0x037c19ac6c14591ba61885dfd59b584565a31344682dbe084660f71a5a001d0a) |

Real Hyperliquid testnet fills (per-trade L1 hash, all LONG $12 BTC):
- trade #1: [0x4bcd344570…](https://app.hyperliquid-testnet.xyz/explorer/tx/0x4bcd344570af4ed04d460421dbcb07010f004c2b0ba26da2ef95df982fa328ba)
- trade #2: [0x7eefd3e1a8…](https://app.hyperliquid-testnet.xyz/explorer/tx/0x7eefd3e1a862b92880690421dbcba8010600ebc74365d7fa22b87f3467669313)
- trade #3: [0xdc22a5dce4…](https://app.hyperliquid-testnet.xyz/explorer/tx/0xdc22a5dce4cbe829dd9c0421dbcc1a010200bdc27fcf06fb7feb512fa3cfc214)

### Scenario B — broken promise (breach, allocator paid from bond) · tokenId 12

Trader minted a Stoic strategy (the deliberately-bad archetype), same 100 USDC bond and 20% threshold. Two small real-fill wins (+5, +5) then a real SHORT $25 fill paired with a forced −100 USDC equity attestation drove equity to 10 USDC — far below the 80 USDC threshold. Allocator bought a 50 USDC policy for 6.25 premium. `markBreach` flipped status to Breached(2); `settleEpoch` paid the allocator atomically: **toAllocators=50.0 USDC, toTrader=0**. Allocator net: +43.75 USDC (50 claim − 6.25 premium). Trader: full bond slashed.

| Step | 0G Galileo tx |
|---|---|
| mint Stoic strategy | [0x7981516f88…](https://chainscan-galileo.0g.ai/tx/0x7981516f889e6f9b41e892b0b324b8b03cd48507ed62cd9d6d6b2b1775f08dc9) |
| startEpoch (600s, 20%) | [0xa3ed807d50…](https://chainscan-galileo.0g.ai/tx/0xa3ed807d50a87d0827cbab3b5b24aa956c3b110d186788359f1dc413c3a8bef4) |
| recordTrade #1 Δ+5 | [0x33dddaeb87…](https://chainscan-galileo.0g.ai/tx/0x33dddaeb87d2a3a2db8c4a1c793d57519cace3d5f55eb26018e73602da68d706) |
| recordTrade #2 Δ+5 | [0x3c984949f9…](https://chainscan-galileo.0g.ai/tx/0x3c984949f97ef3439facaea13d08f71f44bcbd09ae02f352c54f49b5292ca745) |
| recordTrade #3 Δ−100 | [0xdca00c2477…](https://chainscan-galileo.0g.ai/tx/0xdca00c24773cfd6f90dc86db108b28e2164b05b8f871bdfc04058577fb4dadc4) |
| buyPolicy policyId=4 | [0x19a0ac843a…](https://chainscan-galileo.0g.ai/tx/0x19a0ac843adaa2706fc40688c5a0f34139839fc9674fe7afacb0310cf1958834) |
| markBreach | [0xc71825181f…](https://chainscan-galileo.0g.ai/tx/0xc71825181f9bbf6dbd717147632feffb61ce878b265307ae38bebdc5b5c46819) |
| **settleEpoch (breach payout)** | [0x1eb35bfe37…](https://chainscan-galileo.0g.ai/tx/0x1eb35bfe372bcd23ca131ad0bad0d29c9faa7dcbe7fa8211d6a9777fcb6df67f) |

Real Hyperliquid testnet fills:
- trade #1 LONG $12: [0x4ce4694435…](https://app.hyperliquid-testnet.xyz/explorer/tx/0x4ce469443531a5bb4e5e0421dbe0130104008129d034c48df0ad1496f4357fa5)
- trade #2 LONG $12: [0x73c05d425f…](https://app.hyperliquid-testnet.xyz/explorer/tx/0x73c05d425f993e6e753a0421dbe07d0108007527fa9c5d40178908951e9d1859)
- trade #3 SHORT $25: [0xfc7d1df751…](https://app.hyperliquid-testnet.xyz/explorer/tx/0xfc7d1df7519cd7cefdf60421dbe11001090035dcec9ff6a1a045c94a1090b1b9)

### Scenario C — LP deposit + withdraw with accrued yield

Fresh LP wallet `0x06C0…cE58` (derived deterministically from `keccak256(PRIVATE_KEY || "lp-scenarioC")`) deposited 1000 USDC. Pool `totalAssets` grew 1171.25 → 2171.25 USDC. The pre-deposit baseline (1171.25 instead of a virgin 0) carries premium accrued across every kept-promise epoch run on the pool so far, including Scenario A's 2.50 USDC LP cut. LP burned half its shares (500) and pulled **1085.625 USDC** — a 17.1% effective premium yield on the redeemed portion in a single demo cycle.

| Step | 0G Galileo tx |
|---|---|
| approve(pool) | [0xc7ed60d723…](https://chainscan-galileo.0g.ai/tx/0xc7ed60d723f0c16aee2447e8ec3160085b4f15280cb910af4be81ea2a8aa9445) |
| deposit 1000 USDC | [0x1d42c6f0ac…](https://chainscan-galileo.0g.ai/tx/0x1d42c6f0ac928d7f925e600a1998c6793382ab9e2f9e3160a416b17977a91769) |
| withdraw 500 shares | [0x7ea2f2aaa2…](https://chainscan-galileo.0g.ai/tx/0x7ea2f2aaa242d0ca8efea80e592f291afb5e4217b8944ec132517080d7b18e4b) |

### Independent verification

Anyone can re-verify the final state of the demo scenarios above with these `cast` calls (no private keys needed):

```bash
RPC=https://evmrpc-testnet.0g.ai
POOL=0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57
STRATEGY=0x782CBD5313E3b99d9C94e4f5197B81a432cdE621
USDC=0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7

# Scenario A: tokenId 11 — status should be Idle(0), bond reset to 0 after kept-promise settle
cast call $STRATEGY "getData(uint256)((uint8,bytes32,bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8))" 11 --rpc-url $RPC

# Scenario B: tokenId 12 — same Idle(0) state, bond 0 (slashed via breach)
cast call $STRATEGY "getData(uint256)((uint8,bytes32,bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8))" 12 --rpc-url $RPC

# Pool aggregate state
cast call $POOL "totalAssets()(uint256)" --rpc-url $RPC
cast call $POOL "totalShares()(uint256)" --rpc-url $RPC

# Look up any tx hash above
cast tx 0x037c19ac6c14591ba61885dfd59b584565a31344682dbe084660f71a5a001d0a --rpc-url $RPC
```

The driver script for these scenarios is `agent/src/v3/demo-scenarios.ts` — re-runnable for fresh strategies (`tsx src/v3/demo-scenarios.ts A|B|C|all`).

## Try it yourself (challenger flow)

The fastest way to understand Orichalcos is to play the challenger role end-to-end. Takes ~5 minutes.

1. **Connect a wallet** at https://orichalcos.vercel.app (or http://localhost:3000 if running locally). Add **0G Mainnet**: RPC `https://evmrpc.0g.ai`, chainId `16661`, currency `0G`, explorer `https://chainscan.0g.ai`. You'll need a small amount of mainnet 0G for gas (available on Binance / Gate / MEXC).
2. **Get test USDC.** Click the **"Get test USDC"** button in the dashboard header — it calls `MockUSDC.mint(yourAddr, 10000e6)` directly on mainnet (10,000 USDC, permissionless — MockUSDC is the v3 stable substitute; real USDC integration is v3.5+ after audit).
3. **Browse wagers.** Open `/protocol` — see the live grid of trader-bonded promises plus the LP deposit panel.
4. **Inspect a wager.** Click into any wager card → click any trade row → TradeModal opens with the on-chain provenance: TEE `chatId`, 0G Storage merkle root, and Hyperliquid L1 transaction hash. Per-trade TEE attestation is v3.5; the per-mint chatId on the dossier header is the real one.
5. **Place a stake.** Open `/strategies/breached/insure`. Set claim size to 500 USDC → stake auto-calcs at 62.5 USDC (12.5%). Approve USDC → Place Stake.
6. **Settle.** Back on the wager page, click "Settle Epoch" (permissionless). On breach: protocol pulls up to your claim size from the bond and sends it to your wallet, sweeps residual to LPs. **Net P&L on a 500 USDC claim: +437.5 USDC.** On a kept promise: stake splits 60% to the trader / 40% to the LP pool — your stake pays the trader for being right.

**Mint your own wager.** Open `/wagers/new` and write your own bonded promise (free text). The server-side flow encrypts to 0G Storage, runs a real TEE inference on 0G Compute, mints the INFT on 0G Chain. Four 0G components, one form. See `agent/src/v3/wager-tee-mint.ts` for the CLI equivalent.

Full role-by-role walkthroughs (Trader / Allocator / LP) including ASCII flow diagrams, contract calls, and recording-ready demo script: see [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md).

## TEE trust envelope (what we claim and don't)

**Honest scope:**
- ✅ Strategy is sealed inside 0G Compute TEE — operator never reads prompt or weights
- ✅ Every trade decision is TEE-attested via chatId + signature
- ❌ We do NOT claim "MEV/front-running protection" — order signing happens *outside* the enclave (out of scope for v3; achievable in v3.1 with in-enclave signing)

## Project structure

```
hackquest-0g/
├── contracts/        # Foundry — 5 v3 contracts + 50/50 tests passing
│   ├── src/v3/       # MockUSDC.sol, StrategyINFT.sol, InsurancePool.sol,
│   │                 # TradeAttestation.sol, MockYieldVault.sol
│   └── test/v3/      # 47 v3 tests + 3 MockYieldVault tests
├── agent/            # TypeScript runner — TEE inference + Hyperliquid + on-chain attestation
│   └── src/v3/       # hyperliquid.ts, populate-demo.ts, force-breach.ts,
│                     # integration-smoke.ts (end-to-end lifecycle assertions)
├── dashboard/        # Next.js 16 frontend (live at orichalcos.vercel.app)
│   └── src/app/      # /strategies/[id|breached|settled], /protocol,
│                     # /strategies/[id]/insure
├── docs/
│   ├── pitch-deck.html      # 8-slide submission deck (open in browser, E to edit)
│   ├── DEMO-SCRIPT.md       # 7-shot 3-minute demo walkthrough
│   ├── PRE-RECORD-CHECKLIST.md  # 30-minute pre-camera prep
│   └── USER_FLOWS.md        # Role-by-role walkthroughs
├── submission/       # Hackathon submission docs (8 numbered sections + STATUS)
├── ARCHITECTURE.md   # Locked economic decisions (v3 design pass)
├── PIVOT.md          # Decision log: how v2 (Scrying Duel) became v3 (market)
└── STATUS.md         # Live progress + verification checklist
```

## Running locally

### Contracts (Foundry)

```bash
cd contracts
forge install
forge build
forge test --match-path "test/v3/*.t.sol"  # 50 / 50 tests passing
```

### Agent runner

```bash
cd agent
npm install
cp .env.example .env  # fill in PRIVATE_KEY (deployer) + HL_TEST_PRIVATE_KEY (HL wallet)

# Health check
./node_modules/.bin/tsx src/v3/smoke-test-galileo.ts

# End-to-end lifecycle smoke (mint → epoch → trades → policy → breach → settle)
# Asserts every step against on-chain state. Reusable as mainnet day-1 smoke.
pnpm run v3:integration

# Populate fresh demo strategies on Galileo
PRIVATE_KEY=0x... MOCK_DEX=false npm run v3:populate

# Force a strategy into breach state (demo recovery)
PRIVATE_KEY=0x... ./node_modules/.bin/tsx src/v3/force-breach.ts <tokenId> [equityAfter]
```

### Frontend

```bash
cd dashboard
npm install
npm run dev  # http://localhost:3000
# Open /strategies/breached to see the breached demo strategy
```

## Demo flow (~3 minutes)

Full shot-by-shot script with timings and narration: see [`docs/DEMO-SCRIPT.md`](docs/DEMO-SCRIPT.md). Pre-record setup checklist: [`docs/PRE-RECORD-CHECKLIST.md`](docs/PRE-RECORD-CHECKLIST.md). Summary:

**Shot 1 (25s) — the problem.** AI trading bots can be either visible (alpha decays) or hidden (no verifiability). Orichalcos resolves both halves.

**Shot 2 (25s) — three roles.** Trader bonds USDC against a drawdown promise. Allocator takes the other side. LP underwrites the float. On a kept promise, premium splits 60/40 trader/LP. On breach, bond pays allocators.

**Shot 3 (25s) — verifiable execution.** Open `/strategies/settled`. Each dot on the equity curve is a real TEE-attested fill on Hyperliquid testnet.

**Shot 4 (25s) — trust layer.** Click any trade row. The TradeModal shows TEE `chatId`, 0G Storage merkle root, and a clickable Hyperliquid L1 tx hash — judges land on the real testnet order page in two clicks.

**Shot 5 (25s) — breach state.** Open `/strategies/breached`. Slim ochre breach-rule strip at the top. Red marker on the equity curve where it crossed threshold. Settle card armed in the right rail.

**Shot 6 (30s) — buy coverage.** `/strategies/breached/insure` — slider, live dual-outcome cards, two-step approve → buy. ~6 seconds end-to-end on Galileo.

**Shot 7 (25s) — Track 2 pitch close.** "AI-driven perpetual strategy agents, sealed inference with TEE-based execution, front-running mitigation, verifiable on-chain settlement. Five contracts on Galileo. 50 of 50 tests passing. Live at orichalcos.vercel.app."

## What's verifiable end-to-end

1. Mint a Strategy Agent → tx on chainscan
2. Bond USDC → tx on chainscan
3. Each TEE inference → chatId on chain, attestation blob on 0G Storage
4. Each perp trade → oid recorded on chain; agent wallet's full fill history viewable on Hyperliquid testnet explorer (linked from frontend)
5. P&L update → on-chain equity update tx
6. Breach detection → markBreach tx + emitted event
7. Settle → coordinated USDC flows: bond → allocators + pool LPs

Every step is auditable. The strategy itself stays unreadable.

## Hackathon submission

- **Track 2:** Agentic Trading Arena (Verifiable Finance)
- **Repo:** [github.com/amrrobb/orichalcos](https://github.com/amrrobb/orichalcos) (public, this branch is `feat/v3-insurance-market`)
- **Live demo:** [orichalcos.vercel.app](https://orichalcos.vercel.app) — current v3 build, real on-chain reads
- **Pitch deck:** [`docs/pitch-deck.html`](docs/pitch-deck.html) — 8 slides, ~3-minute walkthrough (open in browser; press `E` to edit copy in place)
- **Demo script:** [`docs/DEMO-SCRIPT.md`](docs/DEMO-SCRIPT.md) (7 shots, 3 minutes flat)
- **User flows:** [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md) — role-by-role guides
- **Submission packet:** [`submission/`](submission/) — 8 numbered sections matching the HackQuest requirements + `STATUS.md` handoff
- **Integration smoke:** [`agent/src/v3/integration-smoke.ts`](agent/src/v3/integration-smoke.ts) — full lifecycle assertions on Galileo

## Acknowledgments

Built solo in Yogyakarta, Indonesia. Two pivots reached the current submission:

- **First pivot (mid-hackathon, May 13):** v2 *Scrying Duel* — AI prediction arena — did not match Track 2's actual rubric. Pivoted to v3 *Risk-Management Protocol* (the insurance framing). The v2 cryptographic primitives (sealed souls, TEE inference, 0G Storage encrypted blobs) carried forward unchanged. See [`PIVOT.md`](PIVOT.md).
- **Second pivot (final stretch, May 15–16):** v3 *as insurance* had asymmetric economics — the trader keeping a promise had no upside beyond bond return. Re-framed as a *symmetric promise-keeping market*: premium splits 60% trader / 40% LP on a kept promise. Same contracts, one-function change in `InsurancePool.expirePolicy`. Documented in [`submission/01-basic-info.md`](submission/01-basic-info.md) under "Why this is a market, not insurance."

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for locked design decisions and [`STATUS.md`](STATUS.md) for the live verification checklist.

---

*The v2 *Scrying Duel* artifacts (apprentices/duels/codex contracts) are preserved in the repo for design-history continuity, accessible under `/trials/champions` on the live site. The current live submission is v3 — the promise-keeping market.*
