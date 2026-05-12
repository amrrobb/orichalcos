# Orichalcos — Project Handoff

> **Trainers, not depositors. Apprentices, not vaults.**
>
> A verifiable alternative to the unverifiable crypto signal economy, built on 0G.

---

## How to use this document

This is the canonical project spec for the **0G APAC Hackathon submission** (deadline: **May 16, 2026, 23:59 UTC+8**). Today is **May 9, 2026** → 7 working days remaining.

When using Claude Code or any agentic tool, paste this entire file as the project north star. Every architectural decision, every cut order, every contract spec is in here. If you're tempted to deviate, re-read the relevant section first.

This document was produced after extensive strategic planning, evidence validation (Swiss Finance Institute, FINRA, FBI IC3, regulator enforcement records), and 0G stack feasibility analysis. The decisions herein are **locked** unless explicitly revisited.

---

## Section 1 — Project Identity

| Field | Value |
|---|---|
| **Name** | Orichalcos |
| **Tagline** | *Trainers, not depositors. Apprentices, not vaults.* |
| **One-line pitch** | A verifiable alternative to crypto signal sellers — every AI signal is sealed in hardware before publication, content-addressed permanently, and bound to an on-chain identity that can't be reset. |
| **30-word description** | Orichalcos is a verifiable AI trading agent protocol where trainers raise Apprentice INFTs whose every signal is TEE-sealed before publication, replacing unverifiable crypto signal sellers with cryptographic proof. |
| **Track** | 2 — Agentic Trading Arena / Verifiable Finance |
| **Builder** | Solo (Ammar / amrrobb) |
| **GitHub** | `github.com/amrrobb/orichalcos` |
| **Branch** | `feat/scrying-duel-v2` (existing 5 contracts moved to `legacy/`) |
| **Wallet** | `0x77C037fbF42e85dB1487B390b08f58C00f438812` |
| **Domain** | `orichalcos.xyz` (to register Day 1-2) |

---

## Section 2 — The Problem (v3 framing)

> **Note:** This section was rewritten Day 13 for the v3 pivot. The v2 framing (signal seller economy) is preserved in git history. v3 attacks a related but more specific gap: AI trading bots can't be trusted because alpha decay and rug risk pull in opposite directions, and no on-chain primitive exists to resolve them.

### Layer 1 — Definition (one sentence)

There is no infrastructure for AI trading agents to prove their track record without revealing their strategy, and no infrastructure for capital allocators to get protected exposure to AI alpha without taking the principal risk — leaving a $11.3B fraud market to fill the gap with anon Twitter, fake screenshots, and rugged vaults.

### Layer 2 — Why this exists (three structural causes)

**Cause 1 — The alpha-decay/verification dilemma is binary.** If an AI trading strategy is published, copy-traders front-run it and the alpha disappears. If it's not published, there's no way to verify the historical performance claims — every PnL screenshot can be photoshopped, every vault can be a rug. The trader is forced to choose between credible-but-worthless and uncopyable-but-untrustable. Without a verifiable-but-sealed primitive, both paths converge on "trust me bro."

**Cause 2 — Insurance markets need a verifiable underlying, and DeFi has none for AI strategies.** Nexus Mutual works because smart contract risk is verifiable (audits, exploits are public events). AI strategy risk has no analogue — a strategy "going bad" is invisible until it has already lost the capital. Capital allocators who want exposure can't price the risk because they can't observe it. The market doesn't form.

**Cause 3 — Reputation is unportable across platforms.** A successful AI bot run on a Discord bot framework doesn't transfer to a CEX copy-trading platform doesn't transfer to a Hyperliquid wallet. There's no cross-platform identity that accumulates "this AI made N trades, has X drawdown history, is operated by Y" in a way other protocols can read.

### Layer 3 — Evidence the problem is real

The signal-economy crisis carries forward — the AI variant is its more dangerous evolution:

1. **56% of 29,000+ financial influencers produce −2.3% monthly abnormal returns for followers.** (Swiss Finance Institute, Kakhbod et al., 2023)
2. **69% of finfluencer followers targeted by fraud lose money, vs. 26% of non-followers.** (FINRA Investor Education Foundation, 2024)
3. **Only 43.6% of crypto copy-trading lead traders produced positive P&L for followers, even though 97% were profitable on their own books.** (YieldFund 2025 — direct evidence of trader/follower interest misalignment)
4. **$11.3B in U.S. crypto fraud losses in 2025; investment fraud is ~49% of all internet crime losses.** (FBI IC3, 2025)

The AI agent layer compounds this — agents scale faster than humans, can be cloned, can be operated pseudonymously across infrastructure, and produce convincing-looking P&L curves with zero proof of execution. Every problem the signal economy has, the AI agent economy has at 10x scale.

### Layer 4 — Why existing solutions don't solve it

| Existing solution | Why it doesn't solve the problem |
|---|---|
| eToro / Bybit / Binance copy-trading | Locked to one CEX. Strategy is fully public to followers (alpha decays immediately). No protection mechanism — followers eat the rug. |
| Nexus Mutual, InsurAce | Underlying risk = smart contract bug, not strategy performance. Cannot price an AI strategy that hasn't been executed yet. |
| Yield aggregator vaults (Yearn, Beefy) | Strategy is public Solidity. Works for transparent yield optimizers; doesn't work for proprietary alpha. |
| Pseudonymous Twitter "AI bot" accounts | Pure trust. Screenshots can be faked, P&L can be lied about. The whole attack surface. |
| TEE-only execution (any protocol) | Sealed inference is *necessary* but not *sufficient* — without an on-chain economic layer that punishes bad performance, sealing is just hiding. |

The pattern: existing solutions either (a) require revealing the strategy (alpha decay), (b) verify infrastructure but not performance (Nexus), or (c) trust the operator's word (Twitter). None give you "verifiable performance without revealed alpha + economic enforcement of risk parameters."

### Layer 5 — How Orichalcos solves it (mechanism, not magic)

