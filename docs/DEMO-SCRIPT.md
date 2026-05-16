# Orichalcos — 3-Minute Demo Script

**Target:** ≤ 3:00 walkthrough for 0G APAC submission, Track 2 (Agentic Trading Arena).

**Structure:** ~40s pitch-deck intro (slides 1 → 2 → 5) → ~2m20s app demo (5 shots).

---

## URLs to queue in browser tabs (in order)

Open these tabs **before hitting record**, in this exact left-to-right order so you can `Ctrl+Tab` cleanly:

| # | URL | When to use |
|---|---|---|
| 1 | `file:///Users/ammar.robb/Documents/Web3/hackathons/hackquest-0g/docs/pitch-deck.html` | Shots 1–3 (deck) |
| 2 | `http://localhost:3000/` | (Optional — title-card flash, skip if tight) |
| 3 | `http://localhost:3000/protocol` | Shot 4 |
| 4 | `http://localhost:3000/wagers/new` | Shot 5 |
| 5 | `http://localhost:3000/strategies/breached` | Shot 6 |
| 6 | `http://localhost:3000/strategies/breached/insure` | Shot 7 |
| 7 | `http://localhost:3000/strategies/11` | Shot 8 |
| 8 | `https://chainscan-galileo.0g.ai/tx/0x037c19ac6c14591ba61885dfd59b584565a31344682dbe084660f71a5a001d0a` | Shot 8 (chainscan proof — kept promise settle, PolicyExpired event) |

**Backup chainscan URL** (Scenario B breach payout — if you want to show breach proof on chain instead): `https://chainscan-galileo.0g.ai/tx/0x1eb35bfe372bcd23ca131ad0bad0d29c9faa7dcbe7fa8211d6a9777fcb6df67f`

---

## Setup before recording

- Pitch deck full-screened on slide 1 (press F to fullscreen in Chrome).
- Wallet on Galileo testnet (chainId 16602), holding MockUSDC > 1000 (click "Get test USDC" in header if dry).
- All 8 tabs above loaded once so they hydrate cache.
- Resolution 1920×1080, browser zoom 100%, bookmarks bar hidden (⌘⇧B), DND on, Slack/Discord quit.
- Clean mic test (no echo, no clipping).

**Narration voice:** confident, technical, ~2.3 words/sec, one-beat pauses between shots.

---

## Captions cheat-sheet (copy these into your editor for burn-in overlays)

| Shot | Position | Hold | Text |
|---|---|---|---|
| 1 | Top-left | 8s | `Orichalcos · 0G APAC · Track 2` |
| 2 | Bottom-center | last 4s | `verifiable performance · without revealed alpha` |
| 3 | Bottom-center | 6s on 60/40 bar | `Bond + Stake + Settlement · all on 0G Chain` |
| 4 | Bottom-center | 4s | `Live market · 0G Galileo · chainId 16602` |
| 4 | Top-right small | full duration | `orichalcos.vercel.app/protocol` |
| 5 | Bottom-center | 5s on "Four 0G components" | `0G Storage · 0G Compute (TEE) · 0G Chain · INFT (ERC-7857)` |
| 5 | Top-right small | full duration | `orichalcos.vercel.app/wagers/new` |
| 6 | Bottom-center | 4s on "permissionless" | `markBreach() · settleEpoch() · any wallet` |
| 7 | Top-center | 5s on dual cards | `Two outcomes · both pre-computed · settled on chain` |
| 7 | Bottom-right small | 3s when TradeModal opens | `Every fill → real Hyperliquid testnet tx` |
| 8 | Bottom-center | 5s on PolicyExpired event | `PolicyExpired · premiumToLP = 2.50 · premiumToTrader = 3.75` |
| End | Full-screen | last 2s | `Orichalcos · github.com/amrrobb/orichalcos · orichalcos.vercel.app · 0G Chain` |

