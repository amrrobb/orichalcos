---
title: "feat: 0Geass — Private Autonomous DAO Governance Agent"
type: feat
status: active
date: 2026-04-13
origin: docs/brainstorms/2026-04-13-0geass-requirements.md
---

# 0Geass — Private Autonomous DAO Governance Agent

## Overview

Build an autonomous AI agent on 0G that privately reasons about DAO proposals inside TEE compute, votes via commit-reveal, and stores encrypted reasoning on 0G Storage. The killer demo: a briber offers tokens to influence a vote, but can't verify compliance because the vote is sealed — proving bribery resistance through cryptographic privacy.

## Problem Frame

DAO governance transparency enables vote buying, social pressure, and voter apathy. Votes visible before the period ends let bribers verify compliance and whales signal to influence outcomes. 0Geass uses 0G's TEE compute for sealed reasoning and commit-reveal voting to make bribery pointless — you can't verify how an agent voted until the period ends. (see origin: docs/brainstorms/2026-04-13-0geass-requirements.md)

## Requirements Trace

- R1. Mock DAO governance contract with proposal creation, commit-reveal voting, tally
- R2. Mock governance token (ERC-20)
- R3. Commit-reveal voting: hash(vote + salt) during voting, reveal after deadline
- R4. All contracts verified on 0G explorer
- R5. Autonomous Node.js/TypeScript agent service
- R6. User-configurable governance values (natural language)
- R7. Reasoning via 0G Compute TEE inference
- R8. Agent commits encrypted vote, auto-reveals after period
- R9. TEE attestation per vote decision
- R10. Encrypted reasoning on 0G Storage
- R11. On-chain attestation links: vote TX → Merkle root → Storage
- R12. Dashboard: proposals, vote status, reasoning (post-reveal), attestations
- R13. Bribery resistance demo
- R14. Post-reveal reasoning view with TEE proofs
- R15. README with architecture, setup, addresses
- R16. Demo video (2-3 min)

## Scope Boundaries

- NOT a full DAO framework — minimal governance for demo
- NOT token-weighted voting — simple 1-address-1-vote
- NOT multi-user delegation — single user + single agent
- NOT time-lock or proposal execution — vote + tally only
- NOT integrating Governor/Snapshot — custom minimal contracts
- NOT using Venice.ai — 0G Compute only

## Context & Research

### Shared 0G SDK Knowledge (from Orichalcos research)

**0G Compute** (`@0glabs/0g-serving-broker@0.6.2`):
- `createZGComputeNetworkBroker(wallet)` → OpenAI-compatible API
- Setup: addLedger(3 OG) → transferFund(1 OG per provider) → acknowledgeProviderSigner
- Single-use headers per request
- `processResponse(provider, chatId, content)` → boolean (TEE verification)
- Testnet models: Qwen-2.5-7B, GPT-OSS-20B, Gemma-3-27B

**0G Storage** (`@0gfoundation/0g-ts-sdk`):
- `MemData` for in-memory uploads
- `merkleTree()` → rootHash (bytes32) before upload
- Turbo indexer: `https://indexer-storage-testnet-turbo.0g.ai`

**0G Chain**: Galileo testnet, chain ID 16602, `evm_version = "cancun"`, Solidity 0.8.19

### Commit-Reveal Voting Pattern

Standard pattern: voter submits `keccak256(abi.encodePacked(proposalId, vote, salt))` during voting period. After deadline, voter calls `reveal(proposalId, vote, salt)` — contract verifies hash matches. Until reveal, vote direction is hidden on-chain.

This is simpler than ZK-based private voting (like MACI) but sufficient for the demo. The TEE compute adds the "why" privacy — not just hiding the vote but hiding the reasoning.

### Code Reuse from Orichalcos

Both projects share:
- 0G Compute integration (`@0glabs/0g-serving-broker` setup + inference)
- 0G Storage integration (`@0gfoundation/0g-ts-sdk` upload + download)
- Next.js dashboard pattern
- Foundry contract tooling + 0G Chain deployment

