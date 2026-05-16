# Orichalcos — Project Structure

> The canonical file tree, naming conventions, and code-organization patterns. Reference when creating new files or wondering where something belongs.

---

## 1. Top-Level Repository Layout

```
orichalcos/
├── .github/
│   └── workflows/
│       └── ci.yml                        # Lint + test on push
├── contracts/                            # All Solidity contracts
│   ├── ApprenticeINFT.sol
│   ├── ScryingDuel.sol
│   ├── Codex.sol
│   ├── ApprenticeMarket.sol              # MVP B only
│   ├── MockPyth.sol                       # Testnet only
│   └── interfaces/
│       ├── IERC7857.sol
│       └── IPyth.sol                      # From @pythnetwork/pyth-sdk-solidity
├── test/                                 # Hardhat tests
│   ├── ApprenticeINFT.test.ts
│   ├── ScryingDuel.test.ts
│   ├── Codex.test.ts
│   └── e2e/
│       └── full-duel-flow.test.ts
├── scripts/                              # Deploy + admin scripts
│   ├── deploy-galileo.ts
│   ├── deploy-aristotle.ts
│   ├── mint-champions.ts                  # Mint Agni/Tirta/Bayu/Pertiwi
│   └── verify-contracts.ts
├── deployments/                          # Address output per network
│   ├── galileo.json
│   └── aristotle.json
├── agent-runner/                         # Off-chain orchestration (Node.js)
│   ├── src/
│   │   ├── index.ts                       # Entry point
│   │   ├── duel-loop.ts                   # Main duel orchestration loop
│   │   ├── champion-runner.ts             # Continuous Champion Trial loop
│   │   ├── tee-inference.ts               # 0G Compute SDK wrapper
│   │   ├── storage.ts                      # 0G Storage SDK wrapper
│   │   ├── pyth.ts                         # Pyth Hermes client wrapper
│   │   ├── contracts.ts                    # ABI + viem clients
│   │   ├── config.ts                       # Env loader, network config
│   │   ├── soul-encryption.ts              # AES-256-GCM utilities
│   │   ├── prompts/
│   │   │   ├── bold.txt
│   │   │   ├── patient.txt
│   │   │   ├── sharp.txt
│   │   │   └── stoic.txt
│   │   └── champions/                      # Champion personalities (hand-tuned)
│   │       ├── agni.json
│   │       ├── tirta.json
│   │       ├── bayu.json
│   │       └── pertiwi.json
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                             # Next.js 14 app
│   ├── app/
│   │   ├── layout.tsx                     # Root layout with header + Mark
│   │   ├── page.tsx                        # Landing
│   │   ├── globals.css                     # Design system tokens
│   │   ├── apprentices/
│   │   │   ├── page.tsx                   # Browse
│   │   │   ├── mint/page.tsx              # Mint flow
│   │   │   └── [tokenId]/page.tsx         # Apprentice detail
│   │   ├── trials/
│   │   │   ├── page.tsx                   # Live trials
│   │   │   ├── champions/page.tsx         # Champion roster
│   │   │   └── [duelId]/page.tsx          # Single duel replay
│   │   ├── codex/page.tsx                  # Full ledger
│   │   ├── marketplace/                    # MVP B only
│   │   │   ├── page.tsx
│   │   │   └── list/page.tsx
│   │   └── about/page.tsx                  # 5-layer problem statement
│   ├── components/
│   │   ├── apprentice/
│   │   │   ├── ApprenticeCard.tsx          # The 5:7 poster card
│   │   │   ├── ChampionCard.tsx             # Element-themed variant
│   │   │   ├── SoulOrb.tsx                 # Center hero block
│   │   │   ├── TitleProgress.tsx           # Initiate → Sage indicator
│   │   │   └── TypeChip.tsx                # Bold/Patient/Sharp/Stoic chip
│   │   ├── duel/
│   │   │   ├── DuelStage.tsx               # Two-card face-off layout
│   │   │   ├── MindReveal.tsx              # The 5-frame animation
│   │   │   ├── WaxSeal.tsx                 # TEE / 0G / Pyth stamp SVG
│   │   │   ├── PriceChart.tsx              # Pyth feed visualization
│   │   │   └── PipelineStatus.tsx          # Step-by-step status bar
│   │   ├── codex/
│   │   │   ├── CodexFeed.tsx               # Table-based feed
│   │   │   ├── DuelRow.tsx                 # Single row in feed
│   │   │   ├── VerifyModal.tsx             # Wax-seal verify dialog
│   │   │   └── TimeWindowTabs.tsx          # 24H / 7D / 30D / ALL
│   │   ├── marketplace/                    # MVP B only
│   │   │   ├── ListingCard.tsx
│   │   │   └── PurchaseModal.tsx
│   │   ├── ui/                             # Shared primitives
│   │   │   ├── Mark.tsx                     # The Quincunx Sigil
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── NumeralDisplay.tsx          # tnum monospaced
│   │   │   ├── AddressChip.tsx             # 0x77c0...8812
│   │   │   ├── LoadingMark.tsx             # Rotating Mark spinner
│   │   │   └── Section.tsx
│   │   └── layout/
│   │       ├── Header.tsx                  # Mark + nav + wallet
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── wagmi.ts                        # wagmi config + chains
│   │   ├── contracts.ts                    # Type-safe contract hooks
│   │   ├── 0g-storage.ts                   # Read-only 0G Storage client
│   │   ├── format.ts                       # Number/address formatters
│   │   └── constants.ts                    # Type/Title labels, asset names
│   ├── hooks/
│   │   ├── useApprentice.ts                # Read Apprentice data
│   │   ├── useDuel.ts                      # Read duel state
│   │   ├── useCodex.ts                      # Paginated feed
│   │   ├── useMintApprentice.ts            # Write — mint flow
│   │   ├── useChallengeDuel.ts             # Write — challenge
│   │   └── useDuelEvents.ts                # Subscribe to events
│   ├── public/
│   │   ├── mark/
│   │   │   ├── mark-large.svg
│   │   │   ├── mark-medium.svg
│   │   │   └── mark-small.svg
│   │   ├── favicon.ico
│   │   ├── favicon.svg
│   │   ├── og-image.png                    # 1200×675 share card
│   │   └── seals/
│   │       ├── tee.svg
│   │       ├── 0g.svg
│   │       └── pyth.svg
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── .env.local.example
├── docs/                                 # Engineering specs
│   ├── DESIGN_SYSTEM.md                   # Visual identity
│   ├── USER_FLOWS.md                        # Click-by-click journeys
│   ├── SYSTEM_ARCHITECTURE.md              # Services + data flow
│   └── PROJECT_STRUCTURE.md                # This file
├── legacy/                               # Archived v1 code (read-only reference)
│   └── README.md                           # Why this exists, link to old contracts
├── HANDOFF.md                            # Strategic project spec
├── README.md                              # Public-facing project README (final, Day 7)
├── hardhat.config.ts                      # Hardhat config (root level — handles contracts/)
├── package.json                            # Root pnpm workspaces config
├── pnpm-workspace.yaml
├── .gitignore
└── .env.example                           # Root-level env example
```

