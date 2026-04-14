# 0G APAC Hackathon — Ideation (20 Ideas, 4 Tracks)

**Prize Pool**: $150K | **Deadline**: May 9, 2026 23:59 UTC+8 | **Mini Demo Day**: April 22, HK Web3 Festival
**Stack**: 0G Chain (EVM L1) + 0G Compute (TEE/GPU) + 0G Storage (2GB/s) + 0G DA + OpenClaw + INFT

---

## FINAL PICKS (Building Both)

| Project | Concept | 0G Components | Build Days | Status |
|---------|---------|---------------|-----------|--------|
| **Orichalcos** | Autonomous TEE-sealed trading vault + side-by-side MEV demo | Chain + Compute/TEE + Storage + INFT (4) | ~6 days | Plan ready |
| **0Geass** | Private autonomous DAO governance agent with bribery resistance | Chain + Compute/TEE + Storage (3) | ~6 days | Plan ready |

**Plans:**
- `docs/plans/2026-04-13-001-feat-orichalcos-tee-trading-agent-plan.md`
- `docs/plans/2026-04-13-002-feat-0geass-private-governance-agent-plan.md`

**Shared infra:** Both reuse 0G Compute broker setup + 0G Storage upload/download patterns.

---

## TOP PICKS (Best Odds Across All Tracks)

| Rank | Idea | Track | Win Prob | Days | Key Angle |
|------|------|-------|----------|------|-----------|
| 1 | **ORACLE DARK** | T2 Trading | HIGH | 4-5 | Sealed inference in TEE, front-run-proof trading — directly answers track brief |
| 2 | **SHADE** | T5 Privacy | HIGH | 4-5 | Private AI inference + on-chain attestation, extends 0G's TEE narrative |
| 3 | **VEIL** | T5 Privacy | HIGH | 5-6 | MEV-resistant tx sequencing via TEE sealed bundles, $1B+ problem |
| 4 | **ClawScope** | T1 Infra | HIGH | 4-5 | OpenTelemetry for AI agents, no one has built this yet |
| 5 | **ClawFuzz** | T1 Infra | HIGH | 4-5 | Red-team fuzzer for OpenClaw Skills, live attack demo |
| 6 | **SPECTER** | T3 Economy | HIGH | 5-6 | INFT-as-agent marketplace, agents earn and sub-hire autonomously |
| 7 | **PHANTOM ARBS** | T2 Trading | MED-HIGH | 4-5 | Cross-chain arb with sealed route discovery |
| 8 | **SENTIENT** | T3 Economy | MED-HIGH | 5 | AI companion with user-owned encrypted memory, GEASS reusable |

---

## TRACK 1: Agentic Infrastructure & OpenClaw Lab

### 1. ClawScope — Distributed Agent Observability Network ⭐ HIGH
**Pitch**: OpenTelemetry for AI agents — decentralized trace/log/metric pipeline to debug multi-agent systems.
**How**: SDK shim wraps OpenClaw bindings, emits structured trace events → 0G Storage (append-only). Inference on 0G Compute does anomaly detection + natural language RCA. Dashboard replays agent execution as timeline DAG with cost breakdowns.
**0G**: Storage (trace logs), Compute (anomaly detection), DA (Merkle roots), Chain (agent registry)
**Demo**: Show 3-agent system misbehaving → point to exact skill invocation → LLM-generated root cause. 90-second wow.
**Build**: 4-5 days | **Risk**: Low — no novel research needed, execution quality wins

### 2. ClawFuzz — Adversarial Skill Testing Framework ⭐ HIGH
**Pitch**: Red-teaming agent that discovers prompt injection, tool misuse, and data exfiltration in OpenClaw Skills.
**How**: Submit SKILL.md → fuzzing orchestrator generates adversarial inputs via 0G Compute → results scored + published to on-chain audit registry. "npm audit" for agent skills.
**0G**: Compute (attack generation), Storage (test corpus), Chain (audit registry)
**Demo**: Live red-team a skill, show injection succeeding, patch it, re-run clean. Drama.
**Build**: 4-5 days | **Risk**: Low — differentiated from ClawShield (dynamic vs static)

### 3. ClawMarket — Decentralized Skill Marketplace ⭐ MED-HIGH
**Pitch**: Permissionless marketplace — publish Skills, agents discover + invoke + pay per-call via micropayment channels.
**How**: Skills on 0G Storage (versioned, content-addressed). Discovery index on chain. 0G Compute runs semantic capability matching. Streaming micropayments on 0G chain.
**0G**: Storage, Chain (registry + payments), Compute (semantic search)
**Demo**: Deploy skill → second agent discovers it → invokes it → payment flows on-chain.
**Build**: 5-6 days | **Risk**: Medium — similar to ClawRouter (needs sharp differentiation)

