# Orichalcos v3 Pivot — Strategy Insurance Market

**Decided 2026-05-11 (T-minus 5 days to submission)**

This document is the single source of truth for the mid-hackathon pivot. It supersedes HANDOFF.md Section 2 (signal-seller framing) and `docs/plans/2026-05-10-001-feat-orichalcos-v2-frontend-plan.md` (v2 demo path).

---

## TL;DR

Pivoting from "AI Champions fight in Scrying Duels" to **"AI strategy insurance market where strategies execute real perp trades on Hyperliquid testnet and are verified on 0G."**

Why: Track 2's official description (verified by HackQuest fetch) is **"transitioning from manual DeFi to fully autonomous, verifiable financial logic... AI-driven perpetual strategy agents... TEE-based execution to ensure execution privacy and mitigate front-running, creating a more secure environment for proprietary trading strategies."** v2 (predictions, no DEX, no real strategy) doesn't match that. v3 does.

---

## The product

**Orichalcos is a market for verifiable AI trading strategies and the insurance contracts written against them.**

### Layered architecture: 0G = verifiability, Hyperliquid = DEX

```
┌─────────────────────────────────────────────────────────────────┐
│  USER (Trader, Insurer, Spectator)                               │
└──────┬──────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│  FRONTEND  (Next.js on Vercel)                                    │
│  • Mint Strategy INFT                                              │
│  • Browse strategies + P&L curves                                  │
│  • Underwrite/buy insurance policies                               │
│  • Verify any trade end-to-end                                     │
└──────┬───────────────────────────────────────┬──────────────────┘
       │                                       │
┌──────▼──────────────────┐  ┌─────────────────▼────────────────┐
│  0G LAYER (verify)        │  │  HYPERLIQUID TESTNET (execute)    │
│  • Compute (TEE strategy) │  │  • Real perp DEX                   │
│  • Storage (encrypted)    │  │  • Real order book                 │
│  • Chain (attestations,   │◀─┤  • Real testnet txHashes           │
│    INFTs, vaults, policies)│  │  • api.hyperliquid-testnet.xyz    │
└───────────────────────────┘  └────────────────────────────────────┘
                ▲
                │ Cross-chain proof: Hyperliquid txHash committed
                │ alongside TEE attestation + 0G Storage root
```

Each trade's verification chain:
1. Encrypted strategy fetched from **0G Storage** by merkle root
2. Decrypted inside **0G Compute TEE** (strategy invisible to operator)
3. TEE decides direction/size, signs the decision
4. Agent runner places real order on **Hyperliquid testnet** → real `txHash`
5. Trade receipt + TEE attestation + Hyperliquid txHash uploaded to **0G Storage** → merkle root
6. Merkle root + txHash committed to **`TradeAttestation.sol` on 0G Chain**
7. Strategy's on-chain P&L curve updates
8. If P&L breaches insurance threshold → `InsurancePolicy.sol` auto-settles

---

## What stays from v2 (~70%)