---

## 2. Naming Conventions

### Solidity contracts
- Contract names: PascalCase, descriptive (`ApprenticeINFT`, not `AINFT`)
- Function names: camelCase (`commitDirection`, not `CommitDirection`)
- Internal/private functions prefix with `_` (`_calculateNewElo`)
- Events: PascalCase past tense (`DuelChallenged`, `DuelSettled`, never `OnDuelChallenged`)
- Modifiers: lowercase camelCase (`onlyCodex`, `onlyDuelContract`)
- Errors: PascalCase ending in `Error` (`InvalidStakeError`, not `InvalidStake`)
- Storage variables: lowercase camelCase, prefix `s_` for state (`s_duels`, `s_apprentices`)
- Constants: SCREAMING_SNAKE (`MIN_STAKE`, `BASE_ELO`)

### TypeScript
- Files: `kebab-case.ts` (not `kebabCase.ts` or `KebabCase.ts`)
- Components: `PascalCase.tsx` (`ApprenticeCard.tsx`)
- Hooks: `useCamelCase.ts` (`useApprentice.ts`)
- Type definitions: PascalCase, prefix `T` discouraged but allowed (`Apprentice` or `ApprenticeData`, not `IApprenticeData`)
- Enum values: PascalCase (`Type.Bold`, `Title.Initiate`)

### CSS / Tailwind
- All design tokens via CSS custom properties (`--brass`, not arbitrary `text-[#c9a961]`)
- Tailwind classes ordered: layout → spacing → sizing → background → border → text → effects
- Custom classes: kebab-case (`mind-reveal-cipher`, `apprentice-card`)
- Component-scoped styles via Tailwind only — no CSS modules