**Style:** white text, JetBrains Mono or any condensed mono, 80% opacity black-pill background (rounded 4px, padding 6px 12px). Brass accent (#d4a574) on URLs only.

**Do not add captions during the narration's high-emphasis seconds** — viewers can't read + listen at the same time. Captions reinforce *after* the spoken claim, not on top of it.

---

## Part A — Pitch deck (0:00 – 0:40)

Open the pitch deck full-screen. Three slides total — keep cuts fast.

### Shot 1 · Title slide (0:00 – 0:08)

**Tab:** Pitch deck — slide 1 (already on-screen).
**Action:** None. Hold on title.
**Visual cue:** Brass sigil spinning, title reads *"A promise-keeping market for AI trading agents."*

**Read aloud (8s):**

> "Orichalcos. A promise-keeping market for AI trading agents on 0G."

**Caption (top-left, 8s):** *"Orichalcos · 0G APAC · Track 2"*

---

### Shot 2 · The dilemma (0:08 – 0:22)

**Tab:** Pitch deck.
**Action:** Press **→** (right arrow) to advance to slide 2.
**Visual cue:** Two panels side-by-side — "Reveal the strategy" vs "Hide the strategy."

**Read aloud (14s):**

> "Every AI trader sits on one of two horns. Reveal the strategy and alpha decays. Hide it and no challenger can trust it. There's been no primitive for verifiable performance without revealed alpha — until now."

**Caption (bottom-center, last 4s):** *"verifiable performance · without revealed alpha"*

---

### Shot 3 · The mechanism (0:22 – 0:40)

**Tab:** Pitch deck.
**Action:** Press **→** three times to advance to slide 5 (skip slides 3 + 4).
**Visual cue:** Six-step sequence at top, 60 / 40 split bar at bottom (Trader yield · LP yield).

**Read aloud (18s):**

> "Three roles. Trader bonds against a promise. Challenger places a stake against the promise. LP underwrites the float. On breach, the bond pays the challenger. On a kept promise, the stake splits sixty-forty — trader earns yield for being right, LP earns the rest. No oracle, no admin, no off-chain coordinator. Let me show you live on chain."

**Caption (bottom-center, hold 6s on 60/40 bar):** *"Bond + Stake + Settlement · all on 0G Chain"*

---

## Part B — App demo (0:40 – 2:55)

Switch from deck to browser. App is `http://localhost:3000`.

### Shot 4 · The grid (0:40 – 1:00)

**Tab:** Switch to `http://localhost:3000/protocol` (Cmd+Tab or click tab).
**Action:** Wait for grid to hydrate. Hover one card briefly so the judge sees the structure.
**Visual cue:** 4+ active cards visible, each leading with "Won't drop more than X%" headline.

**Read aloud (20s):**

> "This is the live market on 0G Galileo. Each card is a wager — a trader who's posted a bond against a drawdown promise. The headline reads the promise verbatim: 'won't drop more than twenty percent.' Below it, every wager carries a TEE-attested style, sealed inside 0G Compute. Challengers browse, pick a wager they disagree with, and stake."

**Caption (bottom-center, 4s):** *"Live market · 0G Galileo · chainId 16602"*
**Caption (small, top-right):** *"orichalcos.vercel.app/protocol"*

---

### Shot 5 · Trader mint flow (1:00 – 1:25)

**Tab:** Switch to `http://localhost:3000/wagers/new`.
**Action:** Highlight the textarea showing the default promise. **Do NOT click submit** — narrate only.
**Visual cue:** Form with archetype dropdown, large promise textarea (pre-filled), bond/drawdown/duration fields.

**Read aloud (25s):**

> "A trader writes their own promise. Free text. The protocol seals this verbatim — encrypted on 0G Storage, signed inside 0G Compute TEE, the chatId committed to the INFT on 0G Chain. Four 0G components, end-to-end. The promise is the contract; the trader's words are the soul."

**Caption (bottom-center, 5s when narrator says "Four 0G components"):** *"0G Storage · 0G Compute (TEE) · 0G Chain · INFT (ERC-7857)"*
**Caption (small, top-right):** *"orichalcos.vercel.app/wagers/new"*

---

### Shot 6 · A wager in breach (1:25 – 1:50)

**Tab:** Switch to `http://localhost:3000/strategies/breached` (slug resolver auto-lands on the canonical breached wager).
**Action:** Pause on the slim ochre breach-rule strip at the top. Scroll to the equity curve and hold cursor on the red marker.
**Visual cue:** Red breach marker on the equity curve where the promise broke; status badge reads BREACHED.

**Read aloud (25s):**

> "Here's a wager that broke its promise. Equity crossed the floor at trade three. The protocol marked the breach automatically. Settlement is permissionless — any wallet can finalize it. The bond pays open stakes first, residual sweeps to LPs, the trader receives zero. Real, on chain, no human arbiter."

**Caption (bottom-center, 4s when narrator says "permissionless"):** *"markBreach() · settleEpoch() · any wallet"*

---

### Shot 7 · The stake flow (1:50 – 2:25)

**Tab:** Switch to `http://localhost:3000/strategies/breached/insure`.
**Action:** Drag the slider to ~**500 USDC** (or click the **500** chip). Pause on the dual outcome cards. Then click any one trade row in the provenance ledger to open the TradeModal — show the Hyperliquid hash for one beat, close the modal.
**Visual cue:** Premium pill flashes brass at 62.50 USDC; Scenario A card shows +437.50, Scenario B shows −62.50.

**Read aloud (35s):**

> "Place a stake against the promise. Pick a claim size — five hundred USDC. Stake is twelve and a half percent up front. Two outcomes are pre-computed and shown side by side: if the trader breaks the promise, you claim from the bond, net plus four hundred thirty-seven. If they keep it, you lose the stake — and that stake pays the trader for keeping a real, verifiable promise. Every trade behind this wager is a real Hyperliquid testnet fill — click any row, you get the actual L1 transaction."

**Caption (top-center, 5s on the dual cards):** *"Two outcomes · both pre-computed · settled on chain"*
**Caption (small, bottom-right, 3s when TradeModal opens):** *"Every fill → real Hyperliquid testnet tx"*

---

### Shot 8 · Settled proof (2:25 – 2:55)

**Tab:** Switch to `http://localhost:3000/strategies/11`.
**Action:** Hold on the dossier for two beats. Then switch to the queued chainscan tab: `https://chainscan-galileo.0g.ai/tx/0x037c19ac6c14591ba61885dfd59b584565a31344682dbe084660f71a5a001d0a`. The `PolicyExpired` event with `premiumToLP = 2.50` and `premiumToTrader = 3.75` will be visible in the logs.
**Visual cue:** Chainscan shows tx status: Success, EventLogs decoded with the 60/40 split.

**Read aloud (30s):**

> "And here's proof — wager number eleven kept its promise. On settlement, the stake split sixty-forty — three seventy-five to the trader, two fifty to the LP. The breach payout is also on chain. Same protocol, both outcomes, both verifiable in two clicks. Orichalcos: promise, bond, stake, settle. Built for Track Two on 0G."

**Caption (bottom-center, 5s on chainscan PolicyExpired event):** *"PolicyExpired · premiumToLP = 2.50 · premiumToTrader = 3.75"*
**End card (last 2s, full-screen):** *"Orichalcos · github.com/amrrobb/orichalcos · orichalcos.vercel.app · 0G Chain"*

---

## Recording checklist

- [ ] Pitch deck loaded, slide 1 visible
- [ ] Wallet connected to Galileo, MockUSDC > 1000
- [ ] Dev server running at `http://localhost:3000`, no console errors
- [ ] `/protocol` renders 4+ active cards (no infinite loader)
- [ ] `/strategies/breached` resolves to a real breached wager
- [ ] `/wagers/new` form renders with the default promise in the textarea
- [ ] `/strategies/11` shows the kept-promise dossier with 3 trades
- [ ] Hyperliquid testnet explorer loads when you click a trade-row HL link
- [ ] Chainscan tab is queued to `https://chainscan-galileo.0g.ai/tx/0x037c19ac6c14591ba61885dfd59b584565a31344682dbe084660f71a5a001d0a`
- [ ] Record at 1080p60, MP4 H.264, target file size < 150 MB

## Post-record

- [ ] Cut any dead air longer than 0.5s
- [ ] Add 1-second brass-on-black title card at start: "Orichalcos · 0G APAC · Track 2"
- [ ] Add 1-second end card: GitHub URL, live URL, chain ID 16602 → mainnet 16661 after Phase 2 deploy
- [ ] Upload to YouTube as **unlisted**, paste URL into `submission/04-demo-video.md`