Factor shared code into a `shared/` package or copy key files. The compute + storage modules from Orichalcos can be reused directly with different prompt templates.

## Key Technical Decisions

- **Commit-reveal over ZK voting**: ZK voting (e.g., MACI) would take 5+ days alone. Commit-reveal achieves the same demo effect (hidden votes) in ~100 lines of Solidity. The TEE reasoning privacy is the novel part, not the vote hiding mechanism.
- **keccak256(abi.encodePacked(proposalId, vote, salt))**: Standard, gas-cheap, well-understood. Salt is a random bytes32 generated client-side and stored locally by the agent.
- **Free-text governance values over sliders/categories**: Natural language is more expressive, better demo narrative ("I told my agent to prioritize security, and it voted against the risky proposal"), and the LLM handles the interpretation naturally.
- **Client-side encryption for 0G Storage**: The SDK doesn't natively encrypt. Agent encrypts reasoning JSON with AES-256-GCM using a derived key before uploading. Decryption key published after voting period. Simple and sufficient.
- **Briber as dashboard UI element**: Simpler than a separate bot script. Dashboard shows a "Bribe Attempt" panel where a "briber" offers tokens. Panel shows: briber can see the commit hash on-chain but can't determine vote direction. After reveal, panel updates to show the bribe failed.
- **Same compute model as Orichalcos**: GPT-OSS-20B on testnet. Governance reasoning is less latency-sensitive than trading.

## Open Questions

### Resolved During Planning

- **Commit-reveal implementation**: `keccak256(abi.encodePacked(proposalId, uint8(vote), bytes32(salt)))` — vote is 0 (Against), 1 (For), 2 (Abstain). Salt is random bytes32.
- **Storage encryption**: Client-side AES-256-GCM. Key = keccak256(proposalId + agentPrivateKey). Published to on-chain event after reveal.
- **User values structure**: Free text string stored in agent config. Passed directly into LLM prompt as "Your governance principles: {values}".
- **Briber scripting**: Dashboard UI element, not separate bot. Simulated in the frontend with on-chain state reads to show what the briber can/can't see.

### Deferred to Implementation

- Exact prompt template for governance reasoning — test with sample proposals
- Whether Qwen-2.5-7B produces better governance reasoning than GPT-OSS-20B (test both)
- Timing of auto-reveal: agent polls block timestamp vs voting deadline, or uses a cron-style trigger

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification.*

```
┌─────────────────────────────────────────────────────┐
│                 0G Chain (Galileo)                    │
│                                                       │
│  ┌──────────────┐  ┌─────────────────────────────┐  │
│  │ GeassToken    │  │ GeassGovernor                │  │
│  │ (ERC-20 gov)  │  │  - createProposal(desc,dur) │  │
│  │ mint, delegate│  │  - commitVote(propId, hash)  │  │
│  └──────────────┘  │  - revealVote(propId,vote,   │  │
│                     │    salt)                      │  │
│                     │  - tallyVotes(propId)         │  │
│                     │  - getProposal(propId)        │  │
│                     │  - registerAttestation(       │  │
│                     │    propId, rootHash)           │  │
│                     │  - ProposalCreated event       │  │
│                     │  - VoteCommitted event         │  │
│                     │  - VoteRevealed event          │  │
│                     └─────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Agent Service (Node.js/TS)               │
│                                                       │
│  ┌─────────────┐  ┌────────────────────────────┐    │
│  │ Proposal     │  │ Governance Reasoner         │    │
│  │ Monitor      │  │  - Reads proposal details   │    │
│  │ (poll loop)  │──│  - Calls 0G Compute (TEE)   │    │
│  │              │  │  - Gets: vote + reasoning    │    │
│  └─────────────┘  │  - TEE attestation captured  │    │
│                    └──────────┬─────────────────┘    │
│                               │                       │
│                    ┌──────────▼─────────────────┐    │
│                    │ Vote Committer              │    │
│                    │  - Generate random salt     │    │
│                    │  - Commit hash on-chain     │    │
│                    │  - Encrypt reasoning (AES)  │    │
│                    │  - Upload to 0G Storage     │    │
│                    │  - Register attestation     │    │
│                    └──────────┬─────────────────┘    │
│                               │                       │
│                    ┌──────────▼─────────────────┐    │
│                    │ Auto-Revealer               │    │
│                    │  - Polls block.timestamp    │    │
│                    │  - After deadline: reveal() │    │
│                    │  - Publish decryption key   │    │
│                    └────────────────────────────┘    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Dashboard (Next.js)                      │
│                                                       │
│  - Active proposals list with status                  │
│  - Agent vote status: Pending → Committed → Revealed  │
│  - Post-reveal reasoning with TEE attestation         │
│  - Bribery demo panel (shows what briber can see)     │
│  - Governance values config                           │
│  - Links to 0G Explorer + 0G Storage                  │
└─────────────────────────────────────────────────────┘
```

