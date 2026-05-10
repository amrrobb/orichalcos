# Orichalcos — Design System

> Canonical visual spec. All UI work references this file.
> Locked decisions only. No "options" — Claude Code implements what's written here.

---

## 1. The Three Locked Decisions

| Decision | Choice |
|---|---|
| Palette | **Tempered Codex** (navy + brass + Cipher Amber moment-color + four element accents) |
| Typography | **Editorial Codex** (EB Garamond display + Inter Tight body + JetBrains Mono numerals) |
| Mark | **Quincunx Sigil** — four element glyphs around a central node, used as logo + favicon + watermark + Codex stamp |

---

## 2. Color Tokens

### CSS variables (drop into `globals.css`)

```css
:root {
  /* Surfaces */
  --surface-base: #0a1628;           /* Deep navy — primary background */
  --surface-raised: #0f1f3d;          /* Cards, modals */
  --surface-locked: #1a2c5c;          /* Sealed Apprentice tier */
  --surface-glass: rgba(15, 31, 61, 0.72);

  /* Primary accent (always-on) */
  --brass: #c9a961;                   /* Aged brass — frames, ornament, body accent */
  --brass-dim: #8a7240;               /* Muted brass — disabled, secondary text */
  --brass-bright: #e6c987;            /* Highlight brass — hover, focus rings */

  /* Moment color (use ONLY during Mind Reveal sequences) */
  --cipher-amber: #ffb547;            /* Decryption moment — appears only when reasoning unseals */
  --cipher-amber-glow: rgba(255, 181, 71, 0.4);

  /* Element accents (Champion-only — never used elsewhere) */
  --agni: #e85a3c;                    /* Bold / fire */
  --tirta: #3aa0d3;                   /* Patient / water */
  --bayu: #cdd6dd;                    /* Sharp / wind */
  --pertiwi: #8a6a3a;                 /* Stoic / earth */

  /* Neutrals */
  --ink: #ece6d5;                     /* Primary text on dark — bone-white */
  --ink-dim: #a8a394;                 /* Secondary text */
  --ink-faint: #5e5b51;                /* Tertiary, captions */
  --rule: rgba(201, 169, 97, 0.18);   /* Hairline gold rules */

  /* States */
  --win: #6aaa64;                     /* Apprentice won — used sparingly */
  --loss: #c4504c;                    /* Apprentice lost */
  --pending: var(--brass-dim);
}
```

### Tailwind config snippet (`tailwind.config.ts`)

```typescript
theme: {
  extend: {
    colors: {
      surface: {
        base: '#0a1628',
        raised: '#0f1f3d',
        locked: '#1a2c5c',
      },
      brass: {
        DEFAULT: '#c9a961',
        dim: '#8a7240',
        bright: '#e6c987',
      },
      cipher: {
        amber: '#ffb547',
      },
      element: {
        agni: '#e85a3c',
        tirta: '#3aa0d3',
        bayu: '#cdd6dd',
        pertiwi: '#8a6a3a',
      },
      ink: {
        DEFAULT: '#ece6d5',
        dim: '#a8a394',
        faint: '#5e5b51',
      },
    },
  },
}
```

### Color usage rules (NON-NEGOTIABLE)

- **Cipher Amber (`#ffb547`) appears ONLY during the Mind Reveal animation** — frames 3-4 of the decryption sequence. If it shows up anywhere else, it loses its meaning. This is the project's single most important color discipline.
- **Element colors appear ONLY on Champion cards (Agni/Tirta/Bayu/Pertiwi) and their dialogue frames.** Apprentice Type chips use brass-dim, not element colors. This keeps Champions visually distinct as the boss-tier opponents.
- **Brass is the universal accent.** Every gold-colored element across the app uses one of three brass shades (regular / dim / bright). Do not introduce new gold values.
- **Win/loss colors are used sparingly**, only on Codex feed entries and the immediate aftermath of a duel. Never as primary UI hue.

---

## 3. Typography

### Font stack

| Role | Font | Source | Weight |
|---|---|---|---|
| Display (headlines, hero, Apprentice names) | **EB Garamond** | Google Fonts | 500, 600, 700 |
| Body (UI, paragraphs, labels) | **Inter Tight** | Google Fonts | 400, 500, 600 |
| Numerals + hashes + addresses | **JetBrains Mono** | Google Fonts | 400, 500 |

### Google Fonts import (drop into `<head>` or `globals.css`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600;700&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### CSS font-family declarations

```css
:root {
  --font-display: 'EB Garamond', 'Times New Roman', serif;
  --font-body: 'Inter Tight', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
}

html {
  font-family: var(--font-body);
  font-feature-settings: "ss01" 1, "cv11" 1;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6,
.display {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.01em;
}

code, .mono, .numeral, [data-numeral] {
  font-family: var(--font-mono);
  font-feature-settings: "tnum" 1, "zero" 1;
  font-variant-numeric: tabular-nums;
}

.label,
[data-label] {
  font-family: var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--brass-dim);
}
```

