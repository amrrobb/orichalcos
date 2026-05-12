# Orichalcos

**A risk-management protocol for autonomous AI trading strategies.**

*Strategies stay sealed. Capital stays safe. Every trade is verifiable.*

Built for **0G APAC Hackathon — Track 2 (Agentic Trading Arena / Verifiable Finance)** — May 2026.

---

## The Problem

AI trading bots are everywhere and nobody can trust any of them. The dilemma:

- **If you see the strategy**, it stops working (alpha decay).
- **If you don't see it**, you can't verify it isn't a rug.

The result is a multi-billion-dollar crypto signal economy where anon Twitter accounts sell "AI alpha" with no audit, no on-chain proof, no recourse. The FBI logged $11.3B in U.S. crypto fraud losses in 2025. The Swiss Finance Institute found 56% of financial influencers produce −2.3% monthly abnormal returns for followers — yet keep growing followings because there's no way to verify their claims.

## The Solution

Orichalcos is **the first on-chain risk-management primitive for AI trading strategies**, built around three actors:

| Actor | What they do | Stake | Reward |
|---|---|---|---|
| **Trader** | Mints a Strategy Agent (INFT), bonds USDC, runs AI strategy sealed inside 0G TEE | Bond at risk | Keeps trading profits; bond returned on success; **fully slashed on breach** |
| **Allocator** | Browses Strategy Agents by verified track record, buys insurance for protected exposure | Premium | On breach: claim paid from trader's slashed bond |
| **LP** | Deposits USDC into the protocol pool | Pool deposit | Premium yield + bonus from slashed-bond residuals |

When a strategy breaches its drawdown threshold, the protocol **automatically enforces the rules on-chain** — bond slashed, claim paid, residual swept to LPs. No admin. No multi-sig. No human arbiter.

> *"Orichalcos is built for the emerging class of pseudonymous AI traders who want to monetize their bot's track record without revealing the strategy, and the capital allocators who want exposure without the rug risk. This category is small today — maybe a few thousand people — but it's the same shape of problem Nexus Mutual solved for smart contract risk in 2018, before that became a $1B category. We're building the protocol the category needs before the category exists."*

## Track 2 alignment

Track 2 description names three product types we need to be:

| Track 2 requirement | Orichalcos delivers |
|---|---|
| "Risk-management bots" | ✅ The entire protocol is one |
| "AI-driven perpetual strategy agents" | ✅ Every Strategy INFT is one |
| "Yield optimizers" | ✅ Pool LPs earn premium yield + breach residuals |
| "Verifiable financial logic" | ✅ Every trade attested on-chain with TEE chatId + storage root + Hyperliquid txHash |
| "Sealed Inference" | ✅ Strategy decision runs sealed in 0G Compute TEE |
| "Proprietary trading strategies" | ✅ Never revealed; only the on-chain track record is public |

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
│  Chain — Galileo/Aristotle:│  │                                │
│   StrategyINFT (ERC-7857)  │  │                                │
│   InsurancePool            │  │                                │
│   TradeAttestation         │  │                                │
│                            │  │                                │
│  4 of 5 0G components      │  │                                │
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
| MockUSDC | `0x2F7296aebCBc5a8D67A65FA6BF09dD74c70bC60f` |
| StrategyINFT | `0x349D286aF27501d4119C11709bb48f4Ef9f50450` |
| InsurancePool | `0xdAe6c8DCE82f848e3b5a21320F0b8eeB655a0E91` |
| TradeAttestation | `0x30Fc834477B15B0B3720D61A169FF5dFe4D7C742` |

Explorer: https://chainscan-galileo.0g.ai

### 0G Aristotle Mainnet (chainId 16661) — submission target

*Deployed Day 15 (May 15, 2026) — see `deployments-v3-mainnet.json` after that date.*

## Demo strategies on chain

Canonical demo strategies (real Hyperliquid testnet trades, linkable explorer URLs):

| Token | Archetype | Status | Equity | Trades |
|---|---|---|---|---|
| #17 | Bold / Momentum | Active | $1,135 (+13.5%) | 10 real HL fills |
| #18 | Patient / Mean-Reversion | Active | $1,055 (+5.5%) | 10 real HL fills |
| #19 | Sharp / Microstructure | Active | $1,041 (+4.1%) | 10 real HL fills |
| **#20** | **Stoic / Grid** | **Active (ready to breach)** | **$790 (−21%)** | **10 real HL fills** |