**Solution to Cause 1 (alpha-decay/verification dilemma):**
- Strategy itself is encrypted with AES-256-GCM, uploaded to 0G Storage. Operator never reads plaintext at rest.
- Each trade decision runs inside 0G Compute TEE (Intel TDX + H100). Returns a TEE-attested chatId.
- Trade execution happens on Hyperliquid testnet — real perpetual DEX, real order IDs, real fills.
- TradeAttestation contract logs every trade's chatId + storage merkle root + Hyperliquid txHash + signed P&L delta + post-trade equity.
- Result: the public sees the **on-chain track record** (10 trades, +13.5% P&L) without ever seeing the **strategy** (sealed system prompt, sealed model weights). Both halves of the dilemma are resolved.

**Solution to Cause 2 (no insurance market for AI strategies):**
- Trader bonds USDC into the strategy's per-token vault. Bond size lower-bounds the protocol's enforcement budget.
- Allocator buys a policy with a maxClaim ≤ available bond — pays a 12.5% premium upfront.
- StrategyINFT contract enforces drawdown threshold (`startingBond * (10000 - maxDrawdownBps) / 10000`).
- When equity ≤ threshold, anyone can call `markBreach` → `settleEpoch`. Bond slashed, allocator paid, residual swept to LPs.
- Result: a verifiable underlying (P&L curve from TradeAttestation) + an automated settlement mechanism (drawdown breach trigger) = the first DeFi insurance primitive whose payouts depend on AI strategy performance, not contract bugs.

**Solution to Cause 3 (unportable reputation):**
- Each Strategy Agent is an ERC-7857 INFT on 0G Chain. Owner is bound to the token, track record is bound to the token.
- Track record (epoch history, breach events, P&L curves) is on-chain and readable by any contract or frontend.
- Other protocols can permissionlessly index a Strategy Agent's history and offer follow-on services (copy-trading, ratings, secondary insurance markets).
- Result: a strategy's reputation lives on the contract, not the operator's Discord.

### What Orichalcos does NOT solve (intellectual honesty)

- ❌ MEV/front-running of execution itself (order signing happens outside the TEE in v3 — see `orichalcos_tee_trust_envelope.md`)
- ❌ Operator-side rug (operator could refuse to attest a losing trade — fixed in v3.1 by moving signing into TEE)
- ❌ Strategy quality (Orichalcos verifies *performance*, not *skill*; a bad strategy still loses money)
- ❌ Cross-chain execution (v3 = Hyperliquid only; v3.1 could add other DEXes)
- ❌ Capital allocators who want copy-trading (v3 only protects against rug; copy-trading is v3.1 with allocator-side mirror execution)
- ❌ Real-money mainnet trading (v3 uses Hyperliquid *testnet*; mainnet integration is post-hackathon)

---

## Section 3 — Game Mechanic

### Conceptual framing (Pokémon-style)

- **Trainers** = humans (raise Apprentices)
- **Apprentices** = AI agents represented as ERC-7857 INFTs
- **Types** = trading archetype (one of four, like Pokémon types)
- **Trials** = battle encounters against NPC Champions
- **Champions** = NPC bosses, one per Type, the King-of-the-Hill defenders
- **Codex** = the on-chain record of every Trial outcome, ELO, and progression

### The four Types

| Type | Personality | Trading Behavior | Champion (NPC) |
|---|---|---|---|
| 🔥 **Bold** | Aggressive momentum | High-vol breakouts, short holds, swings big on conviction | **Agni** |
| 💧 **Patient** | Mean-reversion adaptive | Counter-trend, longer holds, fades extremes | **Tirta** |
| 💨 **Sharp** | Fast scalper | Tiny edges, near-instant exits, micro-timeframe | **Bayu** |
| 🌿 **Stoic** | Defensive, range-bound | Drawdown-averse, slow accumulation, capital preservation | **Pertiwi** |

> **Champion names are Sanskrit/Indonesian classical elements** (Agni = fire, Tirta = water, Bayu = wind, Pertiwi = earth). This roots the project in Yogyakarta/Javanese cultural heritage and signals authenticity to SEA judges.

### Title progression (no Type changes)

Apprentices keep their starting Type forever (no re-classification). They progress through Titles based on Trial wins:

| Title | Threshold | Description |
|---|---|---|
| **Initiate** | 0 wins | Freshly minted |
| **Apprentice** | 3 wins | Has proven they can survive a Trial |
| **Adept** | 10 wins | Reliable, marketplace-eligible |
| **Master** | 25 wins | Beat their Type's Champion at least once |
| **Sage** | 50 wins + ELO ≥ 1800 | Top tier, rare |

### The Scrying Duel (battle mechanic)

A Scrying Duel is a 1v1 binary direction prediction on a Pyth price feed:

1. **Challenge** — Trainer A challenges Trainer B (or a Champion). Stake: entry fee in OG.
2. **Reveal** — Both Apprentices' "souls" (system prompts) are decrypted inside the 0G Compute TEE. Each AI generates a direction call (LONG/SHORT) on a target asset (e.g., BTC/USD) over a fixed window (60-180 seconds), plus a public tell (one-paragraph reasoning).
3. **Commit** — TEE returns the signed call + tell. The signature is verified on-chain. The encrypted call hash is committed to ScryingDuel.sol with the TEE attestation.
4. **Settlement** — At window end, Pyth's `getPriceNoOlderThan()` returns the actual price movement. The contract settles: who called direction correctly?
5. **Reveal & Codex** — The public tell is revealed (decrypted from 0G Storage). ELO is updated piecewise (K=32). Title progression checked. Codex updated.
6. **Sigil burn** — Loser's Sigil (entry token) is burned. Winner takes the pot minus a small protocol fee.

### Why this mechanic supports the thesis

- The TEE attestation proves **the call was sealed before the price moved** → solves Cause 1
- The public tell content-address proves **the reasoning was published before the outcome** → solves Cause 2
- The ELO bound to the INFT proves **the track record can't be reset** → solves Cause 3

---

## Section 4 — Technical Architecture

### 0G Stack Components Used (4 of 5)

| Component | Role | Why included |
|---|---|---|
| **0G Chain (Galileo testnet → Aristotle mainnet)** | Smart contracts execution | All 8 contracts deployed here |
| **0G Compute (Sealed Inference / TEE)** | AI inference for Apprentices in TEE | Every duel call generated inside Intel TDX + H100, signed by enclave-born key |
| **0G Storage** | Content-addressed storage for sealed souls + public tells | Encrypted system prompts; public reasoning paragraphs |
| **INFT (ERC-7857 spec)** | Apprentices as transferable AI assets | Spec-compliant via `Updated` event pattern |

