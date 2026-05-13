# PROMPT to paste into claude.ai

> Copy everything between the two `═════` lines verbatim into a new chat at
> https://claude.ai. Attach the files listed in `WHAT-TO-UPLOAD.md` before
> sending.

═══════════════════════════════════════════════════════════════════

I'm building Orichalcos — a risk-management protocol for autonomous AI trading agents. Hackathon submission for 0G APAC, deadline May 16. I have 3 days left.

## The problem you need to solve

A first-time visitor lands on `/strategies/20` (see attached screenshots) and bounces because they don't understand:
- what a "Strategy Agent" is
- whether they're the trader, allocator, LP, or just observer
- what "claim available" means or what to do
- why they care about the equity curve

The information is right but the **narrative is missing**. I need a UX redesign across 4 key pages so a cold visitor reads 30 seconds and knows exactly what role to play and where to click.

## What's locked (don't redesign these)

- **Product framing:** "Risk-management protocol for AI traders. Strategies stay sealed, capital stays safe, every trade is verifiable." See attached `WIREFRAMES.md`.
- **Three roles:** Trader (mints + bonds), Allocator (buys insurance), LP (deposits to pool). Allocator is the demo focus — "Start Here" for new visitors.
- **Brand aesthetic:** dark theme, brass accents (`#d4a574`), deep black background (`#0a0a0a`), Times New Roman serif for display, JetBrains Mono for numerics. Wax-seal feel — see `current-styles.css` for tokens.
- **4 pages:** `/`, `/protocol`, `/strategies/[id]`, `/strategies/[id]/insure`

## What I've tried

I built static HTML mockups for all 4 pages — see attached:
- `current-landing.html`
- `current-strategy-detail.html`
- `current-insure.html`

The mockups are OK but I'm not sure they're great. I want a second design pass that:

1. Keeps the same brand aesthetic and color tokens
2. Improves the narrative + visual hierarchy of the landing page hero
3. Makes the strategy detail page tell a clearer story — right now there's an equity curve, vault stats, sealed soul hash, breach banner, and trade table all competing for attention
4. Makes the buy-coverage flow feel less like "gambling odds" and more like "thoughtful insurance product"

## What I want from you

Generate ONE artifact: a single self-contained HTML file showing your redesigned version of the **strategy detail page** (the most-broken one — `/strategies/20`).

- Use only inline CSS, no React, no dependencies (zero-install demo)
- Match my brand tokens — pull them from `current-styles.css`
- Show me a different visual approach to the same content — surprise me, but stay within the dark + brass aesthetic
- Annotate your design decisions briefly in HTML comments at the top

After I see your artifact, I'll iterate with you on whichever piece I like, then we move to the other pages. Don't re-explain the protocol or the UX problem back to me — just design.

## Key details for realism

Demo strategy in screenshots is `#20 "Stoic / Grid"`:
- Bond: $1000, equity $790, threshold $800 (in breach)
- 10 trades on chain, all losing
- Trader address: `0x77C0…8812`
- Allocator wallet: `0x438F…2d5d`, has 9,987 USDC
- A real Hyperliquid order ID for trade #1 of strategy #17 is `52968867292` — resolves at https://app.hyperliquid-testnet.xyz/explorer/order/52968867292

═══════════════════════════════════════════════════════════════════

## After Claude's first response

Iterate by pointing at one element at a time. Examples:

> "I like the hero, change the three role cards to be horizontal not vertical."

> "The chart area is too small. Make it the visual centerpiece — vault stats can be a sidebar."

> "Drop the sealed soul card from primary view. It's confusing for first-time visitors."

> "The breach banner is too aggressive. Tone it down to a thinner notification strip at the top."

When you have HTML you love, save it as `~/Downloads/claude-redesign.html` and tell me about it — I'll port it into the React app.

## Stop conditions

- 30 minutes elapsed → commit to whatever's best so far
- 4-5 iterations on same page with diminishing returns → switch to manual edits
- Output worse than my mockups twice → wrong prompt, abandon Claude design path

The goal is a 30-min sprint to either get something noticeably better or confirm what I built is fine.
