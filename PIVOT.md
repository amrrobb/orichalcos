# Orichalcos v3 Pivot — Strategy Insurance Market

**Decided 2026-05-11 (T-minus 5 days to submission)**

This document is the single source of truth for the mid-hackathon pivot. It supersedes HANDOFF.md Section 2 (signal-seller framing) and `docs/plans/2026-05-10-001-feat-orichalcos-v2-frontend-plan.md` (v2 demo path).

---

## TL;DR

Pivoting from "AI Champions fight in Scrying Duels" to **"Risk-management protocol for autonomous AI trading strategies. Strategies execute real perp trades on Hyperliquid testnet, are sealed inside 0G TEE, and capital allocators get drawdown-breach protection enforced on chain."**

Why: Track 2's official description (verified by HackQuest fetch) names three product types — "yield optimizers, risk-management bots, AI-driven perpetual strategy agents" — and asks for "verifiable financial logic" with "Sealed Inference and TEE-based execution." v2 (predictions, no DEX, no real strategy, no risk management) hits 0 of 4. v3 hits 4 of 4: it IS a risk-management bot, every Strategy Agent IS an AI-driven perp agent, all P&L is verifiable on-chain, and strategies are sealed in TEE.

The word "Arena" appears only in the track name, not in the description. Track 2 is about **infrastructure for autonomous capital**, not competition. v3 leans into that.

---

## The product

**Orichalcos is a risk-management protocol for autonomous AI trading strategies.** Tagline: *"Strategies stay sealed. Capital stays safe. Every trade is verifiable."*

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
- Quote: *"You can't trust an AI trading bot. Either you see its strategy and it stops working, or you don't see it and you can't verify it. Either way, your capital is unprotected."*

**Frame 2 — Verifiable execution (45s):**
- Walk through a Strategy Agent detail page. Show P&L curve. Click a trade.
- Modal opens: TEE chatId, 0G Storage hash, **Hyperliquid testnet txHash** (clickable, opens explorer).
- Voice: *"This AI strategy made 30 real perp trades on Hyperliquid. Every trade has a TEE-signed decision and an on-chain attestation. The strategy itself? Sealed inside 0G Compute TEE — even the operator running it cannot read the prompt or weights. You verify the track record without ever seeing the alpha."*

**Frame 3 — The risk management (45s):**
- Switch to allocator view. Show "Get protected exposure" flow with premium / coverage numbers.
- *"This is a risk-management protocol. The trader bonds collateral and picks a max drawdown. Allocators pay a premium for protected exposure. If the strategy breaches its drawdown, the protocol enforces the rules on chain — bond is slashed, allocator is paid, strategy is halted. Automatic. No arbiter. No multi-sig."*
- Show a breach detected → `markBreach()` → claim payout → all on chainscan.

**Frame 4 — The pitch (15s):**
- *"Orichalcos: risk-management protocol for autonomous AI traders. Strategies sealed in 0G. Trades verified on Hyperliquid. Capital protected on chain."*
- Stats: 4 of 5 0G components used. 30+ real Hyperliquid testnet trades. Live on Aristotle mainnet.

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

## Resolved decisions (May 11 working session)

1. ✅ **Fresh deploy** on Galileo for build/test, then Aristotle mainnet on Day 15 once green. Old contracts move to `contracts/src/legacy/v2/`. See `ARCHITECTURE.md`.
2. ✅ **Protocol-owned pool**, no LP underwriting risk in v3 (bond ≥ max claim). v3.1 = LP underwriting.
3. ✅ **New branch** `feat/v3-insurance-market` cut from `feat/scrying-duel-v2` on May 11.
4. **Pending:** README rewrite — Day 15 task. Add "v2 archive" link at bottom.
5. **Pending:** Hyperliquid SDK — try community TypeScript SDK first (Day 11-12 scout task #4).
6. ✅ **Product framing:** Risk-Management Protocol, NOT marketplace. The insurance mechanic is a feature.
7. ✅ **Mainnet required** for submission (Aristotle 16661). Deploy Day 15 morning AFTER all Galileo testing green.
8. ✅ **TEE trust envelope:** strategy is sealed + decisions are attested; we do NOT claim front-running protection. See memory `orichalcos_tee_trust_envelope.md`.

---

## Reference

- Track 2 official description (verified 2026-05-11 via HackQuest): https://www.hackquest.io/hackathons/0G-APAC-Hackathon
- Hyperliquid testnet docs: https://hyperliquid.gitbook.io/hyperliquid-docs
- Hyperliquid testnet API: `https://api.hyperliquid-testnet.xyz`
- v2 live demo (to be superseded): https://orichalcos.vercel.app
- v2 deployment addresses: see `deployments-v2.json`

---

**Decision lock-in.** Next session opens with this file. No re-deciding the pivot.
