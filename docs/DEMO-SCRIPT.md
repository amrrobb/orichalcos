# Orichalcos — 3-Minute Demo Script

**Target:** ≤ 3:00 walkthrough for 0G APAC submission, Track 2 (Agentic Trading Arena).
**Structure:** 1:00 pitch-deck intro (slides 1 → 2 → 3 → 5) → 2:00 app demo (5 shots).

Rule check: 0G requires the video to clearly show *how the 0G component is actually used* — slide-only videos rejected. Deck = 33% of runtime; app demo with on-screen chainscan + TEE provenance = 67%. Both halves carry weight.

---

## URLs to queue in browser tabs (in order)

Open these **before pressing record**, left-to-right so `Cmd+Tab` walks them cleanly:

| # | URL | When |
|---|---|---|
| 1 | `file:///Users/ammar.robb/Documents/Web3/hackathons/hackquest-0g/docs/pitch-deck.html` | Shots 1–4 |
| 2 | `http://localhost:3000/protocol` | Shot 5 |
| 3 | `http://localhost:3000/wagers/new` | Shot 6a |
| 4 | `https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db` | Shot 6b — mainnet StrategyINFT |
| 5 | `http://localhost:3000/strategies/breached/insure` | Shot 7 |
| 6 | `https://chainscan-galileo.0g.ai/tx/0x037c19ac6c14591ba61885dfd59b584565a31344682dbe084660f71a5a001d0a` | Shot 8 — PolicyExpired event |

---

## Setup before recording

- Pitch deck full-screen on slide 1 (`F` in Chrome)
- Wallet connected to **0G Mainnet** (chainId 16661, RPC `https://evmrpc.0g.ai`)
- All 6 tabs hydrated, no spinners
- Resolution 1920×1080, browser zoom 100%, bookmarks bar hidden, DND on
- Mic-test 3 seconds, listen back, confirm no clipping

**Voice:** confident, technical, ~2.3 words/sec, one-beat pauses between shots.

---

## How to use the captions below

Each shot has the spoken narration **broken into 3-5 word lines** — exactly how captions appear on YouTube / TikTok / Loom. Read each line as one breath. When uploading to YouTube → Subtitles → English → paste these blocks. The natural line breaks become caption breaks; YouTube auto-aligns timing to your speech.

You don't need a separate SRT file. The script *is* the caption source.

---

## Part A — Pitch deck (0:00 – 1:00)

Pitch deck full-screen. Advance slides with **→**.

### Shot 1 · Title (0:00 – 0:10)

**Tab:** 1 — slide 1 (brass sigil spinning)
**Action:** Hold.

**Captions / narration:**
> Orichalcos.
> A promise-kept market
> for AI trading agents.
> Built on 0G mainnet
> for the Agentic Trading Arena track.

---

### Shot 2 · The dilemma (0:10 – 0:25)

**Tab:** 1 — press **→** to slide 2
**Action:** Hold on the two-horns layout.

**Captions / narration:**
> Every AI trader
> sits on one of two horns.
>
> Reveal the strategy,
> alpha decays.
>
> Hide it,
> no challenger can trust it.
>
> No primitive
> for verifiable performance
> without revealed alpha —
> until now.

---

### Shot 3 · Three roles (0:25 – 0:40)

**Tab:** 1 — press **→** to slide 3
**Action:** Hold on the three-card layout (Bond · Stake · Settlement).

**Captions / narration:**
> Three roles.
>
> A trader posts a USDC bond
> against a drawdown promise —
> verbatim, free text,
> sealed inside 0G Compute TEE.
>
> A challenger places a stake
> against the promise.
>
> An LP underwrites the float.
>
> Three primitives,
> one verifiable trail.

---

### Shot 4 · The mechanism (0:40 – 1:00)

**Tab:** 1 — press **→ → →** to slide 5
**Action:** Trace the six-step sequence with cursor, hold on the **60 / 40 split bar**.

**Captions / narration:**
> Bond.
> Sealed promise in TEE.
> Real Hyperliquid testnet fills.
> Challenger stakes.
> Breach or kept promise.
> Permissionless settlement.
>
> On breach,
> the bond pays the challenger.
>
> On a kept promise,
> the stake splits sixty-forty —
> trader earns yield for being right,
> LP earns the rest.
>
> No oracle, no admin.
> Now let me show you live on chain.

---

## Part B — App demo (1:00 – 3:00)

Switch from deck to browser.

### Shot 5 · The grid (1:00 – 1:20)

**Tab:** 2 — `/protocol`
**Action:** Wait for grid to hydrate. Hover one card briefly to show the structure.
**Visual cue:** 4+ active wager cards, each leading with **"Won't drop more than X%"** promise headline. "Open a wager →" CTA top-right.

**Captions / narration:**
> This is the live market
> on 0G mainnet,
> chain ID sixteen-six-sixty-one.
>
> Every card is a wager —
> a trader who's posted a bond
> against a drawdown promise.
>
> The headline reads
> the promise verbatim.
>
> Permissionless:
> anyone mints,
> anyone stakes,
> anyone settles.

---

### Shot 6 · Trader mint + on-chain proof (1:20 – 1:50)

This shot uses **two tabs** — the form, then chainscan.

