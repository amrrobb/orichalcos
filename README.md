# Orichalcos

**A promise-keeping market for AI-driven perpetual strategy agents.**

*Strategies stay sealed. Capital stays safe. Every trade is verifiable.*

Built for **0G APAC Hackathon — Track 2 (Agentic Trading Arena / Verifiable Finance)** — May 2026.

---

## The dilemma we solve

Every autonomous AI strategy sits on one of two horns:

- **Reveal the strategy** ⇒ alpha decays on contact. Open-source bots get front-run; "alpha" Discords are dead before retail can copy. Edge that's legible is edge that's gone.
- **Hide the strategy** ⇒ allocators can't tell a rug from a real edge. Anon vaults rug. Screenshots can't be audited. Capital can't price a black-box claim.

Orichalcos is a primitive for **verifiable performance without revealed alpha**: a promise-keeping market built around Sealed Inference and TEE-based execution, with permissionless settlement on 0G Chain.

## Three roles, one protocol

| Role | What they do | Stake | Reward |
|---|---|---|---|
| **Trader** | Mints a Strategy Agent (INFT). Posts a USDC bond against a drawdown promise. Strategy runs sealed inside 0G Compute TEE; trades fill on **Hyperliquid testnet**. | Bond at risk | Keeps trading P&L. Bond returned on a kept promise + **60% of policy premium**. Bond fully slashed on breach. |
| **Allocator** | Browses Strategy Agents by verified on-chain track record. Buys a policy that pays out from the bond if the agent breaks its drawdown promise. | Premium up-front | Claim payout from the bond on breach; expires worthless on kept promise. |
| **LP** | Deposits USDC into the protocol pool — the underwriting capacity provider. | Pool deposit | Premium yield (40% on kept promise) + residual from slashed bonds. |

When a strategy breaches its drawdown threshold, the protocol **enforces the rules on-chain** — bond pays open policies first, residual sweeps to LPs, trader receives zero. No admin. No multi-sig. No human arbiter.

## Track 2 alignment

Orichalcos is built directly against the Track 2 — Agentic Trading Arena vocabulary:

- **AI-driven perpetual strategy agents.** Every Strategy Agent INFT is one — a self-contained, sealed AI trader running real perpetual fills.
- **Sealed Inference and TEE-based execution.** Weights live encrypted on 0G Storage; decryption + inference happen only inside 0G Compute TEE.
- **Front-running mitigation.** There is nothing to front-run: signals never leave the enclave, only signed fills.
- **Verifiable finance.** Every trade carries a TEE chatId + 0G Storage merkle root + Hyperliquid order ID, committed on 0G Chain.

## Why this is fair

Three contract-level invariants close the obvious attacks:

- **Traders cannot insure themselves.** `buyPolicy()` reverts with `AllocatorIsTrader` if `msg.sender == ownerOf(strategyId)`. A trader can't take both sides of their own promise.
- **A trader's bond is always ≥ the allocator's maximum claim.** `buyPolicy()` reverts with `CoverageExceedsBond` if requested coverage exceeds available bond headroom. LPs bear no principal risk in v3 — they are an underwriting layer, not a backstop.
- **Settlement is permissionless.** `markBreach()` and `settleEpoch()` are open to any wallet. The trader, an allocator, an LP, or a passing keeper can trigger settlement once the on-chain equity crosses the threshold. No oracle. No multisig. No special role.

## Roadmap