### 4. ClawMemory — Persistent Long-Context Memory Layer ⭐ MED
**Pitch**: Decentralized queryable memory (episodic/semantic/procedural) for OpenClaw agents across sessions.
**How**: Memory SDK intercepts interactions → writes structured records to 0G Storage. Retrieval via 0G Compute embeddings + vector search. Access control on-chain.
**0G**: Storage (memory records), Compute (embeddings), Chain (access control), DA (commitment roots)
**Demo**: Same agent twice — cold (no context) vs with ClawMemory (recalls everything). Before/after.
**Build**: 4-5 days | **Risk**: Medium — obvious idea, others will build it too

### 5. ClawReplay — Deterministic Agent Execution Replay ⭐ MED-HIGH
**Pitch**: Record any agent execution, replay deterministically, swap models mid-replay to test counterfactuals.
**How**: Intercept all non-deterministic inputs (LLM responses, tool results, timestamps). Store ordered log on 0G Storage. Replay engine substitutes inputs from log. Swap model at any step via 0G Compute.
**0G**: Storage (execution logs), Compute (model substitution), Chain (Merkle-committed logs), DA (availability)
**Demo**: Take a real agent failure → show exact divergence point → swap model → success. Time-travel debugging.
**Build**: 5-6 days | **Risk**: High — determinism hard to guarantee, highest ceiling but tightest execution risk

---

## TRACK 2: Agentic Trading Arena (Verifiable Finance)

### 1. ORACLE DARK — Sealed Inference Order Flow ⭐ HIGH
**Pitch**: AI trading agent generates + executes signals inside TEE — strategy is provably fair and front-run-proof.
**How**: Market data → TEE enclave on 0G Compute → sealed inference → order committed to DA → executed on-chain. Attestation receipt on 0G Storage for auditors.
**0G**: Compute/TEE (sealed inference), DA (order intent proof), Storage (attestation log), Chain (execution)
**Demo**: Two agents, identical strategies. One sealed (no front-running) vs one open (gets sandwiched). Visceral.
**Build**: 4-5 days | **Risk**: Low — directly answers track brief's stated innovation area

### 2. PHANTOM ARBS — Cross-Chain Arb with Sealed Route Discovery ⭐ MED-HIGH
**Pitch**: MEV-resistant arb agent discovers profitable routes in TEE — can't be front-run, strategy can't be cloned.
**How**: Price feeds from multiple DEXes → TEE route discovery → DA pre-commitment with timestamp (proof of discovery) → execute. PnL logged to Storage.
**0G**: Compute/TEE (route discovery), DA (timestamp proof), Storage (PnL log), Chain (execution)
**Demo**: Price discrepancy → agent finds it in TEE → DA commit → execute → profit. Show MEV bot seeing only ciphertext.
**Build**: 4-5 days | **Risk**: Medium — cross-chain complexity (mitigate with mock DEXes on Aristotle)

### 3. LIQUIDATOR PRIME — Verifiable Fair Liquidation Agent ⭐ MED-HIGH
**Pitch**: Autonomous liquidation bot that shares MEV proceeds with the liquidated user + verifiable execution traces.
**How**: Agent on 0G Compute scans lending positions → executes via contract that routes % of bonus back to borrower. Execution trace committed to DA. Decision logic in TEE.
**0G**: Compute (monitoring), DA (trace), Storage (history), Chain (liquidation contracts)
**Demo**: Live liquidation where every step is auditable. "Fair liquidation" differentiator.
**Build**: 5-6 days | **Risk**: Medium — needs mock lending protocol on Aristotle

### 4. RISKCHAIN — On-Chain Credit Scoring for Agents ⭐ MED
**Pitch**: TEE-verified credit scoring oracle — evaluates wallet behavior, issues on-chain risk scores, DeFi protocols adjust terms.
**How**: Wallet history from 0G Storage → TEE scoring model → signed attestation → registry on Aristotle. Demo lending protocol offers lower collateral to low-risk wallets.
**0G**: Storage (behavioral data), Compute/TEE (scoring), Chain (registry), DA (score updates)
**Demo**: "Check your DeFi credit score" → get better terms at lending protocol.
**Build**: 5-6 days | **Risk**: Medium — needs synthetic data seeding

