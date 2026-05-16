# Orichalcos — 3-Minute Demo Script

**Target:** ≤ 3:00 walkthrough for 0G APAC submission, Track 2 (Agentic Trading Arena).

**Structure:** 1:00 pitch-deck intro (slides 1 → 2 → 3 → 5) → 2:00 app demo (5 shots).

**Why this split:** 0G rules require the video to *clearly show how the 0G component is actually used* — slide-only/concept-only videos are rejected. Deck takes 33% of the runtime, app demo (with on-screen chainscan + TEE provenance proof) takes 67%. Both halves carry weight.

---

## URLs to queue in browser tabs (in order)

Open these tabs **before hitting record**, in this exact left-to-right order so `Cmd+Tab` walks them cleanly:

| # | URL | When |
|---|---|---|
| 1 | `file:///Users/ammar.robb/Documents/Web3/hackathons/hackquest-0g/docs/pitch-deck.html` | Shots 1–4 (deck) |
| 2 | `http://localhost:3000/protocol` | Shot 5 — grid |
| 3 | `http://localhost:3000/wagers/new` | Shot 6 — trader mint |
| 4 | `https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db` | Shot 6 — mainnet StrategyINFT proof |
| 5 | `http://localhost:3000/strategies/breached/insure` | Shot 7 — stake flow + TradeModal |
| 6 | `https://chainscan-galileo.0g.ai/tx/0x037c19ac6c14591ba61885dfd59b584565a31344682dbe084660f71a5a001d0a` | Shot 8 — Scenario A settle (kept promise, PolicyExpired event) |