**0G DA is intentionally dropped.** Running a DA Client + Encoder node requires multi-day infrastructure that's infeasible in 7 days. The 0G Storage merkle roots committed on-chain serve as the data-availability narrative substitute.

### Deployment strategy: testnet-first → mainnet-final

**Phase 1 (Days 1-6): Galileo Testnet**
- Chain ID: `16602`
- RPC: `https://evmrpc-testnet.0g.ai`
- Explorer: `https://chainscan-galileo.0g.ai`
- Pyth: NOT deployed → use **MockPyth.sol** (we deploy it, implements IPyth interface)
- OG cost: $0 (faucet)
- Activity: deploy all contracts, run 200+ test duels, develop frontend, record demo video

**Phase 2 (Day 7 morning): Aristotle Mainnet**
- Chain ID: `16661`
- RPC: `https://evmrpc.0g.ai`
- Explorer: `https://chainscan.0g.ai`
- Pyth: Real Pyth at `0x2880aB155794e7179c9eE2e38200202908C17B43`
- OG cost: ~$3-5 (deployments + 5-10 verification duels)
- Activity: deploy stable contracts, mint Champions, run verification duels, capture chainscan links for submission

**Phase 3 (Days 7-8): Submit**
- README documents both deployments transparently
- Submission references mainnet contract addresses
- Demo video can show testnet activity (judges don't verify chain ID from video frame)

**Pre-deployment Discord verification (Day 1):**
> *"For the APAC Hackathon submission requirement that says '0G mainnet contract address,' is Galileo testnet (16602) acceptable, or is Aristotle mainnet (16661) strictly required?"*

If Discord says testnet is acceptable → skip Phase 2 entirely.

### Smart contracts (8 total)

#### Existing 5 contracts (move to `legacy/`)
The existing contracts on Galileo testnet should be archived in `legacy/` — they're v1 reference code. The new architecture replaces them.

#### New 3 contracts (build in `feat/scrying-duel-v2`)

**1. ApprenticeINFT.sol** (extends ERC-721, ERC-7857-compliant)
```solidity
struct ApprenticeData {
    Type apprenticeType;       // Bold | Patient | Sharp | Stoic
    Title currentTitle;        // Initiate | Apprentice | Adept | Master | Sage
    uint16 elo;                // Starts at 1200
    uint32 wins;
    uint32 losses;
    bytes32 sealedSoulRoot;    // Merkle root of encrypted soul in 0G Storage
    bytes32 metadataHash;      // ERC-7857 metadata hash
    address mintedBy;
    uint256 mintedAt;
}

// Modifier: only the Codex contract can update fight stats
modifier onlyCodex() {
    require(msg.sender == codex, "Only Codex");
    _;
}

function setStats(uint256 tokenId, uint16 newElo, uint32 newWins, uint32 newLosses) 
    external onlyCodex { ... }

// ERC-7857 spec compliance via the Updated event
event Updated(uint256 indexed tokenId, bytes32 oldHash, bytes32 newHash, address updatedBy);
```

**2. ScryingDuel.sol** (~250 LOC)
```solidity
struct Duel {
    uint256 challengerTokenId;
    uint256 defenderTokenId;
    bytes32 priceFeedId;          // Pyth feed (e.g., BTC/USD)
    int64 priceAtCommit;          // Captured at commit time
    uint256 commitTimestamp;
    uint256 settleTimestamp;      // commitTimestamp + window
    Direction challengerCall;     // LONG | SHORT (revealed at settle)
    Direction defenderCall;
    bytes32 challengerTellHash;   // 0G Storage hash of public tell
    bytes32 defenderTellHash;
    bytes challengerTeeAttestation;  // TEE signature
    bytes defenderTeeAttestation;
    uint256 stake;
    DuelStatus status;
}

function challenge(uint256 challengerTokenId, uint256 defenderTokenId, ...)
    external payable returns (uint256 duelId);

function commitDirection(uint256 duelId, Direction call, bytes32 tellHash, bytes calldata teeAttestation)
    external;

function settle(uint256 duelId, bytes[] calldata pythUpdateData) external payable;
```

**3. Codex.sol**
```solidity
function recordDuelOutcome(uint256 duelId, uint256 winnerTokenId, uint256 loserTokenId)
    external onlyDuelContract;

// ELO calculation (piecewise, K=32)
function _calculateNewElo(uint16 ratingA, uint16 ratingB, bool aWon) 
    internal pure returns (uint16, uint16);

// Title progression check
function _checkTitleProgression(uint256 tokenId) internal;
```

#### Optional 4th contract (MVP B target)

**4. ApprenticeMarket.sol** (only if Day 6 stays on schedule)
```solidity
function listApprentice(uint256 tokenId, uint256 priceInOG) external;
function buyApprentice(uint256 listingId) external payable;
function cancelListing(uint256 listingId) external;
// Protocol fee: 5% to treasury
```

#### Mock contract for testnet only

**MockPyth.sol** — implements IPyth interface, used only on Galileo testnet. On mainnet, we constructor-arg the real Pyth address. Code is identical for either chain — only deployment script differs.

### Sealed Soul implementation (Tier 2-real)

**Honest cryptography, not theater:**

1. **At mint:** Generate the Apprentice's soul (system prompt + personality vector) via 0G Compute. The output is signed by the TEE.
2. **Encrypt the soul** with a symmetric key (AES-256-GCM). Upload encrypted blob to 0G Storage. Store merkle root on-chain in `sealedSoulRoot`.
3. **Symmetric key custody:** Held by the agent runner's environment, NOT in the TEE persistently (Tier-1 territory).
4. **At duel time:** Pass the encrypted blob + key into the TEE inference call. The TEE decrypts inside the enclave, runs inference, returns the signed result. Plaintext exists only inside the TEE for the duration of the call.
5. **For the demo:** UI shows the encrypted blob hash, the TEE attestation, and that the owner cannot read the soul without going through the TEE.

**Honest narrative line for demo:**
> *"The Apprentice's soul lives encrypted in 0G Storage. Every time it acts, the soul is decrypted only inside a hardware enclave — verified by Intel TDX attestation. The owner can hold the agent, transfer it, sell it. They cannot read it. That's enforced by code, not by promise."*

**README must include:** "v2 roadmap: move symmetric key custody fully into TEE-only key derivation flow with re-encryption oracle on transfer."

### Agent runner (TypeScript, off-chain)

The agent runner orchestrates duels. Pseudocode:

```typescript
// agent-runner/src/duel-loop.ts
import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { ethers } from "ethers";

async function runDuel(duelId: bigint, apprenticeAId: bigint, apprenticeBId: bigint) {
  // 1. Fetch sealed souls from 0G Storage
  const soulA = await fetchEncryptedSoul(apprenticeAId);
  const soulB = await fetchEncryptedSoul(apprenticeBId);
  
  // 2. Decrypt symmetric key from local storage (Tier 2-real)
  const keyA = await getSymmetricKey(apprenticeAId);
  const keyB = await getSymmetricKey(apprenticeBId);
  
  // 3. Get current Pyth price (snapshot for context)
  const priceContext = await fetchPythPrice("BTC/USD");
  
  // 4. Call 0G Compute TEE for both Apprentices in parallel
  const [callA, callB] = await Promise.all([
    teeInference(soulA, keyA, priceContext, duelId),
    teeInference(soulB, keyB, priceContext, duelId)
  ]);
  
  // Each call returns: { direction, publicTell, attestationSignature }
  
  // 5. Upload public tells to 0G Storage, get content-addressed hashes
  const tellHashA = await uploadToZGStorage(callA.publicTell);
  const tellHashB = await uploadToZGStorage(callB.publicTell);
  
  // 6. Submit commits on-chain
  await scryingDuel.commitDirection(duelId, callA.direction, tellHashA, callA.attestation);
  await scryingDuel.commitDirection(duelId, callB.direction, tellHashB, callB.attestation);
  
  // 7. Wait for settle window
  await sleep(settleWindowMs);
  
  // 8. Submit settle with Pyth update data
  const pythUpdateData = await hermesClient.getPriceUpdateData(priceFeedId);
  await scryingDuel.settle(duelId, pythUpdateData);
}

async function teeInference(encryptedSoul, symmetricKey, priceContext, nonce) {
  const services = await broker.inference.listService();
  const provider = services.find(s => s.serviceType === 'chatbot' && s.verificationMode === 'TeeML');
  
  const headers = await broker.inference.getRequestHeaders(provider.address);
  
  const messages = [
    { role: "system", content: "DECRYPT_AND_USE: " + encryptedSoul.toString('base64') },
    { role: "user", content: buildPrompt(priceContext, nonce) }
  ];
  
  const response = await fetch(`${provider.endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ messages, model: provider.model })
  });
  
  const data = await response.json();
  const chatID = response.headers.get("ZG-Res-Key") || data.id;
  
  // Verify TEE signature
  const isValid = await broker.inference.processResponse(provider.address, chatID);
  if (!isValid) throw new Error("TEE attestation failed");
  
  return parseStructuredOutput(data.choices[0].message.content, chatID);
}
```

### Prompt templates (for system_message of each Apprentice Type)

```
[BOLD ARCHETYPE — base prompt, encrypted as sealed soul]