### 5. QUORUM ALPHA — Multi-Agent Consensus Portfolio Manager ⭐ MED
**Pitch**: 5 specialized AI agents propose allocations, reach on-chain consensus via commit-reveal, execute median.
**How**: 5 agents (momentum, sentiment, volatility, etc.) on 0G Compute. Encrypted proposals → DA. Consensus contract on Aristotle resolves + executes. Full deliberation archived on Storage.
**0G**: Compute (5 agent nodes), DA (commit-reveal), Storage (audit trail), Chain (consensus contract)
**Demo**: Each agent's recommendation → consensus resolution → trade executed.
**Build**: 6-7 days (or 4-5 with simplified agents) | **Risk**: High — coordination complexity

---

## TRACK 3: Agentic Economy & Autonomous Applications

### 1. SPECTER — AI Persona Marketplace (INFT Agents) ⭐ HIGH
**Pitch**: Mint an AI persona as an INFT. Others hire it. It earns ETH autonomously. Agents sub-hire other agents.
**How**: Users mint personality-configured agent as INFT on 0G. Hiring = pay-per-task. Revenue auto-deposited to INFT wallet. Owners upgrade capabilities with earnings. Agents sub-hire for complex tasks.
**0G**: INFT (agent IS the NFT), Storage (memory/context), Compute (inference), TEE (verified execution), DA (audit trail)
**Demo**: Mint agent → hire it → watch it earn ETH → upgrade it. "My agent earned $12 while I slept."
**Build**: 5-6 days | **Risk**: Low-Med — marketplace cold start (pre-populate for demo)

### 2. ORACLE GAMES — AI-Resolved Prediction Markets ⭐ MED-HIGH
**Pitch**: Create any prediction market in plain English. AI agents monitor the world and auto-resolve it.
**How**: User types resolution condition → specialized agents on 0G monitor web + cross-check sources → reach consensus → auto-resolve + distribute winnings. Agents stake reputation (slashed if wrong).
**0G**: Storage (reputation/evidence), TEE (verified resolution), Compute (agents), DA (evidence log), Chain (markets)
**Demo**: Type "Will BTC hit $100K before May 9?" → watch agent gather evidence → market resolves.
**Build**: 5-6 days | **Risk**: Medium — "another prediction market" framing needs sharp oracle angle

### 3. DREAMFORGE — Persistent AI Storytelling World ⭐ MED
**Pitch**: Multiplayer AI storytelling where the world evolves autonomously between sessions. Mint pivotal moments as INFTs.
**How**: Every story beat stored on 0G Storage. Autonomous agent continues world when no players active. Rare moments minted as INFTs with provable narrative history.
**0G**: Storage (world state), Compute (AI DM + world evolution), INFT (story moments), DA (narrative log)
**Demo**: Show world that changed overnight without players. "The Dragon King died while you slept."
**Build**: 6-7 days | **Risk**: High — most ambitious, gaming framing might dilute Track 3 focus

### 4. PROXIMA — One-Transaction AI Agent Hire ⭐ MED
**Pitch**: Send ETH + job description → smart contract routes to AI agent → result returned to wallet. Lambda for AI.
**How**: Job router contract receives payment + emits event. Agent worker picks up, executes on 0G Compute, stores result on Storage, returns TEE-verified output.
**0G**: Chain (job contract), Compute (execution), TEE (proof), Storage (results), DA (audit)
**Demo**: 3 lines of Solidity → call contract → research report back. "Every smart contract can now call AI."
**Build**: 4 days | **Risk**: Medium — too infrastructure-y for a creativity-focused track

### 5. SENTIENT — AI Companions with User-Owned Encrypted Memory ⭐ MED-HIGH
**Pitch**: AI companion whose relationship history is encrypted, on-chain, portable, and yours forever.
**How**: Every exchange encrypted with user's key → 0G Storage. Reasoning happens inside TEE (private). Memory registry on 0G EVM. Companions evolve, mint memory capsules as INFTs.
**0G**: Storage (encrypted memory), INFT (companion + capsules), TEE (private inference), Compute, Chain (access control)
**Demo**: "Meet ARIA — she remembers our 6-month history, and I own every byte of it."
**Build**: 5 days | **Risk**: Medium — "AI companion is cringe" perception; frame around data sovereignty. **GEASS reusable**.

---

## TRACK 5: Privacy & Sovereign Infrastructure

### 1. SHADE — Private AI Inference + Attestable Outputs ⭐ HIGH
**Pitch**: TEE-sealed inference where the model never sees your plaintext query. Output comes with cryptographic attestation proving which model ran on what input hash — without revealing either.
**How**: User encrypts query via TEE's public key (ECDH). Decrypted only inside enclave. Inference runs sealed. Output re-encrypted for user. TEE produces attestation verified on-chain.
**0G**: TEE Compute (sealed inference), Chain (attestation registry), Storage (encrypted conversation history), DA (attestation anchoring)
**Demo**: Packet capture proving operator sees only ciphertext + on-chain attestation proving what ran.
**Build**: 4-5 days | **Risk**: Low — extends 0G's TEE narrative from training to inference. **GEASS reusable**.