**Backup chainscan URL** (Scenario B breach payout, swap into #6 if you prefer breach proof): `https://chainscan-galileo.0g.ai/tx/0x1eb35bfe372bcd23ca131ad0bad0d29c9faa7dcbe7fa8211d6a9777fcb6df67f`

---

## Setup before recording

- Pitch deck open in tab 1, press **F** to fullscreen Chrome on slide 1
- Wallet connected to **0G Mainnet** (chainId 16661, RPC `https://evmrpc.0g.ai`)
- All 6 tabs hydrated (each loaded once so no spinners mid-record)
- Resolution **1920×1080**, browser zoom 100%, bookmarks bar hidden (`⌘⇧B`), DND on, Slack/Discord quit
- Mic-test 3-second clip, listen back, confirm no clipping or room echo

**Narration voice:** confident, technical, ~2.3 words/sec, one-beat pauses between shots.

---

## Captions cheat-sheet (burn-in overlays in post)

| Shot | Position | Hold | Text |
|---|---|---|---|
| 1 | Top-left | 6s | `Orichalcos · 0G APAC · Track 2` |
| 2 | Bottom-center | last 4s | `verifiable performance · without revealed alpha` |
| 3 | Bottom-center | full | `Trader bonds · Challenger stakes · LP underwrites` |
| 4 | Bottom-center | last 5s | `Bond + Stake + Settlement · all on 0G Chain` |
| 5 | Top-right small | full | `localhost:3000/protocol · live on 0G mainnet` |
| 6 | Bottom-center | 5s on chainscan | `0G Chain (16661) · 4 of 5 0G components wired` |
| 6 | Top-right small | mint-form duration | `orichalcos.vercel.app/wagers/new` |
| 7 | Top-center | 5s on outcome cards | `Two outcomes · both pre-computed · settled on chain` |
| 7 | Bottom-right small | 4s on TradeModal | `0G Compute chatId · 0G Storage root · Hyperliquid L1 tx` |
| 8 | Bottom-center | 5s on PolicyExpired log | `PolicyExpired · LP +2.50 · Trader +3.75 · 60/40 split` |
| End | Full-screen | 2s | `Orichalcos · github.com/amrrobb/orichalcos · 0G mainnet 16661` |

**Style:** white text · JetBrains Mono or any condensed mono · 80% opacity black pill background (rounded 4px, padding 6px 12px) · brass `#d4a574` for URLs only. **Captions land after the spoken claim, not on top of it.**

---

## Part A — Pitch deck (0:00 – 1:00)

Pitch deck full-screen. Advance slides with **→** key.

### Shot 1 · Title (0:00 – 0:10)

**Tab:** 1 — pitch deck, slide 1
**Action:** Hold on the spinning brass sigil.
**Read aloud (10s):**

> "Orichalcos. A promise-kept market for AI trading agents. Built on 0G mainnet for the Agentic Trading Arena track."

---

### Shot 2 · The dilemma (0:10 – 0:25)

**Tab:** 1 — press **→** to slide 2
**Action:** Hold on the two-horns layout (Reveal vs Hide).
**Read aloud (15s):**

> "Every AI trader sits on one of two horns. Reveal the strategy, alpha decays. Hide it, no challenger can trust it. There has been no primitive for verifiable performance without revealed alpha — until now."

---

### Shot 3 · The three roles (0:25 – 0:40)

**Tab:** 1 — press **→** to slide 3
**Action:** Hold on the three-card layout (Bond · Stake · Settlement).
**Read aloud (15s):**

> "Three roles. A trader posts a USDC bond against a drawdown promise — verbatim, free text, sealed inside 0G Compute TEE. A challenger places a stake against the promise. An LP underwrites the float. Three primitives, one verifiable trail."

---

### Shot 4 · The mechanism (0:40 – 1:00)

**Tab:** 1 — press **→ → →** to slide 5 (skip slide 4 tech-stack to save time)
**Action:** Trace the six-step sequence with cursor, hold on the **60 / 40 split bar** at the bottom.
**Read aloud (20s):**

> "Bond, sealed promise in TEE, real Hyperliquid testnet fills, challenger stakes, breach or kept-promise, permissionless settlement. On breach, the bond pays the challenger. On a kept promise, the stake splits sixty-forty — trader earns yield for being right, LP earns the rest. No oracle, no admin. Now let me show you live on chain."

---

## Part B — App demo (1:00 – 3:00)

Switch from deck to the browser. App is on `http://localhost:3000` (or `https://orichalcos.vercel.app` if you prefer prod).

### Shot 5 · The grid (1:00 – 1:20)

**Tab:** 2 — `/protocol`
**Action:** Wait for grid to hydrate. Hover one card briefly to show the structure. Don't scroll yet.
**Visual cue:** 4+ active wager cards, each leading with **"Won't drop more than X%"** promise headline. The "Open a wager →" CTA visible top-right.

**Read aloud (20s):**

> "This is the live market on 0G mainnet, chain ID sixteen-six-sixty-one. Every card is a wager — a trader who's posted a bond against a drawdown promise. The headline reads the promise verbatim. The protocol is permissionless: anyone can mint a wager, anyone can stake against one, anyone can settle."

---

### Shot 6 · Trader mint + on-chain proof (1:20 – 1:50)

This shot has **two tabs** — the form, then the chainscan proof.

**Tab:** 3 — `/wagers/new` (form already pre-filled with default promise)
**Action (first 18s):** Highlight the **promise textarea** with cursor. Don't submit. Show the archetype dropdown, the bond/drawdown fields.

**Read aloud (18s):**

> "A trader writes their own promise. Free text. When they hit mint, we encrypt the promise to 0G Storage, run a real TEE inference inside Intel TDX on 0G Compute, verify the chatId via processResponse, and commit the result to an INFT on 0G Chain. Four 0G components, end-to-end."

**Tab:** 4 — `chainscan.0g.ai/address/0x443e…56db`
**Action (last 12s):** Switch tab. Hold on the StrategyINFT mainnet contract page. Scroll to recent transactions list so judges see real mint txs (#1 and #2) on chain.

**Read aloud (12s):**

> "And here it is on 0G mainnet — StrategyINFT contract, chainId sixteen-six-sixty-one. Every wager you saw on the grid is bonded to this contract. The most recent mints carry real TEE-verified chatIds and real 0G Storage merkle roots."

---

### Shot 7 · The stake flow + TEE provenance (1:50 – 2:25)

**Tab:** 5 — `/strategies/breached/insure` (slug resolver auto-lands on a breached wager)
**Action (first 18s):** Drag slider to **500 USDC** (or click the 500 chip). Premium pill flashes brass at 62.50 USDC. Hold on the **two outcome cards** side-by-side.

**Read aloud (18s):**

> "Now the challenger side. Pick a claim size — five hundred USDC. Stake is twelve and a half percent up front. Two outcomes pre-computed: if the trader breaks the promise, you claim from the bond, net plus four hundred thirty-seven. If they keep it, your stake pays the trader for being right."

**Action (last 17s — REQUIRED, not optional):** Scroll to the provenance ledger. **Click any one trade row** to open the TradeModal. Hold 4 seconds on the modal — three rows must be legibly on screen: **0G Compute TEE chatId**, **0G Storage merkle root**, **Hyperliquid L1 tx hash**.

**Read aloud (17s):**

> "And this is the trust layer. Every trade carries a TEE attestation chatId — sealed inference on 0G Compute. A 0G Storage merkle root for the reasoning bundle. And the actual Hyperliquid testnet transaction hash. No off-chain trust. Click the Hyperliquid link, you land on the real L1 fill."

---

### Shot 8 · Settled proof on chain (2:25 – 2:55)

**Tab:** 6 — `chainscan-galileo.0g.ai/tx/0x037c19ac6c…` (Scenario A settle tx)
**Action:** Hold on the transaction page. Scroll to the **EventLogs** section. Highlight the **PolicyExpired** decoded event — fields `premiumToLP = 2,500,000` (2.50 USDC) and `premiumToTrader = 3,750,000` (3.75 USDC).

**Read aloud (30s):**

> "And here's the proof. A wager that kept its promise. The settlement transaction emits PolicyExpired — premium to LP, two point five USDC; premium to trader, three point seven five USDC. That's the sixty-forty split, settled on chain by any wallet calling settleEpoch. Bond, stake, settlement — all verifiable. Orichalcos. Built for Track Two on 0G mainnet."

---

### End card (2:55 – 3:00)

**Visual:** Full-screen brass-on-black card.
**Text:**
```
Orichalcos
github.com/amrrobb/orichalcos · orichalcos.vercel.app
0G Mainnet · chainId 16661
StrategyINFT: 0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db
```

---

## Time budget (sums to 3:00 exact)

| Part | Shot | Duration | Cum |
|---|---|---|---|
| A — deck | 1 Title | 10s | 0:10 |
| A — deck | 2 Dilemma | 15s | 0:25 |
| A — deck | 3 Three roles | 15s | 0:40 |
| A — deck | 4 Mechanism | 20s | 1:00 |
| B — app | 5 Grid | 20s | 1:20 |
| B — app | 6 Mint + chainscan | 30s | 1:50 |
| B — app | 7 Stake + TradeModal | 35s | 2:25 |
| B — app | 8 Settled proof | 30s | 2:55 |
| End card | — | 5s | 3:00 |

If you overrun in Part A, **cut Shot 3 entirely** (Three roles) — Shot 4 already covers it in the narration. Saves 15s.

---

## Recording checklist

- [ ] Dev server `http://localhost:3000` is up (mainnet env)
- [ ] All 6 tabs loaded, no spinners
- [ ] Pitch deck full-screen on slide 1
- [ ] Wallet connected to 0G Mainnet (chainId 16661)
- [ ] `/protocol` grid shows real cards (not "Loading…")
- [ ] `/wagers/new` form pre-filled with default promise text
- [ ] `/strategies/breached/insure` slider drags + premium pill flashes
- [ ] Click test: any trade row on the provenance ledger opens TradeModal with chatId/root/HL hash visible
- [ ] Chainscan tabs reachable, EventLogs section expands
- [ ] Record at 1080p60, MP4 H.264, < 150 MB

## Post-record

- [ ] Trim dead air > 0.5s
- [ ] Burn in captions per the cheat-sheet table above
- [ ] Add 1-second brass-on-black title card at start: `Orichalcos · 0G APAC · Track 2`
- [ ] Add the End card text above as the closing 5s
- [ ] Upload to YouTube **unlisted** (or Loom), copy URL
- [ ] Paste URL into `submission/04-demo-video.md` and `README.md` title-block
