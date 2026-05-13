# UX Wireframes — v3 (Day 13 redesign)

> **Goal:** a first-time visitor lands cold, reads 30 seconds, and knows
> exactly what role to play and what to click. Currently confusing per
> screenshot review.
>
> **Status:** ASCII wireframes for review. Will be locked before any HTML/React work.

---

## Page 1 — Landing `/` (the entry point)

**Anchor message:** "AI trading bots can't be trusted. Orichalcos fixes both halves of the trust problem with one protocol. Here's how it works in 90 seconds."

**Goal:** explain the product so well that a cold visitor leaves either:
- (a) wanting to try the live demo (→ /protocol)
- (b) understanding why this matters even if they don't try it

```
┌─────────────────────────────────────────────────────────────────┐
│  [logo] Orichalcos        Protocol  Strategies  v2 archive  [○ Connect] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ORICHALCOS · 0G APAC HACKATHON                                  │
│                                                                  │
│  Risk-management for AI traders.                                 │
│                                          ┌───────────┐           │
│  A protocol where AI strategies stay    │           │           │
│  sealed, allocator capital stays safe,  │   [Mark   │           │
│  and every trade is verifiable on chain │   sigil]  │           │
│  — without revealing the alpha.         │           │           │
│                                          └───────────┘           │
│  [▸ Try the live demo →]   [Read the whitepaper]                │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WHY THIS EXISTS                                                 │
│                                                                  │
│  AI trading bots are everywhere and nobody can trust any of them.│
│  Two problems that pull in opposite directions:                   │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐         │
│  │   IF YOU SEE IT        │  │  IF YOU DON'T SEE IT   │         │
│  │   it stops working     │  │  you can't verify it   │         │
│  │                        │  │                        │         │
│  │   alpha decay          │  │  rug risk              │         │
│  │   front-running        │  │  fake screenshots      │         │
│  │   copy-trade race      │  │  vault scams           │         │
│  └────────────────────────┘  └────────────────────────┘         │
│                                                                  │
│  Today's answer is anon Twitter and $11.3B/year in crypto fraud. │
│                                                                  │
│  [56% lose money stat] [69% fraud stat] [$11.3B FBI stat]       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HOW IT WORKS                                                    │
│                                                                  │
│  Three roles in one protocol — pick the one that's you:          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  I · TRADER  │  │ II · ALLOC.  │  │  III · LP    │           │
│  │              │  │   ★ START    │  │              │           │
│  │  I have an   │  │  HERE        │  │  I want      │           │
│  │  AI bot. I   │  │              │  │  passive     │           │
│  │  want to     │  │  I want AI   │  │  yield. No   │           │
│  │  prove the   │  │  exposure    │  │  principal   │           │
│  │  track record│  │  without the │  │  risk in v3. │           │
│  │  without     │  │  rug risk.   │  │              │           │
│  │  revealing   │  │              │  │  Earn from   │           │
│  │  the strategy│  │  Buy a policy│  │  premiums +  │           │
│  │              │  │  → if AI rugs│  │  slashed     │           │
│  │  Bond USDC,  │  │  → I get paid│  │  bond        │           │
│  │  run sealed. │  │  from the    │  │  residuals.  │           │
│  │              │  │  bond.       │  │              │           │
│  │              │  │              │  │              │           │
│  │  [Learn →]   │  │  [TRY DEMO →]│  │  [Open pool→]│           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  THE 90-SECOND WALKTHROUGH                                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. Browse strategies — see only verified P&L curves      │   │
│  │     (the strategy itself stays sealed in 0G's TEE)        │   │
│  │                                                            │   │
│  │  2. Pick one, buy insurance — 12.5% premium for coverage │   │
│  │     up to the trader's bonded collateral                  │   │
│  │                                                            │   │
│  │  3. If the AI breaches its drawdown, anyone can settle    │   │
│  │     on chain — bond gets slashed, your claim auto-pays    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [▸ Watch it live: Strategy #20 is breach-ready right now →]    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LIVE ON 0G GALILEO                                              │
│                                                                  │
│  ▸ 4 contracts deployed       ▸ 45/45 Foundry tests passing     │
│  ▸ 4 demo strategies live     ▸ 40+ real Hyperliquid testnet     │
│  ▸ 81% line coverage             trades attested on chain        │
│                                                                  │
│  [Strategy #17 ↗ healthy]  [Strategy #20 ↗ breach-ready]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
              [footer: contracts, github, 0G explorer]
```

### What changes vs current landing
- Hero is identical (already good)
- "Why this exists" REPLACES the 3 stat cards with a **2-card dilemma framing** (alpha decay vs rug risk) THEN the stats. Tells the story before the data.
- "How it works" REPLACES the abstract "three roles" cards with **roles framed as personas** ("I have an AI bot, I want to..." / "I want AI exposure without...") + **Allocator card has "★ START HERE" badge** + clear CTAs per card
- NEW "90-second walkthrough" section explicitly walks the allocator journey in 3 numbered steps
- NEW "Live on 0G Galileo" trust signal section with hard numbers + direct strategy links