### Asset files
- SVGs: kebab-case (`mark-large.svg`, `wax-seal-tee.svg`)
- Images: kebab-case with descriptive name (`apprentice-bold-portrait.png`)

---

## 3. Where Things Live (Decision Tree)

### "I need to add a new contract"
→ `contracts/MyContract.sol`. Inherit from existing patterns. Add tests in `test/MyContract.test.ts`. Update deploy scripts.

### "I need to add a new page/route"
→ `frontend/app/[route]/page.tsx`. Use the appropriate register (Arena vs Codex per DESIGN_SYSTEM.md). Update `USER_FLOWS.md` with the new flow.

### "I need a new component"
- If used on 1 page only → keep in that page's folder
- If used on multiple pages → `frontend/components/[domain]/MyComponent.tsx`
- If a UI primitive (button, modal, etc.) → `frontend/components/ui/MyComponent.tsx`

### "I need a new hook"
→ `frontend/hooks/useMyHook.ts`. One concern per hook. Name follows usage: `useApprentice` returns Apprentice data, `useChallengeDuel` returns the action.

### "I need a new agent-runner script"
→ `agent-runner/src/[concern].ts`. Import from `contracts.ts` for ABI access, from `tee-inference.ts` for 0G Compute, etc.

### "I need a new utility"
- Frontend utility → `frontend/lib/`
- Agent runner utility → `agent-runner/src/`
- Shared between frontend and agent runner → `agent-runner/src/shared/` and re-export

### "I need a new prompt template"
→ `agent-runner/src/prompts/[type].txt`. One file per Type (Bold, Patient, Sharp, Stoic). Champion personalities go in `agent-runner/src/champions/[name].json`.

### "I need a new asset (logo, sigil, image)"
→ `frontend/public/[domain]/[name].[ext]`. Then `<Image src="/[domain]/[name].ext" />`.

---

## 4. Tech Stack Versions

```json
{
  "node": "22.x",
  "pnpm": "9.x",
  "solidity": "^0.8.20",
  "hardhat": "^2.22.0",
  "typescript": "^5.5.0",
  "next": "^14.2.0",
  "react": "^18.3.0",
  "tailwindcss": "^3.4.0",
  "framer-motion": "^11.5.0",
  "wagmi": "^2.12.0",
  "viem": "^2.21.0",
  "@rainbow-me/rainbowkit": "^2.1.0",
  "@0gfoundation/0g-compute-ts-sdk": "latest",
  "@0gfoundation/0g-storage-ts-sdk": "latest",
  "@pythnetwork/pyth-sdk-solidity": "^4.0.0",
  "@pythnetwork/hermes-client": "^1.4.0",
  "ethers": "^6.13.0"
}
```

Note: 0G SDK package names should be verified at time of install — these were correct as of the planning research but may have shipped under different names.

---

## 5. Workspace Layout (pnpm)

Root `package.json`:
```json
{
  "name": "orichalcos",
  "private": true,
  "scripts": {
    "dev:frontend": "pnpm --filter frontend dev",
    "dev:agent": "pnpm --filter agent-runner dev",
    "build": "pnpm --filter frontend build && pnpm --filter agent-runner build",
    "deploy:galileo": "hardhat run scripts/deploy-galileo.ts --network galileo",
    "deploy:aristotle": "hardhat run scripts/deploy-aristotle.ts --network aristotle",
    "test": "hardhat test",
    "lint": "pnpm --filter frontend lint && pnpm --filter agent-runner lint"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'frontend'
  - 'agent-runner'
```

---

## 6. Git Hygiene

### Branches
- `main` — protected, only merges from feature branches via PR
- `feat/scrying-duel-v2` — primary working branch for the hackathon
- `feat/[scope]` — short-lived branches for specific work, merged into `feat/scrying-duel-v2`

### Commit messages
Conventional commits, kept short:
- `feat: add MockPyth contract`
- `feat: implement Mind Reveal animation`
- `fix: correct ELO K-factor for high-rated bouts`
- `chore: add Day 4 progress checkpoint`
- `docs: update USER_FLOW for marketplace`

### Commit cadence (HACKATHON-CRITICAL)
- Aim for 5+ commits per day during May 9-15
- Single-feature commits, not "end of day" megacommits
- This signals "substantial development progress" to judges per submission requirements