Strategy #20 is the demo focus: click "Mark Breach" → "Settle Epoch" and watch the protocol slash the bond, pay allocator claims, sweep residual to LPs — in two transactions.

## TEE trust envelope (what we claim and don't)

**Honest scope:**
- ✅ Strategy is sealed inside 0G Compute TEE — operator never reads prompt or weights
- ✅ Every trade decision is TEE-attested via chatId + signature
- ❌ We do NOT claim "MEV/front-running protection" — order signing happens *outside* the enclave (out of scope for v3; achievable in v3.1 with in-enclave signing)

## Project structure

```
hackquest-0g/
├── contracts/        # Foundry — 3 v3 contracts + 45 tests (81% coverage)
│   └── src/v3/       # StrategyINFT.sol, InsurancePool.sol, TradeAttestation.sol
├── agent/            # TypeScript runner — TEE inference + Hyperliquid + on-chain attestation
│   └── src/v3/       # hyperliquid.ts, populate-demo.ts, force-breach.ts, smoke tests
├── dashboard/        # Next.js 16 frontend
│   └── src/app/      # /strategies/[id], /protocol, /strategies/[id]/insure
├── ARCHITECTURE.md   # Locked economic decisions
├── PIVOT.md          # Decision log: how we got from v2 to v3 mid-hackathon
└── STATUS.md         # Live progress + verification checklist
```

## Running locally

### Contracts (Foundry)

```bash
cd contracts
forge install
forge build
forge test --match-path "test/v3/*.t.sol"  # 45 tests, all passing
```

### Agent runner

```bash
cd agent
npm install
cp .env.example .env  # fill in PRIVATE_KEY (deployer) + HL_TEST_PRIVATE_KEY (HL wallet)

# Health check
./node_modules/.bin/tsx src/v3/smoke-test-galileo.ts

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
# Open /strategies/20 to see the breach-ready demo strategy
```

## Demo flow (~2 minutes)

**Frame 1 (15s) — the problem.** AI trading bots: either you see the strategy and it stops working, or you don't and you can't verify it.

**Frame 2 (45s) — verifiable execution.** Open `/strategies/17`. Sparkline shows 10 winning trades. Click any trade row → modal opens with TEE chatId (0G Compute attestation), 0G Storage merkle root, and **clickable Hyperliquid testnet order ID** that resolves to the real fill on HL explorer.

**Frame 3 (45s) — risk management.** Open `/strategies/20`. Equity at $790, threshold $800, status Active. Red breach banner appears. Click "Mark Breach" → tx fires. Click "Settle Epoch" → bond slashed, allocator paid (if a policy existed), residual sweeps to pool LPs.

**Frame 4 (15s) — the pitch.** "Orichalcos: risk-management protocol for autonomous AI traders. Strategies sealed in 0G. Trades verified on Hyperliquid. Capital protected on-chain. Live on Aristotle mainnet."

## What's verifiable end-to-end

1. Mint a Strategy Agent → tx on chainscan
2. Bond USDC → tx on chainscan
3. Each TEE inference → chatId on chain, attestation blob on 0G Storage
4. Each perp trade → real txn ID on Hyperliquid explorer (clickable from frontend)
5. P&L update → on-chain equity update tx
6. Breach detection → markBreach tx + emitted event
7. Settle → coordinated USDC flows: bond → allocators + pool LPs

Every step is auditable. The strategy itself stays unreadable.

## Hackathon submission

- **Track 2:** Agentic Trading Arena (Verifiable Finance)
- **Repo:** this one
- **Live demo:** [orichalcos.vercel.app](https://orichalcos.vercel.app) *(v2 currently — v3 redeploy Day 15)*
- **Demo video:** added Day 15
- **0G mainnet contracts:** added Day 15 after final Galileo testing green

## Acknowledgments

Built solo in Yogyakarta, Indonesia. Pivoted from v2 (Scrying Duel — AI prediction arena, did not match Track 2's actual rubric) to v3 (Risk-Management Protocol) on Day 11 of 16. The v2 cryptographic primitives (sealed souls, TEE inference, 0G Storage encrypted blobs) carry forward unchanged; only the economic mechanism and product framing changed.

See `PIVOT.md` for the full pivot reasoning and `ARCHITECTURE.md` for locked design decisions.

---

*v2 (Scrying Duel) archived at https://orichalcos.vercel.app — proof of the cryptographic machinery that powers v3.*