---

## Page 2 — Protocol `/protocol` (the entry-after-landing)

**Anchor message:** "You're an allocator. Here are 4 AI strategies you can insure. Click one."

**Goal:** the visitor knows from the landing they want to be an allocator. This page should put strategies front and center with the allocator action obvious.

```
┌─────────────────────────────────────────────────────────────────┐
│  [logo] Orichalcos        Protocol  Strategies  v2 archive  [○ Connect] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  THE PROTOCOL                                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  YOU'RE BROWSING AS AN ALLOCATOR.                        │   │
│  │  Pick a Strategy Agent below to inspect its track record  │   │
│  │  and buy a policy that pays out if it breaches.          │   │
│  │  Trader? [Mint a Strategy] · LP? [Deposit to pool below] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ACTIVE STRATEGIES — 4                                           │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │ #17  +13.5% │ │ #18  +5.5%  │ │ #19  +4.1%  │ │ #20 -21%   ││
│  │             │ │             │ │             │ │ ⚠ BREACH   ││
│  │ Bold        │ │ Patient     │ │ Sharp       │ │ Stoic      ││
│  │ Momentum    │ │ Mean-Rev    │ │ Microstr    │ │ Grid       ││
│  │             │ │             │ │             │ │            ││
│  │ Bond  $1000 │ │ Bond  $1000 │ │ Bond  $1000 │ │ Bond $1000 ││
│  │ Equity$1138 │ │ Equity$1055 │ │ Equity$1041 │ │ Equity $790││
│  │             │ │             │ │             │ │            ││
│  │ Headroom:   │ │ Headroom:   │ │ Headroom:   │ │ ⚠ READY    ││
│  │ 1000 USDC   │ │ 1000 USDC   │ │ 1000 USDC   │ │ TO SETTLE  ││
│  │ available   │ │ available   │ │ available   │ │            ││
│  │             │ │             │ │             │ │            ││
│  │ [Inspect →] │ │ [Inspect →] │ │ [Inspect →] │ │ [SETTLE→]  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POOL — for LPs                                                  │
│                                                                  │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │ TOTAL POOL ASSETS     │  │  YOUR LP POSITION               │   │
│  │ $0.00 USDC            │  │  Shares: 0                      │   │
│  │                       │  │  Value:  $0.00                  │   │
│  │ Premium yield: 12.5%  │  │                                  │   │
│  │ on every policy bought│  │  [Deposit] [Withdraw]            │   │
│  └──────────────────────┘  └────────────────────────────────┘   │
│                                                                  │
│  Zero principal risk in v3 (bond ≥ max claim enforced).          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What changes vs current /protocol
- NEW yellow-tinted "context band" at top — explicitly tells visitor what role they're in and where to go for other roles
- Strategy cards REORDERED to put **action signal first** ("Headroom: X USDC available" tells allocator they can still buy coverage; "READY TO SETTLE" on #20 invites them to demo the breach)
- Each card has primary action button at bottom (currently no clear CTA)
- "POOL" section moved to a clear secondary block (LPs find it, allocators ignore it)

---

## Page 3 — Strategy detail `/strategies/[id]` (currently confusing per screenshot)

**Anchor message:** "This is a Strategy Agent that runs sealed inside a TEE. Here's its track record. Want to insure it?"

**Goal:** make the page understandable to a cold-landed visitor (not just someone who already knows what they're looking at).

```
┌─────────────────────────────────────────────────────────────────┐
│  [logo] Orichalcos        Protocol  Strategies  v2 archive  [○ Connect] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ← Back to Protocol                                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  YOU'RE INSPECTING A STRATEGY AGENT.                     │   │
│  │  Read the track record below. If you want exposure       │   │
│  │  without the rug risk → [Buy Coverage →]                 │   │
│  │  This is the trader's view → [I'm the trader, settle]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  STRATEGY AGENT  ·  GRID  ·  STOIC RANGE TRADER       [● ACTIVE]│
│  Strategy #20    Owner 0x77C0…8812 [contract↗]    EPOCH ENDS 12h│
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ⚠ DRAWDOWN THRESHOLD HIT                                        │
│  This strategy crossed its max-drawdown threshold.               │
│  Anyone can mark the breach and trigger settlement.              │
│  Bond pays allocators first; residual sweeps to pool LPs.        │
│  Trader receives 0.                                              │
│                                                                  │
│  [Mark Breach]   [Settle Epoch]                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EQUITY CURVE — last 10 trades                                   │
│  ┌────────────────────────────────────────────┐                 │
│  │   $1021                                     │ Bond:    $1000 │
│  │   $964 ●───────●                            │ Equity:  $790  │
│  │              ●──●                            │ Threshold $800 │
│  │                  ●──●                        │ Breached: yes  │
│  │                       ●──●──●──●            │                 │
│  │   $769 ········breach ≤ $800·············  │ [What's this?] │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  ▸ Strategy is sealed in 0G Compute TEE — operator never reads it│
│  ▸ Each point above = one TEE-attested trade on Hyperliquid     │
│  ▸ Dashed line = breach threshold (bond × (1 - 20% drawdown))   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ATTESTED TRADES — every row is provenance-verifiable            │
│                                                                  │
│  #  WHEN     P&L       EQUITY    [click any row for full proof] │
│  ───────────────────────────────                                 │
│  10 11h ago  +$0.00    $790  →                                  │
│  9  11h ago  +$0.00    $790  →                                  │
│  8  11h ago  +$15.00   $790  →                                  │
│  ... (scrollable)                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
              [footer: contracts, github, 0G explorer]
```

### What changes vs current /strategies/[id]
- NEW yellow context band at top — tells cold visitor they're inspecting (not the trader) and offers the allocator CTA
- Status badge moved into header line (compact)
- Vault stats COLLAPSED into a small right-rail next to the chart instead of 6 separate cards (less cognitive load — the chart is the hero)
- Chart gets supporting text bullets BELOW it explaining what the dashed line means
- "Attested trades" gets a new subheading line: "every row is provenance-verifiable" + [click any row for full proof] hint
- The "Sealed Soul" hash card is REMOVED from primary view (it was confusing — moved to the click-modal instead since judges only need to see it when they verify a trade)

---

## Page 4 — Insure `/strategies/[id]/insure` (currently OK but missing context)

**Anchor message:** "You're buying insurance on this strategy. Here's exactly what you pay and what you'd get back."

```
┌─────────────────────────────────────────────────────────────────┐
│  [logo] Orichalcos        Protocol  Strategies  v2 archive  [○ Connect] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ← Back to Strategy #20                                          │
│                                                                  │
│  BUY COVERAGE on Strategy #20 (Stoic / Grid)                    │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────────────┐│
│  │ THE STRATEGY YOU'RE    │  │  YOUR POLICY                    ││
│  │ INSURING               │  │                                  ││
│  │                        │  │  Coverage    [____500____] USDC ││
│  │ Stoic / Grid · #20     │  │  Premium     12.50%             ││
│  │ Equity:  $790          │  │              = 62.50 USDC       ││
│  │ Threshold: $800        │  │                                  ││
│  │ Bond avail: $1000      │  │  ┌────────────────────────┐    ││
│  │                        │  │  │  IF STRATEGY BREACHES: │    ││
│  │ ⚠ Currently in breach  │  │  │  You receive: $500     │    ││
│  │   state — settle would │  │  │  Net P&L:    +$437.50  │    ││
│  │   pay your claim now.  │  │  └────────────────────────┘    ││
│  │                        │  │                                  ││
│  │                        │  │  ┌────────────────────────┐    ││
│  │                        │  │  │  IF STRATEGY SUCCEEDS: │    ││
│  │                        │  │  │  You receive: $0       │    ││
│  │                        │  │  │  You lose:   $62.50    │    ││
│  │                        │  │  │  (cost of protection)  │    ││
│  │                        │  │  └────────────────────────┘    ││
│  │                        │  │                                  ││
│  │                        │  │  Your USDC balance: $9,987.38   ││
│  │                        │  │                                  ││
│  │                        │  │  [Approve & Buy Policy]         ││
│  │                        │  │                                  ││
│  │                        │  │  Two transactions: approve, buy.│ │
│  └────────────────────────┘  └────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What changes vs current /insure
- "Protect your exposure" headline → more direct: "BUY COVERAGE on Strategy #N"
- NEW dual-outcome box: shows both "if breaches" AND "if succeeds" with exact numbers — answers the "what am I betting on" question explicitly
- "The strategy you're insuring" left card surfaces the breach-state warning prominently
- Removes the "BOND UTILIZATION" bar (was confusing) — replaced with simple "Bond available: $X"

---

## Decisions to lock before HTML

1. **Top context band color** — yellow/amber (warning-style) or muted teal (info-style)?
2. **"START HERE" badge on Allocator card** — yellow pill, brass corner ribbon, or just a subtle border highlight?
3. **Chart support text** — keep all three bullets (sealed/each point/dashed line) or trim to one?
4. **Insure page dual-outcome boxes** — green for breach (you win), red for success (you lose) OR neutral both?
5. **Delete the "Sealed Soul" card from `/strategies/[id]` primary view** — judges might want to see it. Better to demote, not delete?

After your redlines on these wireframes, I build static HTML mockups (~30 min), you redline once more, then port to React (~60 min). Total: ~2 hours from now to live UX-improved app.