| Component | Reuse |
|---|---|
| Frontend infra: Next.js 16, wagmi, RainbowKit, `/api/tell` proxy | ✅ keep |
| Header / Footer / Mark / wax seals / typography / colors | ✅ keep, relabel |
| AES-256-GCM soul encryption helpers (`agent/src/duel/soul-encryption.ts`) | ✅ keep |
| 0G Storage upload/download helpers (`agent/src/duel/storage.ts`) | ✅ keep |
| TEE inference helper (`agent/src/duel/tee-inference.ts`) | ✅ keep |
| Mind Reveal animation (`MindReveal.tsx`) | ✅ keep, retrigger on trade attestation |
| ApprenticeINFT.sol → renamed StrategyINFT.sol + collateral fields | ⚠️ rename + extend |
| Codex.sol | ❌ probably obsolete (ELO/Title progression doesn't fit) |
| ScryingDuel.sol | ❌ obsolete, replaced by TradeAttestation.sol |
| MockPyth.sol | ✅ keep (Pyth provides off-chain reference prices) |

## New contracts (~30% of total work)

```
contracts/src/v3/
├── StrategyINFT.sol         # ERC-7857 Strategy NFT with collateral vault address
├── StrategyVault.sol        # Per-strategy collateral, slashed on insurance claim
├── InsurancePolicy.sol      # Premium escrow, claim settlement
├── TradeAttestation.sol     # One-sided trade reporting w/ Hyperliquid txHash field
└── interfaces/
    └── IInsuranceOracle.sol # Failure-condition oracle (drawdown breached, etc.)
```

## 5-day plan

| Day | Output | Risk |
|---|---|---|
| **May 11 (today)** | Pivot HANDOFF + README. Draft 4 new contracts. Set up Hyperliquid testnet wallet + SDK research. | Low |
| **May 12** | Deploy new contracts to Galileo. Wire Hyperliquid SDK in agent runner. **First real testnet trade end-to-end.** | High — Hyperliquid integration is new |
| **May 13** | Run agent for ~10 trades per strategy × 4 strategies. Verified P&L curves emerge on chain. | Medium |
| **May 14** | Frontend: Strategy detail page + Insurance Policy UI. End-to-end demo flow working. | Medium |
| **May 15** | Polish + demo video recording (2:30) + README rewrite. | Tight |
| **May 16** | Submit + X post. | Final |

### Hedge — `MOCK_DEX=true` fallback

If Hyperliquid integration blocks past Day 13, the agent runner flips to `MOCK_DEX=true`: same UI, same contracts, same demo flow, but trades simulate against Pyth-fed prices instead of hitting Hyperliquid. Honest "mocked DEX" note in README. Weaker story, still credible.

---

## Risks

| Risk | Mitigation |
|---|---|
| Hyperliquid testnet API gives trouble | `MOCK_DEX=true` env flag. Same contracts, same UI, mocked execution. |
| 5-day budget overrun | Day 14 is the buffer. Demo video Day 15 is final pad. |
| Pivot fatigue / context loss | This PIVOT.md is the single source of truth. Memory entry: `orichalcos_v3_pivot.md`. |
| Insurance underwriter side too complex for v2 | Mock the underwriter as a protocol-owned pool. v3.1 opens to humans. |
| TradeAttestation contract bugs | Same Foundry test discipline as v2; aim 80% test coverage on new contracts |

---

## What gets shown in the demo (script outline)

**Frame 1 — The problem (15s):**
- Quick montage: AI trading bot ads with no audit. "Guaranteed 5% weekly." Anon Twitter avatars. "Vault rug."
- Quote: *"You can't trust an AI trading bot because either you see its strategy (and it stops working) or you don't (and you can't verify it)."*

**Frame 2 — The protocol (45s):**
- Walk through a Strategy INFT's detail page. Show P&L curve. Click a trade.
- Modal opens: TEE chatId, 0G Storage hash, **Hyperliquid testnet txHash** (clickable, opens explorer).
- Voice: *"This AI strategy traded 30 times on Hyperliquid. Each trade has a real testnet txHash you can verify. The strategy itself? Sealed inside 0G's TEE. Nobody — not me, not you, not the operator — can read it."*

**Frame 3 — The insurance (45s):**
- Switch to insurance side. Show an InsurancePolicy being underwritten.
- *"Because P&L is verifiable but strategy stays hidden, capital allocators can price-discover risk without seeing the alpha. Insurers underwrite. Traders stake collateral. If the strategy fails, collateral is slashed and insurance pays out."*
- Show a claim auto-settling on chain.

**Frame 4 — The pitch (15s):**
- *"Orichalcos: Trustable AI trading without revealed alpha. Sealed inference on 0G. Real perps on Hyperliquid. Verifiable everywhere."*
- Stats: 4 of 5 0G components used. 30+ real Hyperliquid testnet trades. Live at orichalcos.vercel.app.

---

## Naming + branding

- **Project name:** "Orichalcos" stays — the cryptographic-grimoire framing still works for "sealed strategies."
- **Champion names:** Agni/Tirta/Bayu/Pertiwi stay but reframed as **strategy archetypes**:
  - Agni (Bold) → Momentum (Bold/Aggressive perp scalper)
  - Tirta (Patient) → Mean-reversion (Patient counter-trend)
  - Bayu (Sharp) → Microstructure (Sharp scalper)
  - Pertiwi (Stoic) → Grid (Stoic range trader)
- **"Apprentice"** terminology → drops or becomes "**Strategy**"
- **"Trial"** terminology → drops or becomes "**Trade**"
- **"Trainer"** → becomes "**Trader**" (the one who deploys a strategy)
- **"Codex"** → becomes "**Ledger**" or stays as a metaphor for the on-chain track record

---

## Open questions for next session

1. Do we deploy fresh contracts or migrate existing ones? **Recommend: fresh deploy on Galileo, old contracts stay as `legacy/v2/`.**
2. Insurance underwriter side — protocol-owned pool or human-buyer marketplace? **Recommend: protocol pool for v3, human marketplace as roadmap.**
3. Does the agent runner need a new branch? **Recommend: extend in-place under `agent/src/v3/`, keep `agent/src/duel/` for reference.**
4. README: rewrite from scratch or amend? **Recommend: rewrite. Add a "v2 archive" link at the bottom.**
5. Hyperliquid SDK: use community TypeScript SDK or build minimal wrapper via raw fetch? **Recommend: try community SDK first, fall back to raw fetch if it's awkward.**

---

## Reference

- Track 2 official description (verified 2026-05-11 via HackQuest): https://www.hackquest.io/hackathons/0G-APAC-Hackathon
- Hyperliquid testnet docs: https://hyperliquid.gitbook.io/hyperliquid-docs
- Hyperliquid testnet API: `https://api.hyperliquid-testnet.xyz`
- v2 live demo (to be superseded): https://orichalcos.vercel.app
- v2 deployment addresses: see `deployments-v2.json`

---

**Decision lock-in.** Next session opens with this file. No re-deciding the pivot.