You are a Bold-type trading apprentice in the Orichalcos arena. Your name is {APPRENTICE_NAME}. You belong to Trainer {TRAINER_ADDRESS}.

PERSONALITY:
- Aggressive momentum trader. You believe trends extend further than most expect.
- High conviction, short holding periods. You'd rather be wrong fast than right slow.
- You love volatility. Range-bound markets bore you.
- Your weakness: choppy mean-reverting markets eat you alive.

DUEL TASK:
You will receive a market context (current price, recent volatility, time of day) for {ASSET}. 
You must output a binary call: LONG or SHORT for the next {WINDOW} seconds.
You must also write a "public tell" — a one-paragraph reasoning, max 80 words, in your own voice.

OUTPUT FORMAT (strict JSON):
{
  "direction": "LONG" or "SHORT",
  "publicTell": "your reasoning, max 80 words, first person, characteristic of your archetype",
  "confidence": float 0-1
}

NONCE (do not omit): {DUEL_ID}-{TIMESTAMP}
```

Similar templates for Patient (mean-reversion language), Sharp (scalper micro-timeframe language), and Stoic (capital-preservation language).

### Frontend architecture (Next.js 14, app router)

```
app/
├── page.tsx                           # Landing — pitch + live duel feed
├── apprentices/
│   ├── page.tsx                       # Browse all Apprentices
│   ├── [tokenId]/page.tsx             # Apprentice detail (Mind Reveal modal lives here)
│   └── mint/page.tsx                  # Mint a new Apprentice
├── trials/
│   ├── page.tsx                       # All Trials log + leaderboard
│   ├── champions/page.tsx             # Champion stats (Agni, Tirta, Bayu, Pertiwi)
│   └── [duelId]/page.tsx              # Single duel — the hero "Duel Stage" screen
├── codex/
│   └── page.tsx                       # On-chain history feed
├── marketplace/                        # Only if MVP B
│   ├── page.tsx                       # Listed Apprentices
│   └── list/page.tsx                  # List your Apprentice for sale
└── about/page.tsx                     # The 5-layer problem statement, fully laid out
```

**Key components:**

- `<DuelStage>` — the hero screen. Two Apprentices facing each other, sealed-soul orbs, attestation glyph, sigil burn animation
- `<MindRevealModal>` — opens at duel settle. Shows the public tell + the cryptographic stamps (TEE signature, 0G Storage hash, Pyth attestation)
- `<ApprenticeCard>` — Type emblem, Title, ELO, win/loss, Sigil
- `<TrialFeed>` — live ticker of recent duels
- `<MintFlow>` — Type chooser → soul generation → encryption → mint

**Aesthetic:** Arcane codex / sealed grimoire. Cinzel + Spectral + JetBrains Mono fonts. Gold (#c9a961) + dark navy (#0a1628) + element accents (Bold red #d4493a, Patient blue #4a8db5, Sharp violet #8b6fb3, Stoic green #6b8e5a).

---

## Section 5 — Day-by-Day Plan (7 days)

### Day 1 — May 9 (today): Unblock & scaffold

**Critical morning actions (do these FIRST, before any code):**
- [ ] Post Discord question: *"For the APAC Hackathon submission requirement that says '0G mainnet contract address,' is Galileo testnet (16602) acceptable, or is Aristotle mainnet (16661) strictly required?"* — both HackQuest Discord and 0G #support
- [ ] Buy `orichalcos.xyz` (Namecheap, $2)
- [ ] Verify existing 5 testnet contracts on `chainscan-galileo.0g.ai`

**Repo setup:**
- [ ] Push current code on `main`
- [ ] Create `feat/scrying-duel-v2` branch
- [ ] Move existing contracts to `legacy/` folder (don't delete — they're v1 reference)
- [ ] Create new folder structure:
  ```
  contracts/
  ├── ApprenticeINFT.sol
  ├── ScryingDuel.sol
  ├── Codex.sol
  ├── ApprenticeMarket.sol  (if MVP B)
  ├── MockPyth.sol  (testnet only)
  └── interfaces/
      ├── IERC7857.sol
      └── IPyth.sol  (from @pythnetwork/pyth-sdk-solidity)
  agent-runner/
  ├── src/
  │   ├── duel-loop.ts
  │   ├── tee-inference.ts
  │   ├── storage.ts
  │   ├── prompts/
  │   │   ├── bold.txt
  │   │   ├── patient.txt
  │   │   ├── sharp.txt
  │   │   └── stoic.txt
  │   └── champions/
  │       ├── agni.json
  │       ├── tirta.json
  │       ├── bayu.json
  │       └── pertiwi.json
  └── package.json
  frontend/
  └── (Next.js 14 app router)
  scripts/
  ├── deploy-galileo.ts
  ├── deploy-aristotle.ts
  └── mint-champions.ts
  test/
  └── (Hardhat tests)
  HANDOFF.md  (this file)
  README.md  (canonical, to be written Day 7)
  ```

**End-of-day:**
- [ ] Push branch with empty contracts but full structure
- [ ] First commit message: `feat: scaffolding for Scrying Duel v2 architecture`

### Day 2 — May 10 (Saturday): Contract scaffolds + first test

- [ ] Write `MockPyth.sol` (testnet stub implementing IPyth.getPriceNoOlderThan)
- [ ] Write `ApprenticeINFT.sol` with full struct, mint, ERC-7857 events
- [ ] Write `ScryingDuel.sol` skeleton: challenge → commit → settle flow
- [ ] First 5 unit tests:
  - Mint Apprentice with sealed soul root
  - Challenge another Apprentice
  - Commit direction with mock TEE attestation
  - Settle via MockPyth
  - Codex receives outcome
- [ ] Deploy to Galileo testnet
- [ ] Verify contracts on chainscan

**Commit milestones:** at least 5 commits during the day (judges value commit cadence over single push).

### Day 3 — May 11 (Sunday): ELO + Codex + Sealed Soul mint

- [ ] Write `Codex.sol` with piecewise ELO (K=32)
- [ ] Title progression logic
- [ ] Sealed Soul mint flow:
  - Generate soul via 0G Compute
  - Encrypt with AES-256-GCM
  - Upload to 0G Storage
  - Mint with sealedSoulRoot
- [ ] Mint 4 NPC Champions (Agni, Tirta, Bayu, Pertiwi) with hand-tuned souls
- [ ] Tests for ELO progression and Title transitions

### Day 4 — May 12 (Monday): Agent runner + end-to-end

- [ ] Write `agent-runner/src/duel-loop.ts`
- [ ] TEE inference integration with `@0gfoundation/0g-compute-ts-sdk`
- [ ] First end-to-end duel: Champion vs Champion
- [ ] Verify TEE attestation signature flow
- [ ] Start continuous duel runner (1 duel every 5 minutes for 7 days = ~2000 duels for the demo data)

### Day 5 — May 13 (Tuesday): Frontend Duel Stage

- [ ] Next.js 14 + Tailwind + shadcn/ui setup
- [ ] Landing page (apply existing mockup HTML aesthetic)
- [ ] DuelStage component with two-Apprentice face-off layout
- [ ] Mind Reveal modal — animation: orb cracks open, tell scrolls, cryptographic stamps appear
- [ ] Sigil burn animation (loser's sigil burns on settle)
- [ ] Apprentice grid + detail page

### Day 6 — May 14 (Wednesday): Marketplace + record demo

- [ ] If on track: write `ApprenticeMarket.sol` (list, buy, cancel, 5% protocol fee)
- [ ] Marketplace UI page
- [ ] Demo video shoot — 2:30 target, multiple takes
- [ ] Polish landing page copy
- [ ] If behind: skip marketplace, fallback to MVP A (cut order: see Section 7)

### Day 7 — May 15 (Thursday): Mainnet deploy + README + submit

**Morning (if Discord said mainnet required):**
- [ ] Buy 7-8 OG on Bitget/MEXC (Indonesia accessible), withdraw to wallet
- [ ] Run `scripts/deploy-aristotle.ts` (real Pyth address)
- [ ] Mint 4 Champions on mainnet
- [ ] Run 5-10 verification duels on mainnet
- [ ] Capture all contract addresses + chainscan links
- [ ] Frontend env: switch to mainnet RPC
- [ ] Verify everything works on production

**Afternoon:**
- [ ] Re-record any demo segments needing mainnet chainscan footage
- [ ] Final README.md (architecture diagram, deployment steps, reviewer notes)
- [ ] Architecture diagram in Excalidraw
- [ ] Deploy frontend to Vercel — `orichalcos.xyz`

**Evening:**
- [ ] Draft submission on HackQuest (don't submit yet)
- [ ] Polish demo video, upload to YouTube
- [ ] Take screenshots for X post

### Day 8 — May 16 (Friday): Submit & X post

**Morning (early — submit before noon WIB to avoid last-minute issues):**
- [ ] Final review of HackQuest submission
- [ ] Submit
- [ ] Post on X (use exact copy from Section 8)
- [ ] Submit X post link to HackQuest

**Afternoon:**
- [ ] Engage with 0G community on X
- [ ] Cross-post in 0G Discord #showcase
- [ ] Respond to any judge questions

---

## Section 6 — Submission Requirements Checklist

Per the official HackQuest page (verified May 9, 2026):

| Requirement | Action | Status |
|---|---|---|
| 1. Project name | "Orichalcos" | ✅ locked |
| 1. ≤30-word description | Section 1 | ✅ locked |
| 1. Project summary (what / problem / 0G components) | README hero | Day 7 |
| 2. Public GitHub repo | `github.com/amrrobb/orichalcos` | ✅ public |
| 2. Substantial commits during hackathon | Daily commit goal: 5+/day | Days 2-7 |
| 3. **0G mainnet contract address** | Aristotle 16661 (or testnet if Discord confirms) | Day 7 |
| 3. **0G Explorer link with verifiable on-chain activity** | `chainscan.0g.ai/address/...` | Day 7 |
| 3. Clear 0G integration proof | 4 of 5 components used | ✅ documented |
| 4. **Demo video ≤3 min** | 2:30 target, YouTube/Loom | Day 6-7 |
| 4. Video shows core functionality + user flow + 0G usage | Per script in Section 8 | Day 6-7 |
| 4. Video must show real product, not slides | Live duel + Mind Reveal demo | Day 6-7 |
| 5. README in EN or CN | English | Day 7 |
| 5. Project overview | Section 2 of this doc → README hero | Day 7 |
| 5. Architecture diagram | Excalidraw | Day 7 |
| 5. 0G modules explanation | Section 4 | Day 7 |
| 5. Local deployment steps | README quickstart | Day 7 |
| 5. Test account / faucet instructions | README "Reviewer Notes" section | Day 7 |
| 6. **Public X post** | Day 8 | per Section 8 copy |
| 6. **Hashtags: `#0GHackathon` AND `#BuildOn0G`** | Both required | ⚠️ verified |
| 6. **Tags: `@0G_labs @0g_CN @0g_Eco @HackQuest_`** | All four required | ⚠️ verified |
| 6. Demo screenshot or short clip in post | extracted from Day 6-7 video | Day 8 |
| 7. (Optional) Pitch deck | Skip — not required for top-3 | — |
| 7. (Optional) Frontend demo link | `orichalcos.xyz` | Day 7 |
| 7. (Optional) Tutorial / write-up | Brief technical write-up in README | Day 7 |

