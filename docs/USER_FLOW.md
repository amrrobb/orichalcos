# Orichalcos — User Flow Specification

> Defines every user journey the app must support. Each flow lists the screens, the states, and the click-by-click behavior. Reference DESIGN_SYSTEM.md for visual specifics.

---

## User Personas (Priority Order)

| Priority | Persona | What they do | Why they matter |
|---|---|---|---|
| 1 | **The Trainer** (you) | Mints an Apprentice, challenges Champions to climb the ranks | Demo's protagonist — every demo path runs through here |
| 2 | **The Spectator** (judge) | Watches the live trial feed, clicks duels to view replays + Mind Reveal | Most judges will be Spectators first, Trainers second |
| 3 | **The Buyer** (post-demo, MVP B only) | Browses tested Apprentices, buys one with verified track record | Closes the thesis loop — verifiable trust transfer |
| 4 | **The Returning Trainer** | Comes back, checks Apprentice's Codex history, queues another Trial | Demonstrates persistence + replayability |

---

## Site Map (Next.js 14 App Router)

```
/                              Landing page (hero + live feed)
/apprentices                   Browse all Apprentices
/apprentices/mint              Mint flow (Arena register)
/apprentices/[tokenId]         Apprentice detail page (Arena register)
/trials                        Trial log + leaderboard (Codex register)
/trials/champions              Champion roster (Arena register)
/trials/[duelId]               Single duel replay (Arena register, Mind Reveal replay)
/codex                         Full on-chain history feed (Codex register)
/marketplace                   Listed Apprentices for sale (Codex register, MVP B only)
/marketplace/list              Listing form (Codex register, MVP B only)
/about                         The 5-layer problem statement
```

---

## Flow 1 — Landing → Watch a Live Trial (The Spectator's Journey)

**Goal:** Within 15 seconds of arrival, the visitor understands what Orichalcos is and sees a Mind Reveal happen.

### Screen 1.1: Landing page (`/`)

**Above the fold:**
- Top-left: Mark + Orichalcos wordmark
- Top-right: nav (Apprentices, Trials, Codex, Marketplace, About) + Connect Wallet button
- Hero left side (60% width):
  - H1 in EB Garamond 600, display-hero size: "Trainers, not depositors. Apprentices, not vaults."
  - Subhead in body-lg: "A verifiable alternative to the unverifiable signal economy. Built on 0G."
  - Primary CTA brass button: "Mint your first Apprentice" → `/apprentices/mint`
  - Secondary CTA ghost: "Watch a Trial" → scrolls to live feed below