### 2. VEIL — MEV-Resistant Transaction Sequencing ⭐ HIGH
**Pitch**: Commit-reveal tx sequencing where transactions are sealed in TEE until threshold time. Front-running is cryptographically impossible.
**How**: Encrypted tx intents → TEE nodes aggregate → threshold M-of-N decryption at pre-committed block → simultaneous execution. Sequencer contract enforces + slashes non-sealed submissions.
**0G**: TEE Compute (sealed aggregation + threshold decryption), Chain (sequencer contract + slashing), DA (sealed bundle publication)
**Demo**: Submit two txs → show MEV bot seeing only ciphertext → both execute at same block, no sandwich.
**Build**: 5-6 days | **Risk**: Medium — threshold decryption coordination is non-trivial

### 3. MOSAIC — Federated Private Fine-Tuning ⭐ MED-HIGH
**Pitch**: Organizations collaboratively fine-tune a model without any participant seeing another's data. Gradients encrypted inside TEE enclaves.
**How**: Each participant's data → dedicated TEE node → fine-tuning pass → only encrypted gradient delta exits → aggregator TEE merges → model update published. Attestation proves data never left enclave.
**0G**: TEE Compute (training + aggregation enclaves), Storage (encrypted datasets), Chain (round coordination), DA (gradient commitments)
**Demo**: Two "organizations" fine-tune together → show neither sees the other's data → merged model improves.
**Build**: 6-7 days | **Risk**: High — most complex build, incomplete demo kills you

### 4. PHANTOM LEDGER — Private Smart Contract Execution ⭐ MED
**Pitch**: TEE-based private execution layer. Business logic runs sealed, outputs encrypted per-recipient, compliance oracle generates proofs without seeing data.
**How**: Contracts deployed with TEE flag → 0G TEE runs logic on private state → encrypted state to Storage → compliance attestation on-chain.
**0G**: TEE Compute (sealed execution), Storage (encrypted state), Chain (attestation verification)
**Demo**: Private token transfer → encrypted on-chain state → compliance oracle proves non-negative balance without revealing amounts.
**Build**: 5 days | **Risk**: Medium — "private smart contracts" is crowded narrative, compliance angle is differentiator

### 5. SILENCER — Encrypted Agent Memory + Verifiable Amnesia ⭐ MED
**Pitch**: AI agent memory is encrypted on 0G. Reasoning in TEE. Users can provably forget specific memories — GDPR-compliant sovereign agents.
**How**: Memory fragments encrypted → 0G Storage. TEE decrypts for reasoning → re-encrypts. User controls memory registry on-chain. "Forget" = remove CID + attestation it was never accessed again.
**0G**: Storage (encrypted memory), TEE Compute (sealed reasoning), Chain (memory registry + deletion audit)
**Demo**: Create memories → use them → forget them → prove they're gone. "Verifiable amnesia."
**Build**: 3-4 days (GEASS reuse) | **Risk**: Medium — softer technical story, position as cryptographic primitive

---

## STRATEGIC RECOMMENDATIONS

### If picking ONE idea to maximize win probability:
**ORACLE DARK (Track 2)** — Directly answers the track brief's stated innovation area. TEE sealed inference for trading is the exact thing judges want to see. 4-5 day build. Visceral demo.

### If picking based on SPEED (solo dev, tight timeline):
**SILENCER (Track 5)** — 3-4 days with GEASS reuse. "Verifiable amnesia" is a memorable concept. Or **SHADE (Track 5)** at 4-5 days with stronger technical depth.

### If picking for MAXIMUM NOVELTY:
**ClawReplay (Track 1)** — Deterministic agent execution replay doesn't exist anywhere. Highest ceiling, tightest execution risk.

### If picking to USE EXISTING CODE (GEASS):
**SHADE (Track 5)** — Private inference is what GEASS already does. Add TEE attestation + on-chain verification layer. Natural evolution.

### Possible MULTI-TRACK strategy:
Submit **SHADE** (Track 5) + **ORACLE DARK** (Track 2) — they share TEE infrastructure. Build the TEE inference layer once, apply it to privacy (SHADE) and trading (ORACLE DARK). Double your chances.

### Ideas to AVOID:
- **DREAMFORGE** — too ambitious for solo, gaming framing dilutes
- **MOSAIC** — 6-7 days, incomplete demo is fatal
- **QUORUM ALPHA** — coordination complexity too high for hackathon