## Implementation Units

### Phase 1: Governance Contracts (Day 1)

- [ ] **Unit 1: Governance Token + DAO Contract**

**Goal:** Deploy the commit-reveal governance system on 0G Galileo.

**Requirements:** R1, R2, R3, R4

**Dependencies:** None

**Files:**
- Create: `contracts/src/GeassToken.sol`
- Create: `contracts/src/GeassGovernor.sol`
- Create: `contracts/script/Deploy.s.sol`
- Create: `contracts/test/GeassGovernor.t.sol`
- Create: `contracts/foundry.toml`

**Approach:**
- `GeassToken`: Standard ERC-20 with `mint()` for demo. Pre-mint supply to deployer.
- `GeassGovernor`:
  - `createProposal(string description, uint256 votingDuration)` → proposalId. Emits `ProposalCreated`.
  - `commitVote(uint256 proposalId, bytes32 commitHash)` — stores hash, emits `VoteCommitted(proposalId, voter, commitHash)`. Only during voting period.
  - `revealVote(uint256 proposalId, uint8 vote, bytes32 salt)` — verifies `keccak256(abi.encodePacked(proposalId, vote, salt)) == commitHash`. Only after voting deadline. Emits `VoteRevealed(proposalId, voter, vote)`.
  - `tallyVotes(uint256 proposalId)` — counts revealed votes, sets result (For/Against/Tie). Only after reveal period.
  - `registerAttestation(uint256 proposalId, address voter, bytes32 storageRootHash)` — maps vote to 0G Storage reasoning.
  - `getProposal(uint256 proposalId)` → struct with description, deadline, voteCount, status
  - Proposal states: Active → VotingClosed → Revealed → Tallied
  - `delegateVotingPower(address agent)` — allows agent to commit/reveal on behalf of token holder
- Foundry config: `evm_version = "cancun"`, `solc_version = "0.8.19"`, optimizer on

**Patterns to follow:**
- OathKeeper: `require()` with string messages, simple access control
- `vm.warp()` for deadline testing, `vm.prank()` for agent delegation testing

**Test scenarios:**
- Happy path: create proposal → commit vote → warp past deadline → reveal → tally → correct result
- Error path: commit after deadline → reverts
- Error path: reveal with wrong salt → reverts
- Error path: reveal before deadline → reverts
- Error path: non-delegated address commits → reverts
- Edge case: commit but never reveal → vote not counted in tally
- Happy path: delegateVotingPower → agent commits and reveals on behalf of user
- Integration: full lifecycle — create proposal, commit, reveal, tally, register attestation

**Verification:**
- Full governance lifecycle works on 0G testnet
- Committed votes are just hashes — no vote direction visible
- Contracts verified on explorer

---

### Phase 2: Agent Service (Days 2-3)

- [ ] **Unit 2: 0G Compute + Governance Reasoning**

**Goal:** Connect to 0G TEE inference for governance reasoning.

**Requirements:** R6, R7, R9

**Dependencies:** None (can parallel with Unit 1)

**Files:**
- Create: `agent/src/compute.ts` (reuse from Orichalcos with different prompt template)
- Create: `agent/src/types.ts`
- Create: `agent/src/prompts.ts`
- Create: `agent/package.json`
- Create: `agent/tsconfig.json`
- Create: `agent/.env.example`
- Create: `agent/test/compute.test.ts`