### .gitignore essentials
```
# Secrets
.env
.env.local
.env.production
agent-runner/data/secrets/

# Build artifacts
node_modules/
.next/
dist/
artifacts/
cache/
typechain-types/

# Deployment
deployments/*.json  # ?? maybe commit these for transparency
.vercel

# Logs
logs/
*.log

# Hardhat
.openzeppelin/
```

**Decision: COMMIT `deployments/galileo.json` and `deployments/aristotle.json` to the repo.** This makes the contract addresses verifiable from the GitHub history, which strengthens the submission.

---

## 7. Code Style

### Solidity
- Use OpenZeppelin contracts where possible (ERC-721, Ownable, ReentrancyGuard)
- `pragma solidity ^0.8.20;` everywhere
- Custom errors over revert strings (gas-cheaper)
- Events for every state change that the frontend or agent runner needs to react to
- Always natspec-document `@notice`, `@param`, `@return` on external functions

### TypeScript
- Strict mode on (`"strict": true` in tsconfig)
- No `any` — use `unknown` and narrow with type guards
- Prefer `const` over `let`
- Async/await over `.then()` chains
- Zod for runtime validation of external inputs (env vars, API responses, contract reads)

### React
- Server Components by default (Next.js 14 app router)
- `"use client"` only when needed (state, effects, browser APIs)
- Co-locate small components inside the page that uses them; promote to `components/` only when reused
- Loading states use Suspense + LoadingMark
- Error states use Error Boundaries

---

## 8. Documentation Conventions

### When to update which doc

| Change | Update |
|---|---|
| New strategic decision (problem framing, scope, deadline interpretation) | `HANDOFF.md` Decision Log |
| New visual element (color, font, animation) | `DESIGN_SYSTEM.md` |
| New user-facing flow or screen | `USER_FLOWS.md` |
| New service, contract interface, or data structure | `SYSTEM_ARCHITECTURE.md` |
| New file/folder convention | `PROJECT_STRUCTURE.md` (this file) |
| Public-facing changes (deployments, demo links) | `README.md` (final form on Day 7) |

### Reading order for new contributors (or Claude Code starting fresh)
1. `HANDOFF.md` — what is this project and why
2. `docs/DESIGN_SYSTEM.md` — visual identity
3. `docs/USER_FLOWS.md` — what users do
4. `docs/SYSTEM_ARCHITECTURE.md` — how systems talk
5. `docs/PROJECT_STRUCTURE.md` — where code lives

---

## 9. Day 1 Setup Checklist

This is what creates the empty-but-correct skeleton on Day 1:

```bash
# Already in repo (HANDOFF flow): ensure docs are in place
ls docs/  # should show: DESIGN_SYSTEM.md USER_FLOWS.md SYSTEM_ARCHITECTURE.md PROJECT_STRUCTURE.md

# Move existing v1 code to legacy
git mv src/ legacy/src/   # or wherever the existing 5 contracts live
git mv contracts/* legacy/contracts/
mkdir -p contracts/interfaces

# Set up workspace
pnpm init  # if not already
cat > pnpm-workspace.yaml <<EOF
packages:
  - 'frontend'
  - 'agent-runner'
EOF

# Initialize Hardhat at root
pnpm add -D hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init  # choose TypeScript

# Initialize frontend
mkdir frontend && cd frontend
pnpm create next-app . --typescript --tailwind --app --src-dir=false
cd ..

# Initialize agent-runner
mkdir agent-runner && cd agent-runner
pnpm init
pnpm add -D typescript @types/node tsx
pnpm add ethers viem @0gfoundation/0g-compute-ts-sdk @0gfoundation/0g-storage-ts-sdk @pythnetwork/hermes-client zod
mkdir -p src/{prompts,champions,shared}
echo "console.log('Orichalcos agent runner');" > src/index.ts
cd ..

# First commit
git add .
git commit -m "feat: scaffold v2 architecture per HANDOFF spec"
git push origin feat/scrying-duel-v2
```

---

## 10. Stop Conditions

If you find yourself doing any of the following, stop and reread this doc:

- Putting a frontend component in `agent-runner/`
- Putting a contract test outside `test/`
- Adding a 4th workspace package (everything is `frontend` or `agent-runner` or contracts at root)
- Naming a file in PascalCase that's not a React component
- Creating a "utils.ts" dumping ground (split by concern instead)
- Putting Type or Title labels in different files in different formats (single source of truth: `frontend/lib/constants.ts` and `agent-runner/src/shared/constants.ts`)
- Adding a database
- Adding a backend API server

The discipline IS the structure. Three packages, four contracts (or five with marketplace), no extras.