- **v2 (this submission).** Bond + policy + permissionless settlement. On a kept promise, premium splits **60% to the trader, 40% to the LP pool** — the trader's reward for keeping a real promise, the pool's reward for underwriting the bond capacity that made the policy issuable in the first place. On breach, the bond pays open policies and the residual sweeps to LPs.
- **v3 — next milestone: promise enrichment.** A drawdown cap is the minimum honest promise. v3 layers `minTrades` + `minPnL` guards on top, so a trader can promise *"at least N fills, at least X% net, drawdown ≤ Y%"* — a multi-dimensional contract for allocators to underwrite. Premium BPS also becomes a function of the agent's verified track record.
- **Beyond v3.** A first-class **AI-agent allocator** that buys policies across Strategy Agents the way a fund-of-funds buys exposure — sealed reasoning, on-chain portfolio.

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
│   (sealed strategy)        │  │ Real testnet order ids         │
│  Storage                   │  │  https://api.hyperliquid-      │
│   (encrypted soul + trade  │  │       testnet.xyz              │
│    attestation blobs)      │◀─┤                                │
│  Chain — Galileo (testnet):│  │                                │
│   StrategyINFT (ERC-721)   │  │                                │
│   InsurancePool            │  │                                │
│   TradeAttestation         │  │                                │
│   MockUSDC + MockYieldVault│  │                                │
│  4 of 5 0G components used │  │                                │
└────────────────────────────┘  └────────────────────────────────┘
```

## 0G modules used (4 of 5)

| Module | What we use it for |
|---|---|
| **0G Chain** | Smart contracts (StrategyINFT, InsurancePool, TradeAttestation) on Galileo testnet 16602 |
| **0G Compute (TEE)** | Strategy decision runs inside Intel TDX + H100 enclave; attestation chatId committed on-chain per trade |
| **0G Storage** | Encrypted strategy "sealed soul" + every trade's full attestation blob; merkle root committed on-chain |
| **0G INFT (ERC-7857)** | Each Strategy Agent is a transferable INFT; track record bound to the token |
| 0G DA | Not used (commitment layer covered by Storage merkle roots) |

## Smart contracts

Three contracts. State variables + external function signatures only:

### `StrategyINFT.sol` — ERC-721 + ERC-7857 with inlined per-token vault
- Each Strategy Agent is one NFT
- Vault state lives in the token: `startingBond`, `bondAmount`, `maxDrawdownBps`, `currentEquity`, `status` (Idle/Active/Breached/Settled)
- Epoch lifecycle: `startEpoch` → trades record via TradeAttestation → `markBreach` (anyone) → `settleEpoch` (anyone)

### `InsurancePool.sol` — Protocol-owned premium aggregator (ERC-4626-lite)
- Allocators pay premium for coverage; `buyPolicy(strategyId, maxClaim)` blocks self-insurance
- LPs deposit USDC, earn premium yield + breach residuals
- v3 = pool LPs bear ZERO principal risk (bond ≥ max claim enforced at issue time)

### `TradeAttestation.sol` — Append-only TEE-attested trade log
- Operator-only `recordTrade(strategyId, chatId, storageRoot, hyperliquidTxHash, pnlDelta, equityAfter)`
- Mirrors equity into StrategyINFT in same tx
- Breach detection lives in StrategyINFT, fed by these equity updates

## Deployments

### 0G Galileo Testnet (chainId 16602) — primary demo

| Contract | Address |
|---|---|
| MockUSDC | `0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7` |
| StrategyINFT | `0x782CBD5313E3b99d9C94e4f5197B81a432cdE621` |
| InsurancePool | `0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57` |
| TradeAttestation | `0x892872eF9490683604EE53B90c5c21e1B4E6eeda` |
| MockYieldVault | `0x5c16FeF4d883A489525469e5f61B222328022fE1` |

Explorer: https://chainscan-galileo.0g.ai · See `deployments-v3-galileo.json` for the full wiring map.

> **Mainnet status.** The submission ships on 0G Galileo testnet. A mainnet redeployment is intentionally deferred until after a third-party audit — the contracts touch real allocator capital flows and breach-settlement math, and we will not ship them with user funds at risk until that audit is complete. See [`submission/09-fundraising-status.md`](submission/09-fundraising-status.md) for the post-hackathon plan.

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

## Try it yourself (allocator flow)

The fastest way to understand Orichalcos is to play the allocator role end-to-end. Takes ~5 minutes once you have a wallet on Galileo.

1. **Connect a wallet** at https://orichalcos.vercel.app (or http://localhost:3000 if running locally). Add 0G Galileo: `https://evmrpc-testnet.0g.ai`, chainId `16602`. Get test OG at https://faucet.0g.ai.
2. **Get test USDC.** Click the **"Get test USDC"** button in the dashboard header — it calls `MockUSDC.mint(yourAddr, 10000e6)` directly (10,000 USDC, permissionless). Alternative: `PRIVATE_KEY=0x... ./node_modules/.bin/tsx src/v3/mint-to-me.ts <yourAddr>` from `agent/`.
3. **Browse strategies.** Open `/protocol` — see the active grid plus the LP deposit panel.
4. **Inspect.** Open `/strategies/settled` (on-track) or `/strategies/breached` (in breach). Click any trade row → the TradeModal opens with the on-chain provenance: TEE `chatId`, 0G Storage merkle root, and Hyperliquid L1 transaction hash. For strategies #5–#8, the Hyperliquid link is a **direct per-trade URL** on the testnet explorer; for legacy strategies (#1–#3) it falls back to the agent's wallet address page.
5. **Buy a policy.** Open `/strategies/breached/insure`. Set coverage to 500 USDC → premium auto-calcs at 62.5 USDC (12.5%). Approve USDC → Buy Policy.
6. **Settle.** Back on `/strategies/breached`, status is already Breached. Click "Settle Epoch" — the protocol pulls 500 USDC from the trader's bond and sends it to your wallet, sweeps the residual to LPs. **Net P&L: claim 500 − premium 62.5 = +437.5 USDC.**

**v2 symmetric settlement.** On a *kept* promise (no breach by epoch end), `expirePolicy()` splits the premium **60% to the trader / 40% to the LP pool** — the trader earns real yield for keeping the bonded promise, not just bond return. See `submission/01-basic-info.md` ("Why this is a market, not insurance") for the economic rationale.

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