**Approach:**
- Reuse 0G Compute broker setup from Orichalcos (addLedger, transferFund, acknowledgeProviderSigner)
- `getGovernanceDecision(proposal: Proposal, userValues: string)` function:
  - Build prompt: "You are a DAO governance agent. Your governance principles: {userValues}. Analyze this proposal: {proposal.description}. Decide: FOR, AGAINST, or ABSTAIN. Provide your reasoning."
  - Call via OpenAI SDK with single-use headers
  - Parse response into `GovernanceDecision: { vote: 0|1|2, reasoning: string, confidence: number }`
  - Capture TEE attestation: `{ chatId, model, isValid, timestamp, inputHash, outputHash }`
- `inputHash` = keccak256 of prompt string
- `outputHash` = keccak256 of raw response

**Test scenarios:**
- Happy path: getGovernanceDecision with proposal + values → returns structured vote + reasoning
- Happy path: attestation captured with valid chatId and isValid=true
- Error path: model returns unparseable response → defaults to ABSTAIN
- Edge case: very long proposal description → truncate to model context limit

**Verification:**
- Can call 0G Compute and get governance reasoning
- Vote decision is structured (0/1/2) with natural language reasoning

---

- [ ] **Unit 3: Storage + Encryption**

**Goal:** Encrypt and store reasoning on 0G Storage, with post-reveal decryption.

**Requirements:** R10, R11

**Dependencies:** Unit 2 (needs reasoning data shape)

**Files:**
- Create: `agent/src/storage.ts` (reuse upload/download from Orichalcos)
- Create: `agent/src/crypto.ts` (AES-256-GCM encrypt/decrypt)
- Create: `agent/test/crypto.test.ts`

**Approach:**
- `encryptReasoning(reasoning: string, proposalId: number, agentKey: string)`:
  - Derive encryption key: `keccak256(abi.encodePacked(proposalId, agentKey))`
  - Encrypt with AES-256-GCM using Node.js `crypto` module
  - Return `{ ciphertext, iv, authTag }`
- `decryptReasoning(encrypted, proposalId, agentKey)` → plaintext reasoning
- `storeEncryptedReasoning(encrypted, attestation)`:
  - Package as JSON: `{ encryptedReasoning: { ciphertext, iv, authTag }, attestation: { model, inputHash, outputHash, timestamp, chatId, isValid } }`
  - Upload via MemData to 0G Storage turbo indexer
  - Return rootHash (bytes32)
- `retrieveAndDecrypt(rootHash, proposalId, agentKey)` → plaintext reasoning + attestation

**Test scenarios:**
- Happy path: encrypt → store → retrieve → decrypt → matches original reasoning
- Error path: decrypt with wrong key → throws
- Happy path: rootHash is valid bytes32 format
- Edge case: empty reasoning string → still encrypts and stores successfully

**Verification:**
- Round-trip encryption + storage works
- Encrypted data on 0G Storage is not readable without the key

---

- [ ] **Unit 4: Autonomous Governance Loop**

**Goal:** Wire everything into an autonomous agent that monitors proposals, reasons, and votes.

**Requirements:** R5, R8

**Dependencies:** Units 1, 2, 3

**Files:**
- Create: `agent/src/agent.ts` (main loop)
- Create: `agent/src/monitor.ts` (proposal watcher)
- Create: `agent/src/voter.ts` (commit + reveal logic)
- Create: `agent/src/config.ts`
- Create: `agent/src/index.ts` (entry point)

**Approach:**
- `ProposalMonitor`: polls GeassGovernor for new ProposalCreated events every 10s
- `Voter`:
  - `commitVote(proposalId, decision)`: generate random salt → compute commitHash → call `governor.commitVote()` → store salt + decision locally (in-memory map + optional file backup)
  - `revealVote(proposalId)`: after deadline → call `governor.revealVote(proposalId, vote, salt)`