- Hero right side (40% width):
  - The Quincunx Sigil at large size (200×200), slowly rotating (8s loop)
  - Subtle brass-bright pulse on the central node every 4s (matches the sigil's "anchor" semantics)

**Mid-page (the live evidence wall):**
- Section header: "Why this exists" (label class), then display-2 "The unverifiable signal economy"
- Three statistic cards in a row (Codex register — terminal-like):
  - Card 1: "56%" numeral-hero / "of financial influencers produce negative returns" / source citation
  - Card 2: "69%" / "of finfluencer fraud victims lose money" / source citation
  - Card 3: "$11.3B" / "in U.S. crypto fraud losses, 2025" / source citation
- Below: brief paragraph linking to `/about` for the full 5-layer problem statement

**Lower-page (live feed):**
- Section header: "Live Trials" (label class)
- A card grid showing the most recent 4-6 settled duels — each card shows:
  - Two opposing Apprentice mini-portraits (Type chips visible)
  - The asset being predicted (e.g., "BTC/USD")
  - The outcome chip (winner highlighted, loser desaturated)
  - The three wax seals (TEE / 0G / Pyth) below — small, brass color
  - "View replay" link → `/trials/[duelId]`
- New duels stream in via WebSocket or polling (refresh every 15s) — new entries fade in from top
- Continuous attestation feed scrolling on the side: "✓ TEE attestation verified · 0x77c0...8812 · 23s ago"

**Below fold:**
- Section: "How it works" — 3 horizontal cards explaining mint → duel → reveal
- Footer: contracts addresses (mainnet + testnet), Mark, X / GitHub / Discord links

### Screen 1.2: Click "View replay" → `/trials/[duelId]`

- Page loads in Arena register
- Layout: two Apprentice cards face-to-face (opponent on left, challenger on right)
- Above them: Pyth price chart showing the 60-180s window of the duel
- Below them: settled outcome with timestamps
- A prominent "Replay Mind Reveal" button center-bottom

**Click "Replay Mind Reveal":**
- Page dims, the 5-frame Mind Reveal animation plays (5 seconds)
- After animation: both cards show their final state with the public tells visible
- Below cards: the three wax seals settle into place with their verification links (TEE attestation hash, 0G Storage CID, Pyth feed proof)
- Each wax seal is clickable → opens chainscan.0g.ai or 0G Storage explorer for verification

**Optional further actions:**
- "View Apprentice details" links on each card → `/apprentices/[tokenId]`
- "Watch live Trial Stage" → `/trials` (current live duels)

---

## Flow 2 — Mint an Apprentice (The Trainer's First Time)

**Goal:** A new Trainer mints their first Apprentice in 5 clicks.

### Screen 2.1: `/apprentices/mint` — Choose Type

**Layout (Arena register):**
- Page title (display-1): "Forge a New Apprentice"
- Sub-instruction (body-lg): "Choose your Apprentice's archetype. This cannot be changed after minting."
- Four large Type cards in a 2×2 grid:
  - Each card uses the standard Apprentice card layout but with placeholder content
  - Type chip prominently shown
  - Personality description in body-sm:
    - **Bold:** "High-conviction momentum trader. Loves volatility. Hates ranges."
    - **Patient:** "Mean-reversion adaptive. Fades extremes. Counter-trends."
    - **Sharp:** "Scalper. Tiny edges, near-instant exits. Micro-timeframe."
    - **Stoic:** "Defensive, drawdown-averse. Slow accumulation. Capital preservation."
  - Hover: card lifts (translateY -4px), brass-bright frame
- Below: "Continue with [Type]" button appears once a card is selected

### Screen 2.2: Naming + Soul Generation

**Layout:**
- Selected Type card stays in left-third
- Right two-thirds: form
  - Input field "Apprentice Name" (max 24 chars, EB Garamond display preview as you type)
  - Below: live preview of card with the entered name
  - Below name field: "Soul Generation" panel
    - Explanation text: "Your Apprentice's personality is generated inside a 0G Compute TEE, encrypted, and stored permanently. You will never read it directly. Only the enclave can decrypt it during duels."
    - Button: "Generate Soul (1 Sigil)" — calls 0G Compute → returns encrypted blob
    - During generation: button disables, Soul Orb in card preview cycles cipher cascade animation
    - On completion: encrypted soul hash appears beneath card, brass-bright "Soul sealed ✓" confirmation

### Screen 2.3: Mint confirmation

**Layout:**
- Page-wide modal overlay (Arena register)
- Apprentice card centered, 1.5× scale
- Below: summary of what's about to happen
  - "1. Encrypted soul uploaded to 0G Storage: [hash]"
  - "2. Apprentice INFT minted on 0G Aristotle"
  - "3. ELO initialized at 1200"
  - "4. Title set to INITIATE"
- Estimated cost: ~0.005 OG ($0.003)
- Buttons: "Confirm mint" (brass-bright primary) / "Cancel"

**On confirm:**
- Wallet popup for transaction signing
- Loading state: Mark spinner, "Minting..."
- On success: card pings (brass-bright glow), confetti-equivalent (3 small Mark sigils briefly orbit the card), "Apprentice [Name] forged" toast
- Auto-redirect to `/apprentices/[tokenId]` after 2 seconds

---

## Flow 3 — Trainer Challenges a Champion (The First Real Trial)

**Goal:** A Trainer with at least one Apprentice can challenge a Champion of matching Type and watch the Mind Reveal.

### Screen 3.1: `/apprentices/[tokenId]` — Apprentice detail

**Layout (Arena register):**
- Top section: Apprentice card at hero scale (1.5×)
- To the right: stats panel
  - ELO: numeral-hero
  - Win rate: percentage with color-coded bar (brass = neutral, win-green if > 50%, loss-red if < 50%)
  - Last 5 results: small chips (W/L sequence in mono)
  - Title progression: visual indicator showing Initiate → ... → Sage with current position highlighted
  - Stake balance for this Apprentice (in OG)
- Below: "Recent Trials" — last 5 duel cards in horizontal scroll
- Bottom section: action bar
  - Primary CTA: "Challenge a Champion" → opens Trial Selection modal
  - Secondary: "Find a sparring partner" (PvP, lower priority)
  - Tertiary: "List for sale" (MVP B only)

### Screen 3.2: Trial Selection modal

**Layout:**
- Modal title: "Choose your Trial"
- Four Champion cards in a 2×2 grid (Champion variants — element colors visible)
- Each card hover-able, click selects
- Below: trial parameters
  - Asset to predict: dropdown (default: BTC/USD; options: ETH/USD, BTC/USD, SOL/USD)
  - Window: dropdown (default: 60s; options: 60s, 90s, 120s, 180s)
  - Stake: input in OG (default: 0.01)
- Cost summary showing:
  - Stake: 0.01 OG
  - 0G Compute call (TEE inference x2): ~0.001 OG
  - Pyth oracle update: ~0.0001 OG
  - Gas: ~0.0005 OG
  - **Total: ~0.0116 OG**
- Buttons: "Begin Trial" (brass-bright) / "Cancel"

### Screen 3.3: `/trials/[duelId]` — Live Duel Stage

**Layout (Arena register, full-screen takeover):**
- Background dimmed
- Top: Pyth price chart, live updating (recharts, brass line on dark)
  - Asset name + current price in numeral-hero
  - Window countdown: "00:47" remaining
- Left card: User's Apprentice
- Right card: Champion (e.g., Agni)
- Center: large Quincunx Sigil rotating, brass-dim until commits land
- Below cards: status bar showing pipeline progress:
  - [ ] Sealed Souls fetched from 0G Storage
  - [ ] TEE inference begun (challenger)
  - [ ] TEE inference begun (defender)
  - [ ] Direction commits on-chain
  - [ ] Settlement window
  - [ ] Pyth settlement transaction
  - [ ] Outcome computed
- Each step lights up brass-bright as it completes
- When commits land: each card's Soul Orb shows "Sealed" state (encrypted blob hash visible)
- When settlement completes: **Mind Reveal animation triggers automatically**

### Screen 3.4: Post-Duel Outcome

**After Mind Reveal completes (5 seconds):**
- Both cards show their public tells in italic EB Garamond
- Winner card has brass-bright outline; loser desaturates slightly
- ELO delta numbers visible above each card (e.g., "+24 ELO" / "-18 ELO")
- If Title-up occurred: brass ribbon below winner's name with new Title
- Below cards: full attestation panel
  - TEE attestation hash with chainscan link
  - 0G Storage CID for each public tell
  - Pyth price proof
  - Block timestamps
- Action bar:
  - "Challenge again" (same Champion)
  - "Try a different Champion"
  - "View Codex entry"
  - "Share to X" (opens pre-filled X post with screenshot of cards)

---

## Flow 4 — Codex Feed (The Spectator's Deeper Dive)

**Goal:** A Spectator can browse the entire on-chain history, filter by Apprentice or Type or Title, and verify any duel.

### Screen 4.1: `/codex` — Full feed

**Layout (Codex register — terminal-feel):**
- Page title (display-2): "The Codex"
- Sub: "Every Trial, every outcome, every signature. Immutable on 0G."
- Filter bar (sticky):
  - Time tabs: 24H / 7D / 30D / ALL
  - Type filter: All / Bold / Patient / Sharp / Stoic
  - Title filter: All / Initiate+ / Apprentice+ / Adept+ / Master+ / Sage
  - Search: by Apprentice name or token ID
- Table columns (JetBrains Mono numerals throughout):
  - Trial ID (mono, 0x prefix, 4-char ellipsis)
  - Date/time
  - Challenger Apprentice (name + Type chip)
  - Defender Apprentice
  - Asset
  - Outcome (W/L for challenger)
  - ELO Δ challenger / defender
  - Stake
  - Verify (3 mini wax seals — TEE / 0G / Pyth — clickable)
- Hover row: full row highlights brass-dim background
- Click row: navigates to `/trials/[duelId]` (replay)

**Sparkline column (right side):**
- Optional small sparkline showing the price chart of that duel (recharts)

**Pagination:**
- 50 rows per page, infinite scroll on mobile
- "Load more" button at bottom of desktop view

### Screen 4.2: Verify modal (click on wax seal)

**Layout (small modal):**
- Title: "[TEE] Attestation Verification" (or 0G / Pyth)
- For TEE: shows attestation hex, signing key, model identifier, verification status
- For 0G: shows the storage CID, the merkle root, current accessibility on 0G Storage
- For Pyth: shows the Pyth price feed ID, the price at commit, the price at settle, the proof
- Each shows a "View on chainscan.0g.ai" external link

---

## Flow 5 — Buy a Tested Apprentice (Marketplace, MVP B Only)

**Goal:** A Buyer can browse Apprentices listed for sale, see their verified track record, and buy with confidence.

### Screen 5.1: `/marketplace` — Listings

**Layout (Codex register):**
- Page title (display-2): "Tested Apprentices"
- Sub: "Verified track records. Bound on-chain. No screenshots."
- Filter bar:
  - Min ELO slider (1200-2200)
  - Min Title (Apprentice / Adept / Master / Sage)
  - Type filter
  - Sort: Recent / Price asc / Price desc / ELO desc
- Listings table:
  - Mini Apprentice card thumbnail
  - Name + Type chip
  - Title (with ornament density visible in mini-card)
  - ELO (numeral-hero)
  - W-L record
  - Last 5 results sparkline
  - Asking price in OG
  - Seller address (4-char ellipsis)
  - "View" button → `/apprentices/[tokenId]?fromMarketplace=true`

### Screen 5.2: Apprentice detail with marketplace context

**Standard apprentice detail page** (Flow 3.1) but with additional sections:
- Above the standard layout: "Listed for sale" banner
- Asking price prominently displayed: e.g., "0.5 OG" in numeral-hero brass-bright
- "Buy Now" CTA button (brass-bright primary)
- Below standard layout: extended Codex view showing this Apprentice's full duel history
  - Defaults to 30D; user can change to 7D / 24H / ALL
  - Includes the sparkline showing ELO trajectory over time
  - Win/loss ratio breakdown by Type opponent

### Screen 5.3: Purchase confirmation

**Modal:**
- Title: "Purchase [Apprentice Name]"
- Summary:
  - "You will receive: [Apprentice card]"
  - "You will pay: 0.5 OG (~$0.30)"
  - "Protocol fee (5%): 0.025 OG"
  - "Total: 0.525 OG"
- Verifiable claims highlighted:
  - "Verified ELO: 1547"
  - "Verified Trials: 32 (24 wins, 8 losses)"
  - "Title: Adept"
  - "Sealed Soul intact: ✓"
- Buttons: "Confirm purchase" / "Cancel"

**On confirm:**
- Wallet popup
- Loading: Mark spinner
- On success: ownership transfers, redirect to `/apprentices/[tokenId]` now showing the Buyer as owner
- Confetti-equivalent (Mark sigils orbit), "Apprentice acquired" toast

---

## Flow 6 — About Page (For Judges Who Want the Thesis)

**Goal:** A judge or skeptic can read the full 5-layer problem statement, see the evidence, and understand why this matters.

### Screen 6.1: `/about`

**Layout (mixed — primarily Arena register but with Codex-style data sections):**

**Hero section:**
- Display-hero: "Why Orichalcos exists"
- Sub: "The unverifiable signal economy is a $11.3B problem. Here's how we close it."

**Layer 1 — Definition (one paragraph, body-lg):**
- The "definition" sentence from HANDOFF Section 2 Layer 1

**Layer 2 — Why this exists (three cards):**
- Three horizontal cards, each one a "Cause"
- Each card has the cause name, the explanation paragraph, and the academic citation in caption
- Causes 1, 2, 3 from HANDOFF Section 2 Layer 2

**Layer 3 — Evidence (data table in Codex register):**
- Section heading: "The evidence"
- Statistics in JetBrains Mono numeral-hero, with citations beneath
- Named cases (Kim Kardashian, BitConnect, Indra Kenz) as small cards with brief descriptions

**Layer 4 — Why existing solutions don't solve it (table):**
- Two-column comparison table
- Existing solution → Why it fails

**Layer 5 — How Orichalcos solves it (mechanism diagram):**
- Three columns, one per Cause
- Each column shows: Cause → 0G Component → Mechanism
- Visual: arrows from cause to component to mechanism

**Footer of about page:**
- "Read the full README" link to GitHub
- "Watch the demo" link to YouTube
- Citations in full (academic papers, regulator documents)

---

## Loading States

All loading states use the rotating Quincunx Sigil at appropriate scale:
- Page-load: Mark large in center, "Loading..." label below
- Card-load: Mark medium in card center
- Inline spinner: Mark small rotating
- Form submission: Mark medium next to button text

---

## Empty States

| Where | Empty state design |
|---|---|
| `/apprentices` (no Apprentices yet) | Mark large, "No Apprentices forged yet. Start your trainer journey →" CTA to mint flow |
| `/codex` (no duels) | Mark large, "The Codex awaits its first entry. Begin a Trial →" |
| `/marketplace` (no listings) | Mark large, "No Apprentices listed. Train one to Adept and list it →" |
| Specific Apprentice with no duels | Within Apprentice detail page: "This Apprentice has not yet faced a Trial. Challenge a Champion →" |

---

## Error States

| When | Display |
|---|---|
| Wallet not connected | "Connect wallet to continue" — primary brass button reroutes |
| Wrong network | "Switch to 0G Aristotle (or Galileo Testnet)" — auto-prompt MetaMask network switch |
| Transaction rejected | Toast in loss-red: "Transaction cancelled" |
| Transaction failed | Toast in loss-red: "Transaction failed: [reason]" + "Retry" button |
| TEE inference timeout | "Sealed Inference timed out. Retrying..." with spinner; max 3 retries; finally fall to "TEE unavailable. Try again in a moment." |
| 0G Storage upload failure | "Storage upload failed. Retrying..." |
| Pyth feed stale | "Pyth feed unavailable. Settlement paused — please retry in 30s" |

---

## Mobile Responsiveness (Stretch — Day 7 if time permits)

| Breakpoint | Behavior |
|---|---|
| < 640px (mobile) | Single-column everywhere; cards stack; Codex table becomes scrollable horizontally; Mind Reveal animation reduces to 3 frames (skip oblique slash); landing hero loses sigil rotation |
| 640-1024px (tablet) | 2-column grids; full Mind Reveal animation; sticky filters on Codex |
| > 1024px (desktop) | Full 4-column grids on Apprentice browse; full feature set; this is the primary target for demo recording |

**Recommendation: Build for desktop only in v1. Mobile is a Day 7 polish task or post-submission.**

---

## Accessibility minimums

- All interactive elements: visible focus state with brass-bright outline
- All images/sigils have alt text
- Color contrast ≥ 4.5:1 on body text
- Mind Reveal: respect `prefers-reduced-motion` — skip cipher cascade, just type-up the reasoning
- Keyboard navigation: tab order makes sense across landing → cards → modals
- Screen reader: card content reads in logical order (name → Type → Title → ELO → record)
