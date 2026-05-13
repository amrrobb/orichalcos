# Orichalcos — User Flows

Full role-by-role guide to using the protocol. Each role has a flow diagram, step-by-step walkthrough, wallet requirements, and pages used.

For the **demo video flow**, jump to the bottom.

---

## Table of contents

- [Role 1 — Trader](#role-1--trader-the-ai-quant)
- [Role 2 — Allocator](#role-2--allocator-the-ai-skeptical-investor)
- [Role 3 — LP](#role-3--lp-the-yield-farmer)
- [Demo video flow (allocator)](#demo-video-flow-allocator)
- [Pre-flight checklist](#pre-flight-checklist)

---

## Role 1 — Trader (the AI quant)

**Goal:** monetize an AI bot's track record without revealing the strategy. Bond capital as a reputation signal. Earn from running quality strategies (in v3.1: a 20% performance fee escrowed on every policy bought against your strategy, paid out only on clean settle).

### Flow

```
 STEP 1                    STEP 2                    STEP 3
 ─────                     ─────                     ─────
 Create Strategy           Bond capital              Run trades
 Agent (NFT)               + open epoch              (autonomous)

   │ /protocol                │ /strategies/             │ Agent runner
   │ "Mint Strategy           │  [tokenId]               │ runs in
   │  Agent" form             │ "Start Epoch" form       │ background
   ▼                          ▼                          ▼
 ┌────────────────┐       ┌────────────────┐       ┌─────────────────┐
 │ Pick archetype │       │ Bond: 1000 USDC│       │ Per trade:      │
 │  Bold/Patient/ │       │ Drawdown: 20%  │       │ 1) TEE decides  │
 │  Sharp/Stoic   │       │ Duration: 7d   │       │ 2) HL execute   │
 │ Upload sealed  │       │ → USDC locked  │       │ 3) Attest on    │
 │  soul (encrypt │       │ → status:Active│       │    chain        │
 │  to 0G Storage)│       │                │       │ 4) Equity ↑↓    │
 │ → mint INFT    │       │                │       │                 │
 └────────────────┘       └────────────────┘       └─────────────────┘
                                                            │
                                                            ▼
                                  ┌─────────────────────────────────┐
                                  │ STEP 4: Settle (epoch ends)     │
                                  │ ─────────────────────────────── │
                                  │ Path A — SUCCESS:                │
                                  │   Click "Settle Epoch"           │
                                  │   → Bond returned in full        │
                                  │   → Reputation accumulated       │
                                  │   → (v3.1) 20% premium fees      │
                                  │     released from escrow         │
                                  │                                   │
                                  │ Path B — BREACH:                 │
                                  │   Anyone calls markBreach        │
                                  │   → Bond fully slashed           │
                                  │   → Trader gets ZERO             │
                                  │   → (v3.1) escrowed premium fees │
                                  │     forfeited                    │
                                  │   → Strategy frozen, can re-bond │
                                  └─────────────────────────────────┘
```

### Step-by-step

1. **Mint the Strategy Agent** — go to `/protocol` (when minting UI ships) or run `agent/src/v3/populate-demo.ts` for the v3 demo. Pick one of four archetypes:
   - **Bold / Momentum** — chases trends, 65% win rate, +18 avg win / −10 avg loss
   - **Patient / Mean-Reversion** — counter-trend, 60% win rate
   - **Sharp / Microstructure** — scalper, 62% win rate, small ticks
   - **Stoic / Grid** — range trader, 45% win rate (deliberately weak in demo)
2. **Upload a sealed soul.** The strategy's system prompt is AES-256-GCM encrypted and uploaded to 0G Storage. The merkle root goes on chain. Operator never reads plaintext.
3. **Bond collateral.** USDC transferred into the StrategyINFT contract per token. Lower-bounds protocol's enforcement budget.
4. **Pick risk parameters.** `maxDrawdownBps` (e.g. 2000 = 20%) sets the breach threshold at `startingBond × (1 − maxDrawdownBps/10000)`.
5. **Pick epoch duration.** Default 7 days; demo can shorten to 1 hour to fire breach during recording.
6. **Run the agent.** Per trade: TEE decision → Hyperliquid execution → atomic on-chain attestation (`recordTrade`).
7. **Settle.** Anyone can call `markBreach` if equity ≤ threshold; anyone can call `settleEpoch` once status is Breached or epoch expired.

### Wallet & gas

- Trader wallet (the deployer in current demo)
- Galileo testnet OG for gas (~0.025 OG covers a full epoch's writes)
- USDC for bond
- A separate Hyperliquid testnet wallet for trade execution (kept distinct from the trader's identity wallet — security hygiene)

### Pages used

- `/protocol` — mint Strategy Agent (UI ships in v3.1; v3 uses CLI)
- `/strategies/[tokenId]` — manage epoch, view P&L

### v3 limitations to be honest about

- Trader currently earns NOTHING from premiums in v3 contracts. The 20% performance fee in the business model is **roadmap to v3.1**.
- Trader's actual trading P&L flows through the Hyperliquid wallet, not the bond contract. Bond is a slashing primitive, not a profit pool.
- Operator (typically the trader themselves) is trusted to attest accurate P&L. v3.1 = HL state attestation closes that loop.

---

## Role 2 — Allocator (the AI-skeptical investor)

**Goal:** get exposure to AI alpha without taking the rug risk. Pay a premium for protected exposure to a strategy you find credible.

### Flow

```
 STEP 1                    STEP 2                    STEP 3
 ─────                     ─────                     ─────
 Browse strategies         Inspect track             Buy insurance
                           record                    policy

   │ /protocol                │ /strategies/             │ /strategies/
   │ Active strategies        │  [tokenId]               │  [tokenId]/insure
   │ grid                     │                          │
   ▼                          ▼                          ▼
 ┌────────────────┐       ┌────────────────┐       ┌─────────────────┐
 │ See cards:     │       │ View P&L curve │       │ Pick coverage:  │
 │ • Bold +13.5%  │       │ Click trade    │       │   e.g. 500 USDC │
 │ • Patient +5%  │       │  → modal:      │       │ Premium auto-   │
 │ • Sharp +4%    │       │   - chatId     │       │   calc: 62.5    │
 │ • Stoic -21%   │       │   - storage    │       │   USDC (12.5%)  │
 │                │       │   - HL link    │       │ Approve USDC    │
 │ Pick one to    │       │ Verify the     │       │   → tx 1        │
 │ inspect        │       │ track record   │       │ Buy Policy      │
 │                │       │ without seeing │       │   → tx 2        │
 │                │       │ the strategy   │       │ Policy created  │
 └────────────────┘       └────────────────┘       └─────────────────┘
                                                            │
                                                            ▼
                                  ┌─────────────────────────────────┐
                                  │ STEP 4: Wait for epoch outcome  │
                                  │ ─────────────────────────────── │
                                  │ Path A — Strategy SUCCEEDS:      │
                                  │   You lose the premium (the      │
                                  │   cost of protection you didn't  │
                                  │   need)                          │
                                  │                                   │
                                  │ Path B — Strategy BREACHES:      │
                                  │   Auto-payout from trader's bond │
                                  │   You receive: maxClaim USDC     │
                                  │   Net P&L: maxClaim - premium    │
                                  │   (e.g. 500 - 62.5 = +437.5)     │
                                  └─────────────────────────────────┘
```

### Step-by-step

1. **Open `/protocol`.** See the active strategies grid — every Strategy Agent currently in an Active epoch with its current P&L %.
2. **Click into a strategy** (e.g. `/strategies/17`). See:
   - Archetype label, status badge, vault stats (bond / equity / threshold / drawdown %)
   - P&L sparkline with breach threshold as dashed line
   - Trade timeline (most recent first)
3. **Verify a trade.** Click any row in the timeline → modal opens showing:
   - **chatId** — 0G Compute TEE attestation ID for the decision
   - **storageRoot** — 0G Storage merkle root for the full attestation blob
   - **hyperliquidTxHash** — encoded HL order ID, **clickable to the live HL explorer fill page**
   - P&L delta + post-trade equity + timestamp
4. **Decide and buy a policy.** Click "Insure this strategy" → opens `/strategies/[tokenId]/insure`:
   - Enter coverage amount (USDC)
   - Premium auto-calculated as `coverage × premiumBps / 10000` (default 12.5%)
   - **Self-insurance is blocked** — the contract enforces `msg.sender ≠ strategyOwner`
   - **Coverage cap enforced** — sum of all policies on this (strategy, epoch) must be ≤ bond
   - **Approve USDC** (one tx) → **Buy Policy** (second tx)
5. **Wait for epoch outcome.** No further action needed.
6. **On breach:** anyone can call `markBreach` then `settleEpoch`. Your wallet receives `maxClaim` USDC automatically. Net P&L: `+maxClaim − premium`.
7. **On success:** premium stays in pool as LP yield. You lose the 12.5% premium as the cost of protection you didn't need.

### Wallet & gas

- Any wallet that's NOT the strategy owner (self-insurance is blocked)
- Galileo testnet OG for gas
- USDC for premium

### Pages used

- `/protocol` — browse active strategies
- `/strategies/[tokenId]` — inspect any strategy
- `/strategies/[tokenId]/insure` — buy a policy

### Rules and edge cases

- First allocator gets coverage at the rate they want; bond fills up over time
- Cannot buy a policy that pushes total coverage past bond (`CoverageExceedsBond` revert)
- Cannot insure a strategy whose epoch is not Active (`EpochNotActive` revert)
- After settle, the strategy can be re-bonded for a new epoch — your old policy doesn't carry over

---

## Role 3 — LP (the yield farmer)

**Goal:** earn passive yield on USDC. Zero principal risk in v3 (bond ≥ max claim enforced at policy issue). Bonus payouts from slashed-bond residuals.

### Flow

```
 STEP 1                    STEP 2                    STEP 3
 ─────                     ─────                     ─────
 Deposit USDC              Earn from premiums        Withdraw any time

   │ /protocol                │ Passive — no clicks      │ /protocol
   │ LP Deposit panel         │ needed                   │ LP Deposit panel
   ▼                          ▼                          ▼
 ┌────────────────┐       ┌────────────────┐       ┌─────────────────┐
 │ Enter amount:  │       │ Every policy   │       │ Burn shares     │
 │   e.g. 5000    │       │ bought adds    │       │ Receive pro-    │
 │ Approve USDC   │       │ premium to     │       │   rata USDC     │
 │   → tx 1       │       │ pool           │       │   (premium yield│
 │ Deposit        │       │                │       │   + any breach  │
 │   → tx 2       │       │ Every breach   │       │   residuals)    │
 │ Receive shares │       │ adds residual  │       │                 │
 │   (1:1 first)  │       │ to pool        │       │                 │
 │                │       │                │       │                 │
 │ Pool stats:    │       │ lpAssetValue() │       │                 │
 │   totalAssets  │       │   reads        │       │                 │
 │   totalShares  │       │   pro-rata     │       │                 │
 │   premiumBps   │       │   share        │       │                 │
 └────────────────┘       └────────────────┘       └─────────────────┘
```

### Step-by-step

1. **Open `/protocol`.** Find the "LP Deposit" panel showing pool stats (totalAssets, totalShares, premiumBps).
2. **Deposit USDC.** Enter amount, approve, deposit. Receive shares (1:1 for first depositor; pro-rata otherwise).
3. **Earn passively.** Every time an allocator buys a policy on any Strategy Agent, the premium routes into the pool. Every breach event sweeps the unallocated residual into the pool. Your share of `totalAssets` grows.
4. **Check share value any time.** `lpAssetValue(addr)` returns your pro-rata USDC value.
5. **Withdraw any time.** Burn shares, receive pro-rata USDC.

### Wallet & gas

- Any wallet with USDC
- Galileo testnet OG for gas

### Pages used

- `/protocol` — only page LPs need

### v3 vs v3.1

- **v3:** zero principal risk. Bond ≥ max claim is enforced at policy issue. Pool only holds premium income. LPs cannot lose deposited USDC.
- **v3.1:** real underwriting. LPs vote to allow bond < max claim policies, absorbing tail risk in exchange for higher premium income. Risk-adjusted yield.

---

## Demo video flow (allocator)

For the 0G APAC submission demo video (≤3 min), record the **allocator flow** — it's the most dramatic and proves both halves of the protocol in one journey.

### Why allocator (vs trader / LP)

| Flow | Drama | Visual variety | Proves the thesis | Shows the wow |
|---|---|---|---|---|
| Trader | Low (mint + bond + wait) | Low | Partial | No |
| **Allocator** | **High** (breach + payout) | **High** (5 pages, 4 txs) | **Yes** (insurance market) | **Yes** (live settle) |
| LP | Lowest (deposit + wait) | Lowest | No | No |

### Recording outline (~2:30)

```
 0:00 ── 0:15        FRAME 1 — The Problem (15s)
                     ──────────────────────────
                     Visual: landing page hero + statistic cards
                     Voiceover: "AI trading bots are everywhere
                     and you can't trust any of them. If you see
                     the strategy it stops working. If you don't,
                     you can't verify it isn't a rug. Today's
                     answer is anon Twitter and fake screenshots.
                     This is what $11.3 billion in crypto fraud
                     looks like."

 0:15 ── 1:00        FRAME 2 — Verifiable Execution (45s)
                     ────────────────────────────────────
                     Click /strategies/17 (Bold/Momentum, healthy)
                     - Show archetype, bond, equity, drawdown
                     - Sparkline going UP (10 winning trades)
                     - Click any trade row → modal opens
                     - Highlight: chatId, storage hash, HL link
                     - CLICK the HL link → opens real fill page
                     Voiceover: "This AI made 10 real perp trades
                     on Hyperliquid. Every trade has a TEE-signed
                     decision and a real on-chain order ID. The
                     strategy itself? Sealed in 0G's hardware
                     enclave. Even the operator can't read it."

 1:00 ── 1:45        FRAME 3 — Risk Management (45s)
                     ───────────────────────────────
                     Connect Metamask (wallet 0x438F...)
                     Navigate /strategies/20/insure
                     - Show: Stoic strategy, equity 790, threshold 800
                     - Enter coverage 500 USDC
                     - Premium auto-calcs: 62.5 USDC
                     - Approve → confirm in MM
                     - Buy Policy → confirm in MM
                     - Redirect back to /strategies/20

                     Voiceover during clicks:
                     "I'll buy insurance against this strategy.
                     500 USDC of coverage for 62.5 USDC premium.
                     If it rugs, I get paid from the trader's bond."

                     [Now /strategies/20 shows red BREACH banner]
                     Click "Mark Breach" → confirm in MM
                     Click "Settle Epoch" → confirm in MM
                     Show wallet balance increase: +500 USDC
                     Show trader bond: 0
                     Show pool LP yield: +500 USDC residual

                     Voiceover during settle:
                     "Strategy hit drawdown. Anyone marks the
                     breach — anyone can. Anyone settles. Bond
                     slashed, my claim paid, residual to LPs.
                     No admin. No multi-sig. Just rules."

 1:45 ── 2:00        FRAME 4 — The Pitch (15s)
                     ─────────────────────────
                     Black screen → tagline reveal:
                     "Orichalcos.
                      Risk-management protocol for autonomous AI traders.
                      Strategies sealed in 0G.
                      Trades verified on Hyperliquid.
                      Capital protected on-chain."

                     Footer: "Live on Aristotle mainnet"
                            (after Day 15 deploy)
                     URLs: orichalcos.vercel.app + GitHub link
```

### What's real vs mock for the video

| What | Real | Mock |
|---|---|---|
| Page navigation | ✓ | — |
| Wallet connect popup | ✓ (connect once at start) | — |
| HL link click → fill page | ✓ (the URL works) | — |
| Approve USDC tx | ✓ | — |
| Buy Policy tx | ✓ | — |
| Mark Breach tx | ✓ | — |
| Settle Epoch tx | ✓ | — |
| Wallet balance updates | ✓ (reads from chain) | — |
| Voiceover | — | recorded over |

**Everything is real on-chain.** No mocking needed for the video.

---

## Pre-flight checklist

Before recording, confirm:

- [ ] Strategy #20 equity ≤ 800 (use `npm run v3:check`; if not, run `force-breach.ts 20 750`)
- [ ] Your demo wallet has USDC + OG (mint USDC if needed via `mint-to-me.ts`, drip OG at https://faucet.0g.ai)
- [ ] Dev server boots clean (`npm run dev` in `dashboard/`)
- [ ] Metamask connected to Galileo (chainId 16602, RPC `https://evmrpc-testnet.0g.ai`)
- [ ] Browser dev tools closed
- [ ] HL explorer pre-loaded in a separate tab (e.g. https://app.hyperliquid-testnet.xyz/explorer/order/52968867292)
- [ ] Voiceover script in front of you

### Estimated total time

- Practice runs: ~10 min (2-3 attempts)
- Real recording with voiceover: ~5 min
- Cut + post-production: 30-45 min in iMovie/Descript
- **Total: ~1 hour for a polished 2:30 video**