- Main loop (`runAgent(config)`):
  1. Poll for new proposals
  2. For each unprocessed proposal:
     a. Call `getGovernanceDecision(proposal, userValues)` → decision + attestation
     b. Encrypt reasoning → upload to 0G Storage → get rootHash
     c. Commit vote on-chain
     d. Register attestation on-chain: `governor.registerAttestation(proposalId, agent, rootHash)`
     e. Store salt + rootHash locally for later reveal
  3. Check for proposals past deadline → auto-reveal any committed votes
  4. Sleep for poll interval
- Config: `{ governorAddress, tokenAddress, agentPrivateKey, userValues, pollInterval, providerAddress }`

**Test scenarios:**
- Happy path: new proposal → agent reasons → commits → waits for deadline → auto-reveals. Full cycle.
- Edge case: proposal already committed → skip (don't double-commit)
- Edge case: deadline passed before agent processes → skip commit, log warning
- Error path: 0G Compute fails → agent logs error, skips proposal, retries next poll
- Integration: create 2 proposals → agent votes on both → both revealed after deadlines

**Verification:**
- Agent runs continuously, processes proposals without human intervention
- Committed votes are hidden (only hashes on-chain)
- Auto-reveal happens after deadline with correct vote + salt

---

### Phase 3: Dashboard + Demo (Days 4-5)

- [ ] **Unit 5: Dashboard Foundation**

**Goal:** Build the governance dashboard with proposal list and vote status.

**Requirements:** R12

**Dependencies:** Units 1, 4

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/src/app/layout.tsx`
- Create: `dashboard/src/app/page.tsx`
- Create: `dashboard/src/app/globals.css`
- Create: `dashboard/src/lib/contracts.ts`
- Create: `dashboard/src/hooks/useProposals.ts`
- Create: `dashboard/src/hooks/useVoteStatus.ts`
- Create: `dashboard/src/components/ProposalCard.tsx`
- Create: `dashboard/src/components/VoteStatusBadge.tsx`
- Create: `dashboard/src/components/ValuesConfig.tsx`

**Approach:**
- Next.js 14, App Router, client-side reads via ethers.js
- `useProposals` hook: reads proposal list from GeassGovernor, polls every 5s
- `useVoteStatus` hook: for each proposal, checks if agent committed, revealed, or pending
- `ProposalCard`: description, deadline countdown, vote status badge, tally (if revealed)
- `ValuesConfig`: text area where user inputs governance values. Saved to localStorage (or agent API endpoint). Display-only for demo.
- `VoteStatusBadge`: Pending (gray) → Committed (yellow, shows hash) → Revealed (green, shows vote + reasoning link)

**Patterns to follow:**
- OathKeeper dashboard: polling pattern, dark theme, card layout

**Test scenarios:**
- Happy path: proposals load, status badges update as agent votes
- Edge case: no proposals → empty state
- Happy path: countdown timer reaches zero → status transitions from "Voting Open" to "Reveal Phase"

**Verification:**
- Dashboard renders proposals and vote statuses correctly
- Data matches on-chain state

---

- [ ] **Unit 6: Bribery Demo + Reasoning Reveal**

**Goal:** Build the bribery resistance demo and post-reveal reasoning viewer.

**Requirements:** R13, R14

**Dependencies:** Units 3, 5

**Files:**
- Create: `dashboard/src/components/BriberyDemo.tsx`
- Create: `dashboard/src/components/ReasoningViewer.tsx`
- Create: `dashboard/src/app/proposal/[id]/page.tsx`
- Modify: `dashboard/src/app/page.tsx` (add bribery demo section)

**Approach:**
- `BriberyDemo`: interactive panel for a specific proposal
  - Shows: "A briber wants you to vote FOR. They offer 100 GEASS tokens."
  - During voting period: shows what briber can see on-chain — only the commit hash. "Briber cannot determine vote direction from hash: 0xabcd..."
  - After reveal: shows the actual vote. "Agent voted AGAINST based on governance values. The bribe was worthless."
  - Visual: red X on bribe attempt, green checkmark on privacy protection
- `ReasoningViewer`: for a revealed proposal
  - Fetch attestation rootHash from contract
  - Download encrypted reasoning from 0G Storage
  - Decrypt with derived key (key published after reveal — agent posts to a simple API or on-chain event)
  - Display: full reasoning text, TEE attestation (model, timestamps, hashes), links to explorer + storage
- Proposal detail page (`/proposal/[id]`): combines ProposalCard + VoteStatus + BriberyDemo + ReasoningViewer

**Test scenarios:**
- Happy path: during voting → bribery panel shows "cannot determine vote" with commit hash
- Happy path: after reveal → reasoning viewer shows decrypted reasoning with attestation proof
- Edge case: reasoning not yet decryptable (voting still open) → shows "Reasoning sealed until voting ends"
- Happy path: all explorer links work (tx hash, contract address, storage CID)

**Verification:**
- Bribery demo clearly shows the information asymmetry
- Reasoning viewer shows real decrypted text from 0G Storage with TEE proof

---

### Phase 4: Polish + Submission (Day 6)

- [ ] **Unit 7: Demo Script + Documentation**

**Goal:** Create reproducible demo flow and submission materials.

**Requirements:** R15, R16

**Dependencies:** All previous units

**Files:**
- Create: `README.md`
- Create: `scripts/demo.sh` (optional — seeds proposals for demo)

**Approach:**
- Demo script: deploy contracts → mint tokens → create 2-3 proposals → start agent → show dashboard → walk through bribery demo → show reveal
- README: Overview, Problem Statement, Architecture Diagram, 0G Components Used (Chain + Compute/TEE + Storage), How It Works (commit-reveal + TEE reasoning), Setup Instructions, Contract Addresses + Explorer Links, Demo Guide, Screenshots
- Demo video (2-3 min): configure values → proposal created → agent commits → bribery attempt shown → deadline passes → reveal → reasoning with TEE proof visible

**Test expectation: none** — documentation artifact.

**Verification:**
- README complete with all required elements
- Demo flow runs end-to-end without manual intervention (except initial setup)
- All explorer links and contract addresses correct

## System-Wide Impact

- **Interaction graph:** Agent polls GeassGovernor events → 0G Compute (TEE reasoning) → GeassGovernor (commit/reveal) → 0G Storage (encrypted reasoning). Dashboard reads from GeassGovernor + 0G Storage.
- **Error propagation:** Agent is fault-tolerant — compute failures skip the proposal. Storage failures log but don't block voting (attestation registration can be retried).
- **State lifecycle risks:** Agent must track which proposals it has committed to (avoid double-commit). Salt must be persisted between commit and reveal — if agent restarts, salts must be recoverable (file-based backup).
- **Unchanged invariants:** GeassToken is a standard ERC-20 with no custom transfer logic.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 0G Compute produces poor governance reasoning | Test prompt templates early, iterate. Fall back to rule-based reasoning for demo if needed |
| Salt lost between commit and reveal (agent restart) | Persist salts to `agent/data/salts.json` file, load on startup |
| Commit-reveal timing issues (blocks not aligned with deadline) | Use generous deadline (e.g., 5 min for demo). Agent polls every 10s — worst case 10s late on reveal |
| AES encryption key derivation is simplistic | Acceptable for hackathon. Note in README as "demo-grade encryption". Production would use proper KMS |
| Faucet rate limits | Share funded wallets across both projects. Fund early |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-13-0geass-requirements.md](docs/brainstorms/2026-04-13-0geass-requirements.md)
- **0G Compute Starter Kit:** https://github.com/0gfoundation/0g-compute-ts-starter-kit
- **0G Storage SDK:** https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
- **0G Chain deployment:** https://docs.0g.ai/developer-hub/building-on-0g/contracts-on-0g/deploy-contracts
- **Commit-reveal voting pattern:** https://medium.com/swlh/exploring-commit-reveal-schemes-on-ethereum-c4ff5a777db8
- **OathKeeper (pattern reference):** /Users/ammar.robb/Documents/Web3/hackathons/oathkeeper/
- **GEASS (privacy AI reference):** Previous Synthesis hackathon project