#### 6a — Mint form (1:20 – 1:38, 18s)

**Tab:** 3 — `/wagers/new`
**Action:** Highlight the **promise textarea** with cursor. Don't submit. Show the archetype dropdown, the bond/drawdown fields.

**Captions / narration:**
> A trader writes their own promise.
> Free text.
>
> When they hit mint,
> we encrypt the promise to 0G Storage,
>
> run a real TEE inference
> inside Intel TDX on 0G Compute,
>
> verify the chatId via processResponse,
> and commit the result to an INFT on 0G Chain.
>
> Four 0G components,
> end-to-end.

#### 6b — Chainscan mainnet contract (1:38 – 1:50, 12s)

**Tab:** 4 — `chainscan.0g.ai/address/0x443e…56db`
**Action:** Switch tab. Hold on the **StrategyINFT mainnet contract page**. Scroll to recent transactions so real mint txs are visible.

**Captions / narration:**
> And here it is on 0G mainnet.
> StrategyINFT contract,
> chainId sixteen-six-sixty-one.
>
> Every wager you saw on the grid
> is bonded to this contract.
>
> The most recent mints
> carry real TEE-verified chatIds
> and real 0G Storage merkle roots.

---

### Shot 7 · The stake flow + TEE provenance (1:50 – 2:25)

**Tab:** 5 — `/strategies/breached/insure`
**Action (first 18s):** Drag slider to **500 USDC** (or click the 500 chip). Premium pill flashes brass at 62.50 USDC. Hold on the two outcome cards.

**Captions / narration:**
> Now the challenger side.
>
> Pick a claim size — five hundred USDC.
> Stake is twelve and a half percent up front.
>
> Two outcomes pre-computed.
>
> If the trader breaks the promise,
> you claim from the bond,
> net plus four hundred thirty-seven.
>
> If they keep it,
> your stake pays the trader for being right.

**Action (last 17s — REQUIRED):** Scroll to provenance ledger. **Click any trade row** to open the TradeModal. Hold 4 seconds — three rows must be legibly on screen: **0G Compute TEE chatId**, **0G Storage merkle root**, **Hyperliquid L1 tx hash**.

**Captions / narration:**
> And this is the trust layer.
>
> Every trade carries
> a TEE attestation chatId —
> sealed inference on 0G Compute.
>
> A 0G Storage merkle root
> for the reasoning bundle.
>
> And the actual Hyperliquid
> testnet transaction hash.
>
> No off-chain trust.

---

### Shot 8 · Settled proof on chain (2:25 – 2:55)

**Tab:** 6 — `chainscan-galileo.0g.ai/tx/0x037c19ac6c…`
**Action:** Hold on transaction page. Scroll to **EventLogs**. Highlight the **PolicyExpired** decoded event: `premiumToLP = 2.50 USDC`, `premiumToTrader = 3.75 USDC`.

**Captions / narration:**
> And here's the proof.
> A wager that kept its promise.
>
> The settlement transaction
> emits PolicyExpired —
>
> premium to LP,
> two point five USDC.
>
> Premium to trader,
> three point seven five USDC.
>
> That's the sixty-forty split,
> settled on chain
> by any wallet calling settleEpoch.
>
> Bond, stake, settlement —
> all verifiable.
>
> Orichalcos.
> Built for Track Two on 0G mainnet.

---

### End card (2:55 – 3:00)

**Visual:** Full-screen brass-on-black:
```
Orichalcos
github.com/amrrobb/orichalcos · orichalcos.vercel.app
0G Mainnet · chainId 16661
StrategyINFT: 0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db
```

---

## Time budget

| Shot | Duration | Cumulative |
|---|---|---|
| 1 Title | 10s | 0:10 |
| 2 Dilemma | 15s | 0:25 |
| 3 Three roles | 15s | 0:40 |
| 4 Mechanism | 20s | 1:00 |
| 5 Grid | 20s | 1:20 |
| 6 Mint + chainscan | 30s | 1:50 |
| 7 Stake + TradeModal | 35s | 2:25 |
| 8 Settled proof | 30s | 2:55 |
| End card | 5s | 3:00 |

If you overrun, cut **Shot 3** first — Shot 4 already covers the three-role mechanic.

---

## Recording checklist

- [ ] Dev server `http://localhost:3000` is up (mainnet env)
- [ ] All 6 tabs loaded, no spinners
- [ ] Pitch deck full-screen on slide 1
- [ ] Wallet on 0G Mainnet (chainId 16661)
- [ ] `/protocol` grid shows real cards
- [ ] `/wagers/new` form pre-filled
- [ ] Slider on `/insure` drags + premium pill flashes
- [ ] TradeModal opens with chatId / 0G Storage root / Hyperliquid hash visible
- [ ] Chainscan tabs reachable, EventLogs expand
- [ ] Recording at 1080p60, MP4, < 150 MB

## Post-record

- [ ] Trim dead air > 0.5s
- [ ] 1-second brass-on-black title card at start
- [ ] End card text above as closing 5s
- [ ] Upload to YouTube **unlisted** (or Loom)
- [ ] In the YouTube subtitle editor, paste the "Captions / narration" blocks from each shot above — the line breaks become caption breaks
- [ ] Paste video URL into `submission/04-demo-video.md` and `README.md` title block