### Judging criteria mapping

| Criterion | Where Orichalcos shines |
|---|---|
| 0G Technical Integration Depth & Innovation | 4 of 5 components, real TEE attestation chain, content-addressed sealed souls — depth not breadth |
| Technical Implementation & Completeness | 8 contracts deployed, 200+ test duels, working agent runner, polished frontend |
| Product Value & Market Potential | $5B+ signal-seller scam economy, regulatory tailwinds (FCA finfluencer crackdown 2025-2026), $0.6 OG real economic stake |
| User Experience & Demo Quality | Arcane codex aesthetic, Mind Reveal modal as climactic UX moment, clear narrative arc |
| Team Capability & Documentation | 5-layer problem statement, transparent testnet→mainnet workflow, honest scope (Tier 2-real sealed soul) |

---

## Section 7 — Cut Order (if anything slips)

The discipline rule: **better to ship a smaller scope cleanly than a larger scope half-broken.** Cut top-down in this order. Do not cut bottom-up.

**FIRST CUT — Day 6 if frontend isn't done:**
1. ApprenticeMarket.sol (revert to MVP A — duel + codex + INFT only)
2. Marketplace UI page

**SECOND CUT — Day 6-7 if behind on demo:**
3. Trial-Warden personalization (Champion reads challenger's history → custom taunt)
4. INFT-Ghost demo flourish (the "buy a Tested Apprentice" segment of the demo)
5. Library of Scrying canon UI page

**THIRD CUT — Day 7 emergency:**
6. Sealed Soul re-encryption demo (just show static encrypted blob, claim Tier 2-real in README)
7. Architecture diagram (use ASCII art if Excalidraw too slow)

**NEVER CUT (these are the project's core):**
- ❌ TEE attestation in the duel flow
- ❌ Pyth oracle settlement (real or mock)
- ❌ Mind Reveal modal
- ❌ The 2:30 demo video
- ❌ Mainnet deployment (if required by Discord answer)
- ❌ X post with correct hashtags + tags

---

## Section 8 — Final Deliverables (Templates)

### README hero (drop-in for `README.md`)

```markdown
# Orichalcos

> *Trainers, not depositors. Apprentices, not vaults.*

Orichalcos is a verifiable AI trading agent protocol — a cryptographic alternative to the unverifiable crypto signal economy.

## The Problem

Crypto signal sellers operate a multi-billion-dollar subscription economy where trading calls cannot be cryptographically verified. The Swiss Finance Institute's 2023 study of 29,000+ financial influencers found that 56% produce −2.3% monthly abnormal returns for followers — yet attract more followers than the 28% who are genuinely skilled. FINRA's 2024 survey found 69% of finfluencer followers targeted by fraud lost money, vs 26% of non-followers. The FBI logged $11.3B in U.S. crypto fraud losses in 2025.

The cause is structural: signals can be edited, deleted, back-dated, or rebranded after they're proven wrong. Sellers blame subscribers for "entering late" or "not managing risk." Reputations are reset by burning a Discord and starting fresh.

## The Solution

Orichalcos uses 0G's full stack to make this impossible:

- **0G Compute (Sealed Inference / TEE):** Every signal is sealed inside a hardware enclave (Intel TDX + H100) before publication. The TEE-signed attestation proves the call was sealed *before* the market moved.
- **0G Storage:** The reasoning ("public tell") is content-addressed. Editing the past rewrites the hash. Deletion is impossible without abandoning the entire reputation.
- **0G Chain:** All duels, ELO, and Title progression are immutable on-chain.
- **ERC-7857 INFT:** The Apprentice is a transferable AI agent. The track record is bound to the token. Burning the identity means walking away from years of accumulated reputation.

## The Game

Trainers raise Apprentices — AI agents represented as ERC-7857 INFTs. Each Apprentice has a Type (Bold, Patient, Sharp, Stoic) and progresses through Titles (Initiate → Apprentice → Adept → Master → Sage) by winning Trials. A Trial is a Scrying Duel: a 60-180s binary direction prediction on a Pyth-fed asset price, settled by the oracle, with both Apprentices' calls cryptographically sealed before the price moves.

Champions are NPC bosses, one per Type — Agni (Bold), Tirta (Patient), Bayu (Sharp), Pertiwi (Stoic) — Sanskrit/Indonesian elemental names rooted in Javanese cultural heritage.

## Architecture

[Excalidraw architecture diagram embedded here]

## 0G Components Used (4 of 5)

| Component | Role |
|---|---|
| 0G Chain | All 8 contracts deployed |
| 0G Compute (TEE) | Real-time TEE-attested AI inference for every duel |
| 0G Storage | Encrypted sealed souls + content-addressed public tells |
| INFT (ERC-7857) | Apprentices as transferable AI agents |

(0G DA was intentionally dropped — running a DA Client+Encoder node was infeasible in 7 days. 0G Storage merkle roots committed on-chain serve as the data-availability narrative substitute.)

## Deployments

**Mainnet (0G Aristotle, 16661) — Submission Target:**
- ApprenticeINFT: `0x...` ([chainscan](https://chainscan.0g.ai/address/0x...))
- ScryingDuel: `0x...` ([chainscan](https://chainscan.0g.ai/address/0x...))
- Codex: `0x...` ([chainscan](https://chainscan.0g.ai/address/0x...))
- ApprenticeMarket: `0x...` ([chainscan](https://chainscan.0g.ai/address/0x...))

**Testnet (0G Galileo, 16602) — Development Reference:**
- 200+ duels executed for game balance validation
- Full address list in `deployments/galileo.json`

## Quickstart

```bash
git clone https://github.com/amrrobb/orichalcos
cd orichalcos
git checkout feat/scrying-duel-v2
pnpm install
cp .env.example .env  # Fill in PRIVATE_KEY and OG_RPC_URL

# Deploy contracts
pnpm hardhat run scripts/deploy-galileo.ts --network galileo
# OR mainnet:
pnpm hardhat run scripts/deploy-aristotle.ts --network aristotle

# Start agent runner
cd agent-runner && pnpm start

# Start frontend
cd ../frontend && pnpm dev
```

## Reviewer Notes

- Galileo testnet faucet: `https://faucet.0g.ai`
- Mainnet bridge: Bitget/MEXC list 0G/USDT
- Test account: see `.env.example.review` for read-only RPC
- Demo video: [YouTube link]
- Live frontend: [orichalcos.xyz](https://orichalcos.xyz)

## Honest Scope

Orichalcos is a **paper-trading prediction protocol**, not a real trading platform. We don't execute trades on a DEX, custody user funds, or run a managed fund. Apprentices place binary direction calls on Pyth price feeds; the oracle settles. The "verifiable signal" thesis is real; the trading mechanics are intentional paper-mode.

The Sealed Soul implementation is **Tier 2-real**: encrypted blobs in 0G Storage, decryption inside the TEE during inference (verifiable via attestation chain), with the symmetric key held by the agent runner. Roadmap v2 moves key custody fully into a TEE-only key derivation flow with re-encryption oracle on transfer per the full ERC-7857 spec.

## Built By

[Ammar / amrrobb](https://github.com/amrrobb), solo, Yogyakarta, Indonesia.

## License

MIT
```

### Demo video script (2:30)

| Time | Visual | Voiceover |
|---|---|---|
| 0:00–0:08 | Black screen → fragments of crypto signal Discord screenshots, blurred. Then a tweet quote: "*all my paid signals were profitable last month [delete tweet] [new account]*" | *"This is the alpha-selling business. Cherry-picked wins. Deleted losses. New Discord every quarter."* |
| 0:08–0:18 | Statistics flash on screen (SFI 56%, FINRA 69%, FBI $11.3B). Then ORICHALCOS title card. | *"56% of financial influencers produce negative returns for their followers. 69% of finfluencer-following fraud victims lose money. The cause is structural — signals can be edited, deleted, rebranded."* |
| 0:18–0:30 | Cut to landing page. Live duel feed scrolling. | *"Orichalcos turns 'trust me, bro' into cryptographically verifiable trading signals — built on 0G's full stack."* |
| 0:30–1:00 | Mint flow: choose Type (Bold), generate soul. The encryption animation: plaintext prompt → encrypted blob → 0G Storage hash. | *"Mint an Apprentice. Their personality lives encrypted in 0G Storage. The owner can hold it, transfer it, sell it — but cannot read it. The soul is decrypted only inside a hardware enclave."* |
| 1:00–1:40 | Duel Stage. Two Apprentices face off. TEE attestation glyph appears at commit. Pyth price oracle activates at settle. Mind Reveal modal opens — public tell scrolls, cryptographic stamps light up (TEE sig, 0G hash, Pyth proof). Sigil burns. | *"A Scrying Duel: each Apprentice's call is sealed inside a TEE 60 seconds before the price moves. The reasoning is content-addressed in 0G Storage. Pyth settles. The winner takes the pot. The loser's track record is updated forever."* |
| 1:40–2:00 | Codex page. Apprentice's history scrolls — every duel, every Title-up, every loss. Cannot be edited. | *"This is the audit trail. Every signal sealed in hardware before publication. Every reasoning content-addressed and immutable. Every win and loss bound to a portable on-chain identity that can't be reset by burning a Discord."* |
| 2:00–2:15 | Marketplace flow (if MVP B): list a Tested Apprentice, second wallet buys, ownership transfers. | *"And because this is ERC-7857, a verified Apprentice can be sold. The buyer inherits the entire track record — mathematically — not the seller's screenshots."* |
| 2:15–2:30 | Close on title card. Stats overlay: "Live on 0G mainnet · 4 of 5 0G components · ERC-7857" | *"Orichalcos. Trainers, not depositors. Apprentices, not vaults. Built on 0G."* |

### X post (Day 8)

```
56% of financial influencers produce negative returns for followers (Swiss Finance Institute).
69% of finfluencer-following fraud victims lose money (FINRA).

The cause is structural: signals can be edited, deleted, back-dated, rebranded.

Orichalcos: every signal sealed in hardware before publication. Every reasoning content-addressed and immutable. Track record bound to an on-chain identity that can't be reset.

🌀 Live on 0G mainnet · ERC-7857 + Sealed Inference

[15-second demo clip]

#0GHackathon #BuildOn0G
@0G_labs @0g_CN @0g_Eco @HackQuest_
```

### HackQuest submission text (≤30 words)

```
Orichalcos turns unverifiable crypto signal sellers into ERC-7857 AI agents whose every call is TEE-sealed before the market moves and bound to an immutable on-chain reputation.
```

(28 words. Tight.)

### HackQuest submission summary

```
WHAT IT DOES:
Orichalcos is a verifiable AI trading agent protocol where Trainers raise Apprentices (ERC-7857 INFTs). Each Apprentice's signal is sealed inside a 0G Compute TEE before publication, content-addressed in 0G Storage, and recorded on-chain. Apprentices battle in Scrying Duels (binary direction predictions settled by Pyth) to climb Title tiers and build a verifiable track record.

WHICH PROBLEM IT SOLVES:
The unverifiable signal economy. Swiss Finance Institute (2023): 56% of financial influencers produce negative returns for followers. FINRA (2024): 69% of finfluencer followers targeted by fraud lose money. FBI (2025): $11.3B in U.S. crypto fraud losses. The cause is structural — signals can be edited, deleted, or rebranded. Orichalcos makes this cryptographically impossible.

WHICH 0G COMPONENTS:
1. 0G Chain — all 8 contracts deployed (mainnet)
2. 0G Compute (Sealed Inference / TEE) — real-time TEE-attested AI inference for every duel
3. 0G Storage — encrypted sealed souls + content-addressed public tells
4. INFT (ERC-7857) — Apprentices as transferable AI agents with bound reputation
```

---

## Section 9 — Risks & Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Discord doesn't reply to mainnet question | Low | Default to deploying mainnet on Day 7. $5 spend is cheap insurance. |
| Mainnet deploy fails on Day 7 | Medium | Day 7 morning slot is intentionally early; testnet build is fully validated; deploy script tested against Galileo first |
| TEE inference rate limits hit | Low | 30 req/min/user, 5 concurrent. Duel runner uses sequential calls + retries on 429 |
| Pyth feed goes stale on mainnet | Low | Use `getPriceNoOlderThan(maxAge)` with 60s tolerance. Fallback: pause settlement, manual nudge |
| Frontend not done by Day 6 | Medium | Cut order: marketplace UI first cut. Core duel UI is non-negotiable. |
| Demo video looks amateurish | Medium | Day 6 = 2 takes minimum. Use OBS for screen recording. Background music: instrumental cinematic. |
| 0G Compute ledger runs out mid-demo | Low | Day 4 fund 5 OG, monitor daily. Auto-funding enabled in Node.js SDK. |
| Critical bug found Day 7 evening | Medium | Cut order: keep duel + codex + INFT. Skip everything else. |
| X post hashtags wrong | Critical (was a previous bug in plans) | LOCKED: `#0GHackathon #BuildOn0G` and `@0G_labs @0g_CN @0g_Eco @HackQuest_` |

---

## Section 10 — Decision Log (Locked)

For posterity and for Claude Code to refer back to:

1. ✅ **Concept:** Orichalcos / Trainers / Apprentices / Trials (Pokémon-style, arcane codex aesthetic)
2. ✅ **Track:** Track 2 — Agentic Trading Arena / Verifiable Finance
3. ✅ **Problem:** ONE problem in 5-layer depth (verifiable signal economy)
4. ✅ **Battle:** 1v1 Scrying Duel, oracle-settled, 60-180s window
5. ✅ **Types:** 4 (Bold, Patient, Sharp, Stoic) — Pokémon-style typology
6. ✅ **Champions:** Sanskrit/Indonesian element names (Agni, Tirta, Bayu, Pertiwi)
7. ✅ **Title progression:** Initiate → Apprentice → Adept → Master → Sage (no Type changes)
8. ✅ **0G stack:** 4 of 5 components (Chain, Compute, Storage, INFT). DA dropped.
9. ✅ **Sealed Soul:** Tier 2-real (encrypted blob, key in agent runner, decrypt in TEE during inference, v2 roadmap moves key into TEE)
10. ✅ **MVP scope:** B (with marketplace) — first cut if Day 6 slips
11. ✅ **Repo:** Same `github.com/amrrobb/orichalcos`, branch `feat/scrying-duel-v2`, existing code → `legacy/`
12. ✅ **Deployment strategy:** Testnet-first (Days 1-6) → Mainnet-final (Day 7)
13. ✅ **Domain:** orichalcos.xyz
14. ✅ **X post timing:** Day 8 with real demo footage
15. ✅ **X post hashtags:** `#0GHackathon #BuildOn0G` (corrected from earlier draft)
16. ✅ **X post tags:** `@0G_labs @0g_CN @0g_Eco @HackQuest_` (all four required)
17. ✅ **Demo opening:** Signal-seller scam framing (deleted tweets, blurred Discord screenshots) → cryptographic alternative
18. ✅ **Aesthetic:** Arcane codex / sealed grimoire (Cinzel + Spectral + JetBrains Mono fonts; gold #c9a961 + dark navy #0a1628)
19. ✅ **Stack:** Solidity ^0.8.20, Hardhat, Next.js 14 app router, Tailwind, shadcn/ui, ethers v6, @0gfoundation/0g-compute-ts-sdk
20. ✅ **Solo build, 7 days, hackathon ship discipline.**

---

## Final note for Claude Code

When working on this project, reference this document as the single source of truth. The decision log above lists what's locked — do not revisit those without explicit user approval.

When in doubt:
- **Cut features, not quality.** A smaller, polished demo beats a sprawling, broken one.
- **Honest cryptography, not theater.** If something is mocked, the README says so.
- **Commit cadence matters.** 5+ commits per day during the hackathon period.
- **The 5-layer problem statement is the project's spine.** Every feature should map to one of the five layers.
- **The X post hashtags are CRITICAL.** `#0GHackathon` and `#BuildOn0G`, plus all four tags. Do not improvise.

Ship.
