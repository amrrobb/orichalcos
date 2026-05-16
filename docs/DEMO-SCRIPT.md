# Orichalcos — 3-Minute Demo Script

**Target:** 3:00 walkthrough video for 0G APAC submission, Track 2 (Agentic Trading Arena).

**Setup before recording:**
- Wallet: Galileo testnet, connected, holding USDC (use the in-app faucet if dry).
- Tabs open in order: `/` → `/strategies/settled` → `/strategies/breached` → `/strategies/breached/insure` → `/protocol`.
- Screen resolution: 1920×1080. Browser zoom 100%. Hide bookmarks bar.
- Audio: clean mic. No room echo.

**Narrator voice:** confident, technical, not breathless. Read each line at ~2.3 words/second. Pause one beat between shots.

---

## Shot 1 — Title / problem (0:00 – 0:25)

**Visual:** Landing page hero. Cursor still. Wax-seal sigil rotates softly.

**Narration (25s):**

> "AI trading agents are everywhere — and nobody can trust any of them. If you reveal the strategy, the alpha decays. If you don't, you can't verify it. This is Orichalcos: a *promise-keeping market* for autonomous AI trading agents on 0G."

**Beat after.** Scroll down to the "dilemma" two-card section. Pause 2 seconds on it.

---

## Shot 2 — The three roles (0:25 – 0:50)

**Visual:** Landing page roles section. Hover-pulse on each card briefly. Linger on Allocator (the brass ★ START HERE card).

**Narration (25s):**

> "Three roles, one protocol. A **trader** — human or AI agent — bonds USDC against a drawdown promise, sealed inside 0G's TEE. An **allocator** takes the other side by paying a small premium upfront. A **liquidity provider** underwrites the float and earns yield. If the trader keeps the promise, the premium splits sixty-forty between trader and LP. If they break it, the bond pays the allocator."

---

## Shot 3 — Strategy dossier, healthy (0:50 – 1:15)

**Visual:** Click into `/strategies/settled` (the on-track momentum scalper). Wait for hydration. Hover the seal medallion, then the spec strip, then linger on the equity curve as it animates in. Hover the green peak marker.

**Narration (25s):**

> "Every Strategy Agent is a dossier on chain. Strategy seventeen — a momentum scalper — is healthy this epoch, plus thirteen-point-eight percent across twelve attested trades. Each dot on this curve is a real fill on Hyperliquid testnet, signed inside 0G's TEE."

---

## Shot 4 — Verify-on-Hyperliquid moment (1:15 – 1:40)

**Visual:** Scroll to the Provenance ledger. **Click a trade row** to open the TradeModal. Show the three provenance fields: 0G TEE chatId, 0G Storage merkle root, Hyperliquid agent ledger link. **Click 'View agent's HL ledger'** — it opens a new tab on Hyperliquid testnet showing every fill the agent placed. Pause one beat on the list. Switch back.

**Narration (~25s):**

> "This is the trust layer. Every trade carries a TEE attestation, a storage merkle root, and a per-fill link to its actual Hyperliquid testnet transaction — not just the wallet, the specific order. The strategy stays sealed inside 0G's TEE. The fills are public. Forty-six real fills across eight strategies, every one independently verifiable on Hyperliquid's testnet explorer. No off-chain trust, no admin."

---

## Shot 5 — Breach state (1:40 – 2:05)

**Visual:** Navigate to `/strategies/breached` (the grid trader that crossed its threshold). Pause on the slim ochre breach-rule strip at the top. Scroll to chart — point at the red marker on trade #8 where the curve crosses the dashed threshold. Then scroll to the right-rail Settle card.

**Narration (25s):**

> "Strategy twenty crossed its drawdown promise at trade eight. The protocol flagged the breach in real time. Settlement is now permissionless — any wallet can call markBreach. The bond pays open policies first; whatever's left sweeps to the LP pool. The trader receives zero."

---

## Shot 6 — Buy coverage (2:05 – 2:35)

**Visual:** Navigate to `/strategies/breached/insure`. Slide the coverage amount slider to ~500. Show the dual-outcome cards updating live (premium pill flashes). Show the cart total. Click **Approve USDC** — toast shows the tx. Click **Buy Policy** — toast shows the buyPolicy tx. Brief pause on confirmation.

**Narration (30s):**

> "An allocator buys coverage. Pick a claim size, see the dual outcome computed live — what you get if the strategy breaches, what your cost of protection is if it doesn't. Approve USDC. Buy the policy. Two transactions, six seconds on 0G Galileo. You can settle this policy from the strategy page the moment markBreach fires."

---

## Shot 7 — Pitch close (2:35 – 3:00)

**Visual:** Cut back to landing page. Scroll to the "Live on 0G" section showing 4 strategies + their statuses. Then fade to the Track 2 fit slide from the pitch deck (or overlay the four tech-stack tiles: 0G TEE, 0G Storage, Hyperliquid, 0G Chain).

**Narration (25s):**

> "Orichalcos is purpose-built for Track Two: AI-driven perpetual strategy agents, sealed inference with TEE-based execution, front-running mitigation, and verifiable on-chain settlement. Five contracts on Galileo. Fifty passing tests. Three end-to-end scenarios walked live on chain — kept promise, breach, and LP yield — every settlement, every fill, verifiable in two clicks. Thanks for watching."

---

## Recording checklist

- [ ] Wallet connected, USDC > 1000
- [ ] Dev server running, no errors in console
- [ ] Onboarding modal dismissed (or use as the cold-open if it feels natural)
- [ ] `/strategies/breached` resolves to a strategy actually below threshold (check `/protocol`)
- [ ] `/strategies/settled` resolves to a healthy strategy with 12+ trades attested
- [ ] Hyperliquid testnet explorer agent-wallet page loads with visible fills (test before record)
- [ ] No "0xa22…" stale addresses visible anywhere
- [ ] Record at 1080p60, encode to MP4 H.264, target file size <150MB

## Post-record

- [ ] Cut any dead air longer than 0.5s
- [ ] Add a 1-second brass-on-black title card at the very start: "Orichalcos / 0G APAC / Track 2"
- [ ] Add a 1-second end card with: GitHub URL, live demo URL, contracts on Galileo (just chain ID 16602)
- [ ] Upload to YouTube as unlisted, paste link into hackathon submission form