### Type scale

| Token | Size | Line height | Used for |
|---|---|---|---|
| `display-hero` | 64px / 4rem | 1.0 | Landing page H1, "ORICHALCOS" wordmark |
| `display-1` | 48px / 3rem | 1.1 | Page titles, Champion names on Champion cards |
| `display-2` | 36px / 2.25rem | 1.2 | Modal titles, Mind Reveal moment text |
| `display-3` | 28px / 1.75rem | 1.3 | Section headers, Apprentice names on cards |
| `body-lg` | 18px / 1.125rem | 1.55 | Large body text, the public tell paragraph |
| `body` | 16px / 1rem | 1.55 | Default body text |
| `body-sm` | 14px / 0.875rem | 1.5 | Secondary body |
| `caption` | 13px / 0.8125rem | 1.4 | Captions, footnotes, timestamps |
| `label` | 12px / 0.75rem | 1.4 | Tracked uppercase labels — see `.label` class |
| `numeral-hero` | 56px / 3.5rem | 1.0 | ELO display on cards, big P&L on Codex |
| `numeral` | 16px / 1rem | 1.4 | Inline numerals — addresses, hashes, ELO deltas |

### Typography rules (NON-NEGOTIABLE)

- **All numerals use JetBrains Mono with `tnum` enabled.** ELO ratings, hashes, addresses, win/loss counts, timestamps. No exceptions.
- **All-caps small-caps labels use the `.label` class** — `text-transform: uppercase`, `letter-spacing: 0.18em`, brass-dim color. This is the Stripe / Anthropic editorial pattern.
- **Apprentice names use EB Garamond Display 600 weight.** Champion names use EB Garamond Display 700 weight + element-color underline. This typographic delta makes Champions feel distinctly more important than regular Apprentices.
- **The Mind Reveal type-up uses EB Garamond italic 500.** Italic is reserved for this single moment — the agent's "voice" emerging from encryption.
- **Body text never uses serif.** EB Garamond is display-only.

---

## 4. The Orichalcos Mark (Quincunx Sigil)

### Concept

Four overlapping circles arranged in a quincunx pattern (one center + four corners), each peripheral circle bearing one element glyph. The fifth (central) node is a small square representing the bound on-chain identity.

```
       ◯ Agni (top, fire)
        \
         ◯ ─── ◯  Tirta (right, water)
        /  ▢
   Bayu ◯       ▢ = central bound node
       (left,
        wind)
        \
         ◯ Pertiwi (bottom, earth)
```

### SVG specification

The Mark exists in three sizes. Use the appropriate one — never scale up the smaller one or the strokes get heavy.

**Mark Large (logo lockup, hero, share-cards):** 96×96px viewBox, 1.5px strokes, all four element glyphs visible inside circles.

**Mark Medium (header navigation, card watermarks):** 32×32px viewBox, 1px strokes, glyphs simplified to silhouettes.

**Mark Small (favicon, inline mentions):** 16×16px viewBox, the four element circles only — no central node, no glyphs.

### File deliverables

- `public/mark/mark-large.svg` — full quincunx with detailed glyphs
- `public/mark/mark-medium.svg` — simplified glyphs
- `public/mark/mark-small.svg` — circles-only version
- `public/favicon.ico` — derived from mark-small (16x16 + 32x32)
- `public/favicon.svg` — mark-small as SVG favicon
- `public/og-image.png` — 1200×675 share card with mark-large + wordmark

### Usage rules

- **The Mark and the wordmark together appear in the top-left of every page.** Never separate them in the primary nav.
- **Mark-medium watermarks appear on every Apprentice card,** bottom-center, at 24px size, in `--brass-dim` at 30% opacity.
- **Mark-small appears as a stamp** at the end of every Codex feed entry — confirming that duel was settled by the protocol.
- **Mark rotates slowly during loading states** — the four peripheral circles orbit the central node, 8-second rotation, ease-in-out timing.
- **The Mark is monochrome by default** (uses `--brass`). Element colors appear on the Mark only on Champion pages, where the corresponding peripheral circle glows with that Champion's element color.

### Rough SVG starter (Day 1 deliverable — refine later)

```svg
<!-- mark-large.svg, 96x96 viewBox -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="1.5">
  <!-- Center bound node -->
  <rect x="42" y="42" width="12" height="12" stroke-width="2"/>
  
  <!-- Four element circles (radius 14, positioned at compass points) -->
  <circle cx="48" cy="14" r="14"/>  <!-- Agni: top -->
  <circle cx="82" cy="48" r="14"/>  <!-- Tirta: right -->
  <circle cx="48" cy="82" r="14"/>  <!-- Pertiwi: bottom -->
  <circle cx="14" cy="48" r="14"/>  <!-- Bayu: left -->
  
  <!-- Connecting lines from center to each circle -->
  <line x1="48" y1="42" x2="48" y2="28"/>
  <line x1="54" y1="48" x2="68" y2="48"/>
  <line x1="48" y1="54" x2="48" y2="68"/>
  <line x1="42" y1="48" x2="28" y2="48"/>
  
  <!-- Element glyphs inside circles (refine these by hand or in Figma) -->
  <!-- Agni (fire): triangle pointing up -->
  <path d="M48 7 L54 19 L42 19 Z"/>
  <!-- Tirta (water): wave -->
  <path d="M75 48 Q78 45 82 48 T89 48"/>
  <!-- Pertiwi (earth): tilted square -->
  <rect x="44" y="78" width="8" height="8" transform="rotate(45 48 82)"/>
  <!-- Bayu (wind): spiral -->
  <path d="M14 48 a4 4 0 0 1 4 -4 a3 3 0 0 1 0 6 a2 2 0 0 1 -2 -2"/>
</svg>
```

This is a rough geometric starter. On Day 5 (frontend polish day), refine the element glyphs in Figma or hand-draw them with more character. Even the rough version above carries the identity if applied consistently.

---

## 5. The Apprentice Card

### Layout — 5:7 ratio (the "poster" treatment)

Card dimensions: **300×420px** at base scale (5:7 ratio). Scales up cleanly to 600×840 for hero/key art use.

```
┌─────────────────────────────────────┐
│ [Type chip]              [W:24-L:8]  │ <- top bar: type left, record right
│                                     │    Inter Tight, label class
├─────────────────────────────────────┤
│                                     │
│         Apprentice name              │ <- EB Garamond 600, 24px, ink
│         ──────────────────           │ <- thin brass rule
│         INITIATE / ADEPT / SAGE      │ <- label class, brass-dim
│                                     │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         [SOUL ORB]                   │ <- center hero block
│         (animated sigil if          │    sigil = abstracted glyph for
│          owned, sealed-blue          │    this Apprentice's "personality"
│          orb if not owned)          │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   ELO          1547                  │ <- big numeral, JetBrains Mono 500
│                                     │    "1547" at 56px (numeral-hero)
├─────────────────────────────────────┤
│ "publicTellPreview..." (italic)     │ <- last duel's tell, EB Garamond italic
│                                     │    body-sm, ink-dim
├─────────────────────────────────────┤
│ 0x77c0...8812          [Mark]        │ <- owner address (mono) + Mark watermark
└─────────────────────────────────────┘
```

### Card frame ornament — varies by Title tier

This is critical: **the Title tier is communicated by frame ornament density, not by background hue.** Hearthstone gemstone-rarity, but flat.

| Title | Frame ornament |
|---|---|
| **Initiate** | Plain brass hairline rule, 1px |
| **Apprentice** | Plain brass rule, 1.5px, with thin inner shadow line |
| **Adept** | Hairline rule + corner notches (4 small triangular cuts at corners) |
| **Master** | Double-rule + corner notches + thin filigree at top center |
| **Sage** | Double-rule + corner ornaments (small Mark-derived sigils) + filigree at top + bottom centers |

All ornament uses brass tones only — never element colors on standard Apprentice cards.

### Type chip (top-left of card)

A small pill showing Apprentice Type:
- Background: `--surface-locked`
- Border: 1px `--brass-dim`
- Padding: 4px 10px
- Font: Inter Tight 500, label class (uppercase, tracked)
- Text: `BOLD` / `PATIENT` / `SHARP` / `STOIC`
- Color: `--brass`
- No element-color background — keeping element colors reserved for Champions

### Soul Orb (center hero block)

An animated SVG / CSS sigil representing the Apprentice's locked personality.

**Sealed state (visitor view, not owner):**
- Solid `--surface-locked` colored disc, 120px diameter
- Inside: faint scrambled hex/Sanskrit characters slowly drifting (CSS animation, 60s loop)
- Subtle pulsing brass-dim glow (box-shadow keyframe, 4s loop)

**Owned state (the Trainer's view):**
- The Mark-medium SVG, slowly rotating (8s loop)
- Filled with a personality-derived gradient — hash the Apprentice's tokenId to pick a brass-tone gradient angle
- On hover: rotation speeds up to 4s; brass-bright glow appears

**Owned + after a victory:**
- Same as owned state plus a brief brass-bright "ping" emanating from the orb on render (mount animation)

### Champion card variant

Champions (Agni / Tirta / Bayu / Pertiwi) use a special variant:
- All Sage-tier ornament regardless of opponent's level
- Element-color underline beneath name (replaces standard brass rule)
- Soul Orb uses element color instead of brass — Agni's orb is `--agni` toned
- Background gets a subtle element-color gradient at 8% opacity (just enough to feel "themed")
- Type chip background is element color (the only place element colors appear on a card chip)
- Bottom of card adds a small "CHAMPION" label below the address

This makes Champions feel like boss-tier cards without abandoning the unified card grammar.

---

## 6. The Mind Reveal Animation

The single hero moment of the entire app. **Total duration: 5 seconds.** Triggered when a duel settles.

### The 5-frame sequence

**Frame 0 — Pre-state (continuous, before settle):**
- Both Apprentice cards face-up, side by side, `--brass` accents normal
- Pyth price-feed graph visible above arena
- Subtle brass animation: cards have a slow 2px breathing translateY

**Frame 1 — Hush (0.0s → 0.5s):**
- Arena background fades from `--surface-base` to `#000000`
- Both cards rotate 90° around Y-axis (CSS `transform: rotateY(-90deg)` for left card, `+90deg` for right)
- Pyth price feed line fades to mono brass-dim, all other UI desaturates
- Subtle bass-tone audio (optional, only if SFX enabled)
- All text on screen except `MIND REVEAL` label fades to 30% opacity
- The label "MIND REVEAL" appears at top center: EB Garamond italic 500, 36px, brass

**Frame 2 — Cipher cascade (0.5s → 2.0s):**
- Both cards rotate back to face-up
- Each card's Soul Orb explodes into scrambled characters — random hex chars, Sanskrit `अ ই ఎ ੲ`, glyph fragments
- Characters cascade downward inside the card area (CSS keyframe animation, 1.2s)
- Three "wax seal" SVG stamps slam down at bottom-center of each card — one stamp per second:
  - `[TEE]` — slate-grey hex, encryption icon
  - `[0G]` — ash-grey hex, storage icon  
  - `[Pyth]` — pearl-grey hex, oracle icon
- Each stamp drop: scale from 1.4 → 1 with subtle bounce, 0.3s, bass thump audio

**Frame 3 — Decryption resolve (2.0s → 3.5s):**
- The cipher cascade settles — characters resolve into readable text
- The text is each Apprentice's `publicTell` paragraph
- Color shift over the 1.5s: `--surface-locked` → `--cipher-amber` → `--brass`
- Type-up effect: characters appear one-by-one in EB Garamond italic 500, 18px (body-lg)
- Cipher-amber glow appears around each card during this frame ONLY — `box-shadow: 0 0 32px var(--cipher-amber-glow)`
- Audio: subtle ascending tone over the 1.5s (optional)

**Frame 4 — Verdict frame (3.5s → 4.5s):**
- Persona-5-style oblique slash sweeps across the arena
- The slash uses `--brass-bright` → `--cipher-amber` → transparent gradient
- Implementation: a fixed-position div with `clip-path: polygon(...)` and a transform animation
- Behind the slash, the winning Apprentice's card gains a thin brass-bright outline; losing card desaturates
- ELO delta animates as a Balatro-bouncing chunky number above the winner: `+24 ELO` in JetBrains Mono 500, numeral-hero size, brass-bright color, scale-bounce keyframe (1 → 1.3 → 1)
- Loser card gets a small "CRACKED" stamp in the corner (subtle red, never dominant)
- If a Title-up occurred: a brass ribbon unfurls below the winner's name showing the new Title

**Frame 5 — Settle (4.5s → 5.0s):**
- All transient effects fade
- The three wax seals (TEE, 0G, Pyth) settle into a permanent footer row beneath the duel record
- Cipher amber glow fades to none
- Cards return to normal state, but now show the new ELO and the new Title (if changed)
- The duel is now a Codex entry — the entire animation can be replayed from the Codex

### Implementation notes

- **Use Framer Motion for orchestration**, not custom JS. All five frames as `<motion.div>` with `animate` and `transition` props.
- **All durations are scriptable as `--reveal-1: 500ms; --reveal-2: 1500ms;` etc.** so you can dial up/down for the demo recording.
- **Audio is optional in v1** — the visual sequence carries the moment. If you have time on Day 5, add three wax-seal thump sounds and a subtle ascending tone for Frame 3.
- **The single screenshottable frame is Frame 3.** Make sure you can pause/freeze on a specific tick (e.g., 2.8s into the sequence) to capture a clean share-card.
- **For the demo video, repeat the Mind Reveal at most twice.** Once full-speed for the climax beat. Once in slow motion (50%) for the explanatory beat. Don't show it three times — diminishing returns.

### Wax seal SVG starters

```svg
<!-- TEE seal -->
<svg viewBox="0 0 80 80" stroke="currentColor" stroke-width="2" fill="none">
  <polygon points="40,8 72,24 72,56 40,72 8,56 8,24" stroke-width="2"/>
  <path d="M40 24v32M28 36h24M28 48h24" stroke-width="1.5"/>
  <text x="40" y="44" font-family="JetBrains Mono" font-size="9" text-anchor="middle" fill="currentColor" stroke="none" letter-spacing="0.1em">TEE</text>
</svg>

<!-- 0G seal -->
<svg viewBox="0 0 80 80" stroke="currentColor" stroke-width="2" fill="none">
  <polygon points="40,8 72,24 72,56 40,72 8,56 8,24" stroke-width="2"/>
  <circle cx="40" cy="40" r="14"/>
  <text x="40" y="44" font-family="JetBrains Mono" font-size="9" text-anchor="middle" fill="currentColor" stroke="none" letter-spacing="0.1em">0G</text>
</svg>

<!-- Pyth seal -->
<svg viewBox="0 0 80 80" stroke="currentColor" stroke-width="2" fill="none">
  <polygon points="40,8 72,24 72,56 40,72 8,56 8,24" stroke-width="2"/>
  <path d="M28 50 L40 26 L52 50 Z" stroke-width="1.5"/>
  <text x="40" y="62" font-family="JetBrains Mono" font-size="8" text-anchor="middle" fill="currentColor" stroke="none" letter-spacing="0.1em">PYTH</text>
</svg>
```

These are rough hexagonal frames. Refine in Figma on Day 5.

---

## 7. Two Registers — Arena vs. Codex

The single biggest discipline rule in the design: **the duel arena and the Codex/Marketplace use different visual registers.** This is what gives Orichalcos its narrative depth — game-feel for combat, terminal-feel for the audit ledger.

### Arena register (game-feel)

**Where it appears:** Landing page hero, Duel Stage, Apprentice detail pages, mint flow, Champion pages, Mind Reveal modal.

**Visual rules:**
- EB Garamond display headings throughout
- Ornamental brass frames on cards
- Generous whitespace, breathing animations
- Sound effects encouraged (if shipped)
- Layout uses centered, card-focused composition
- Aesthetic reference: Hades, Inscryption, Slay the Spire

### Codex register (terminal-feel)

**Where it appears:** Codex feed, Marketplace listings, Trial leaderboard, Reviewer notes, individual duel-record pages.

**Visual rules:**
- Inter Tight body throughout — no display serif
- JetBrains Mono for all numeric data
- Tight table-based layouts, dense rows
- No ornamental frames — just hairline brass rules
- Sticky table headers, sparkline charts
- Time-window tabs at top (24H / 7D / 30D / ALL)
- Aesthetic reference: Hyperliquid leaderboard, Nansen, Linear

### Transition pattern

When a user clicks from a Codex entry to the duel-replay view, the transition explicitly crosses registers — Codex fade out, brass-bright slash, Arena fade in (300ms). This crossing is felt, not just seen.

---

## 8. Component Tokens

### Spacing scale (Linear-derived 8px system)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;
--space-10: 128px;
```

### Border radii

```css
--radius-sm: 4px;       /* Type chips, small badges */
--radius: 8px;          /* Buttons, inputs */
--radius-lg: 12px;      /* Cards, modals */
--radius-card: 16px;    /* Apprentice cards */
```

### Shadow tokens

```css
--shadow-card: 0 1px 0 rgba(201, 169, 97, 0.08), 0 24px 48px rgba(0, 0, 0, 0.4);
--shadow-card-hover: 0 1px 0 rgba(201, 169, 97, 0.18), 0 32px 64px rgba(0, 0, 0, 0.5);
--shadow-modal: 0 32px 96px rgba(0, 0, 0, 0.7);
--shadow-cipher-glow: 0 0 32px var(--cipher-amber-glow);  /* Mind Reveal only */
```

### Animation timing

```css
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast: 150ms;
--duration-base: 250ms;
--duration-slow: 400ms;
--duration-reveal-step: 500ms;     /* One step of Mind Reveal */
```

---

## 9. Anti-Patterns Checklist (NEVER DO THESE)

Before shipping any UI, scan against this list. Each one is a tell that the project looks like a default hackathon submission.

- [ ] No shadcn/ui-out-of-the-box card components on Apprentice cards. Custom frames only.
- [ ] No Inter or Roboto Mono. Replaced with Inter Tight + EB Garamond + JetBrains Mono.
- [ ] No glassmorphism (`backdrop-filter: blur()` cards stacked on each other). Use solid `--surface-raised` instead.
- [ ] No purple gradient hero blob. Replaced by the Quincunx Sigil + brass on navy.
- [ ] No cyberpunk neon teal/magenta. Replaced by brass + Cipher Amber.
- [ ] No Lottie animation of generic "blockchain nodes." Replaced by the Mind Reveal animation as the hero piece.
- [ ] No floating 3D WebGL orbs. Replaced by the Soul Orb sigil.
- [ ] No emojis in body copy. Use SVG icons or labels only.
- [ ] No raw 0x... addresses unstyled. Always wrapped in a small chip with `tnum` and 4-char ellipsis (`0x77C0...8812`).
- [ ] No generic "AI assistant" speech-bubble chat UI. Reasoning is revealed through Mind Reveal, not chatted.
- [ ] No mixing Arena and Codex registers on the same page. Pick one per route.
- [ ] No rarity colors (gray/blue/purple/orange). Title tier is communicated by frame ornament density only.

---

## 9.5 Anti-Uniformity Rules — Make It Look Hand-Built

The single biggest tell of a vibe-coded AI-generated frontend is uniformity: perfect grids, default Tailwind borders, mathematically symmetrical layouts, every animation using the same easing, every card the same size. Orichalcos must look hand-built. Apply these rules everywhere.

### 9.5.1 Layout asymmetries (do not ship perfect grids)

The Apprentice browse page (`/apprentices`) must NOT use a uniform 4-column grid. Use a deliberate mixed layout:
- Sage-tier cards render at 1.2× scale (taller than neighbors)
- Cards have a `--card-rotation` CSS variable randomized between `-1.5deg` and `+1.5deg` at render time, so the page reads as a scattered table of evidence rather than a CMS feed
- Vertical spacing between rows is irregular: `gap-y-6 odd:mt-3 even:mt-7` or similar — the rhythm should feel placed, not auto-laid-out

The Type selection in the mint flow (`/apprentices/mint`) must NOT be a 2×2 grid. Use a 1+3 layout: one large featured Type card on the left (the most-played type that day, or default to Bold), three smaller stacked alternatives on the right. Or: use a 4-row vertical list with each row offset horizontally by `var(--space-4)` from the previous, like steps of a staircase.

The landing page hero is left-justified. The Mark is bottom-right of the viewport, large but offset from center, slightly clipped by the bottom edge — like a page bleed in print design. Never center the Mark in the hero.

### 9.5.2 Borders and ornament must not look default

Do NOT use `border border-yellow-500/40` for card frames. The brass frame is an SVG with deliberately inconsistent stroke widths — `stroke-width="1.4"` on top and left edges, `stroke-width="1.6"` on bottom and right, mimicking how real ink varies under pressure. Provide the brass frame as `public/frames/frame-{tier}.svg` and consume via `<img>` or inline SVG, not via Tailwind border utilities.

The corner ornaments on Master and Sage tiers are filigreed SVGs hand-drawn in Figma. They are NOT geometric. Each corner is slightly different from the others (rotated, mirrored, or with a small additional flourish on one corner only). Asymmetry across the four corners is intentional.

### 9.5.3 Typography quirks

Apprentice names render in EB Garamond with the OpenType `smcp` (small caps) feature enabled when shown on a card, but `smcp` disabled in the Codex feed and inline references. This split is visual hierarchy — the name is more "engraved" on its home card than when it appears in a list.

```css
.apprentice-name-on-card {
  font-feature-settings: "smcp" 1, "ss01" 1;
  letter-spacing: 0.04em;
}
```

The first letter of every Apprentice name on the card uses a drop-cap effect: 1.4× size, slightly raised baseline, brass-bright color. This is a serif convention from real grimoires. Implement via `::first-letter` selector.

Champion names also use `smcp` but with `letter-spacing: 0.08em` (wider) and a thin element-color underline that is NOT a `text-decoration: underline` — it is a hand-drawn SVG underline path placed beneath the name with a slight wobble. Provide as `public/ornament/champion-underline-{element}.svg`.

### 9.5.4 Hand-feel on the Soul Orb

The Soul Orb is the most-seen visual element after the card frame. It must NOT look like a CSS gradient circle.

Apply a `feTurbulence` SVG filter to roughen the orb's edge:

```svg
<filter id="orb-rough" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3"/>
  <feDisplacementMap in="SourceGraphic" scale="1.8"/>
</filter>
```

Each Apprentice's orb seed (the `seed` attribute) is derived from `tokenId % 17`, so different Apprentices have different edge wobble patterns. This is invisible-but-present detail.

When the orb is in sealed state, the cipher characters drifting inside it are NOT a clean `<text>` SVG. They are characters with `font-feature-settings: "ss03"` and `transform: skew(-3deg) translateY(var(--drift))` where `--drift` animates per-character with random offsets. The drift uses a `cubic-bezier` curve that is NOT one of the locked easing tokens — use a custom `cubic-bezier(0.6, 0.04, 0.98, 0.34)` for cipher drift only. This is the one place a non-tokenized easing is acceptable; it makes the cipher feel like ink in water.

### 9.5.5 Scripts: render Sanskrit and Aksara Jawa correctly

The Champion cards include their elemental name in original script as ornamental flourish, NOT as the primary label. Place the script in the bottom-right of the Champion card at `~14px`, brass-dim color, set off from the Romanized name by a thin gold rule.

| Champion | Devanagari | Aksara Jawa (verify before ship) |
|---|---|---|
| Agni | अग्नि | ꦄꦒ꧀ꦤꦶ |
| Tirta | तीर्थ | ꦠꦶꦂꦠ |
| Bayu | वायु | ꦧꦪꦸ |
| Pertiwi | पृथ्वी | ꦥꦼꦂꦠꦶꦮꦶ |

Day-7 task: have a Devanagari/Aksara reader verify these. If the verification cannot happen in time, ship Devanagari only and skip Aksara — wrong-script is worse than no script. Use the `Noto Sans Devanagari` and `Noto Sans Javanese` font families (free via Google Fonts).

### 9.5.6 Texture overlay — the vellum layer

A subtle paper-grain texture overlays the entire app at 4% opacity. Provide as `public/texture/vellum.png` (a 512×512 tileable PNG of warm-toned paper grain). Apply via:

```css
body::after {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url('/texture/vellum.png');
  background-size: 256px 256px;
  opacity: 0.04;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 9999;
}
```

This single layer makes the entire app feel material rather than digital. AI-generated UIs never have texture overlays — they are always perfectly clean.

The vellum texture is NOT applied during the Mind Reveal animation (set `body[data-mind-reveal] ::after { opacity: 0 }`) — the moment of cryptographic decryption is the one place the UI becomes pure digital, contrasting with the analog vellum elsewhere.

### 9.5.7 Number transitions — the CRT flicker

When an Apprentice's ELO updates after a duel, the number does NOT smooth-transition. Instead, render 3 frames (50ms each) of glitched cipher characters before snapping to the new value:

```
1547 → ?#?? → 1#?1 → 15#1 → 1571
```

Implement via Framer Motion with a `keyframes` array:

```javascript
animate={{
  display: ['inline', 'inline', 'inline', 'inline', 'inline'],
}}
transition={{
  duration: 0.2,
  times: [0, 0.25, 0.5, 0.75, 1],
}}
```

And swap the displayed text on each keyframe via `useState` driven by an interval. The flicker is a deliberate quirk that signals "this number is real, not interpolated."

### 9.5.8 Inter-card spacing on the duel stage

When two Apprentice cards face each other on the duel stage, the gap between them is NOT centered. The challenger card sits at `45%` of viewport width from left; the defender at `55%` from left. The 10% asymmetry creates a subtle "you are here" perspective — the user's Apprentice is closer to them. Reverse on Champion fights: the Champion gets the closer position because it dominates. This rule reverses based on whether the user owns the challenger (closer) or the defender (closer).

### 9.5.9 Hover and interaction states must vary by element type

Do NOT apply a uniform `hover:scale-105 hover:-translate-y-1` to every card. Each Type has its own hover signature:
- **Bold:** card lifts and tilts +1deg (eager)
- **Patient:** card descends 2px (deliberate)
- **Sharp:** card flickers brass-bright once then settles (instant)
- **Stoic:** card grows a 1px outer ring of brass-dim, no movement (defensive)

This is the kind of detail no AI tool produces by default because it requires the developer to think about character. Code each Type's hover separately; do not factor into a generic `<HoverCard>`.

### 9.5.10 Microcopy must read as voice, not landing-page

Replace every default-AI string with something that reads as written, not generated. Examples:

| Default AI string | Replace with |
|---|---|
| "Mint your first Apprentice in seconds" | "Forge a soul. Bind it. Send it to the trials." |
| "Trusted by 0G" | "Sealed by 0G. Verified by Pyth. Bound by ERC-7857." |
| "Get started" | "Begin a Trial" |
| "Connect Wallet" | "Bind Trainer" |
| "Loading..." | "Decrypting..." (in Mind Reveal context) or "Sealing..." (in mint context) |
| "Error: Transaction failed" | "The seal did not hold. The chain rejected this Trial." |
| "Coming soon" | "This binding is not yet woven." |
| "View all" | "See the full Codex" |

The microcopy is in-world. It treats the app as a real codex and the user as a real Trainer. AI tools never write copy this way because they default to SaaS-conventional phrasing.

### 9.5.11 The deliberate quirk — pick one and ship it

Every memorable application has one small intentional weirdness. Pick ONE of the following and ship it:

- **The vellum scuff:** every page has a single small "ink scuff" SVG mark in a different position per page-load (seed by route + day-of-year). Like a real codex page that has been handled.
- **The off-key chime:** the Mind Reveal's settlement chime is in C# minor, but the third chord shifts to F# — a deliberate dissonance that resolves in the type-up. Sound design that doesn't feel stock.
- **The breath:** the Mark sigil's rotation isn't constant — it pauses for a half-second every fourth rotation, like a breath. Subliminal.
- **The mismatched seal:** of the three wax seals (TEE / 0G / Pyth), one is rendered slightly larger than the others (15% bigger) and slightly off-axis. This is the TEE seal — it asserts dominance because it is the most cryptographically meaningful.

Recommended pick if you only ship one: **the breath** on the Mark sigil rotation. Lowest implementation cost, most-seen across all pages, hardest to attribute to anything specific (it just feels alive).

### 9.5.12 Do not use these libraries / patterns

The following are AI-tool defaults that signal "vibe-coded":

- `react-tilt` or any 3D-card-tilt library
- `framer-motion`'s default `fadeInUp` applied to scroll-revealed sections
- `aceternity-ui` components (the entire library is a tell)
- `react-particles` or any particle-background
- `tsparticles` cursor trails
- Any "magic gradient" hero blobs (`bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500`)
- `react-countup` for number animations (use the CRT flicker pattern instead)
- Any `lottie-react` animation that wasn't custom-made for Orichalcos
- `glassmorphism` cards (`backdrop-blur-md bg-white/10`)
- `next-themes` light-mode toggle (Orichalcos is dark-only — there is no light mode of a sealed grimoire)

If you find yourself reaching for any of the above, stop. The replacement is hand-built CSS or a custom SVG.

---

## 10. Day-by-Day UI Build Plan

This integrates into the main HANDOFF.md timeline.

### Day 1 (May 9)
- [ ] Apply CSS variables to globals.css
- [ ] Apply Tailwind config
- [ ] Drop in font links
- [ ] Build rough Quincunx Sigil SVG (use the starter above)
- [ ] Generate favicon files

### Day 2 (May 10)
- [ ] Build base layout with header (Mark + wordmark + nav)
- [ ] Build Apprentice card component (Initiate version)
- [ ] Implement label class + numeral class globally

### Day 3 (May 11)
- [ ] Build remaining Title-tier card variants (Apprentice, Adept, Master, Sage)
- [ ] Build Champion card variant (4 versions, one per element)
- [ ] Build Soul Orb component (sealed + owned states)

### Day 4 (May 12)
- [ ] Build Duel Stage layout (Arena register)
- [ ] Build Codex feed layout (Codex register)
- [ ] Refine the Quincunx Sigil glyphs (replace rough geometric starters)

### Day 5 (May 13)
- [ ] Build Mind Reveal animation (Framer Motion, 5 frames)
- [ ] Build wax seal SVGs (TEE, 0G, Pyth) — apply the mismatched-seal quirk if chosen
- [ ] Implement register-transition (Codex → Arena slash)
- [ ] Apply vellum texture overlay to entire app
- [ ] Implement CRT-flicker number transitions on ELO and stake displays

### Day 6 (May 14)
- [ ] Build Marketplace UI (Codex register)
- [ ] Build Mint flow (Arena register, 1+3 layout, NOT 2×2 grid)
- [ ] Polish landing page with hero animation, Mark offset bottom-right
- [ ] Apply per-Type hover signatures (Bold lift+tilt, Patient descend, Sharp flicker, Stoic ring)
- [ ] Apply card rotation randomization to Apprentice browse page
- [ ] Replace all default microcopy with in-world voice strings
- [ ] Generate share-card key art (1200×675 OG image)

### Day 7 (May 15)
- [ ] Verify Devanagari/Aksara Jawa scripts on Champion cards (or remove if unverifiable)
- [ ] Apply orb seed-based feTurbulence per Apprentice tokenId
- [ ] Add the chosen "deliberate quirk" (recommend: breath on Mark rotation)
- [ ] Final polish, accessibility check (focus states, contrast — `prefers-reduced-motion` respects)
- [ ] Demo recording session — capture the Mind Reveal as the hero shot
- [ ] Deploy to Vercel at orichalcos.xyz

---

## 11. Stop conditions

If you find yourself doing any of these, stop and reread this doc:

- Adding a new color outside the locked palette
- Reaching for a different font because "this section needs something different"
- Designing a new card layout for "special" Apprentices (no — Title ornament density covers all variation)
- Putting Cipher Amber anywhere outside the Mind Reveal sequence
- Putting element colors anywhere outside Champion cards/dialogue
- Mixing Arena and Codex visual languages on a single page
- Laying out anything as a perfectly symmetrical grid (2×2 Type chooser, 4-column Apprentice browse, 3-column features)
- Using `border` Tailwind utilities on card frames (frames are SVGs)
- Reaching for `react-tilt`, `aceternity-ui`, `tsparticles`, or any other AI-default library from section 9.5.12
- Writing copy that sounds like a SaaS landing page ("Get started in seconds", "Trusted by")
- Centering the Mark in the hero (it sits offset, partially clipped)
- Using `hover:scale-105` uniformly across all cards (each Type has its own signature)
- Smooth-transitioning the ELO number on duel settlement (use the CRT flicker pattern)
- Adding `next-themes` or any light-mode toggle

The discipline is the design. If a section feels too clean, it probably is — add a deliberate friction.
