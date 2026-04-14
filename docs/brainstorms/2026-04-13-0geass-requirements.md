---
date: 2026-04-13
topic: 0geass-private-autonomous-governance-agent
---

# 0Geass — Private Autonomous DAO Governance Agent

## Problem Frame

DAO governance is broken by transparency. When votes are public before the voting period ends:
- **Vote buying/bribery**: Bribers can verify compliance — "I'll pay you X if you vote Y, and I can check on-chain that you did"
- **Social pressure**: Large token holders influence smaller voters by voting first and signaling
- **MEV on governance**: Actors front-run large vote swings by watching mempool for vote transactions
- **Voter apathy**: Users with governance tokens don't vote because it requires reading proposals, reasoning about impact, and executing transactions

0Geass is an autonomous AI agent that privately reasons about DAO proposals inside 0G's TEE compute and votes on behalf of users — without revealing its reasoning or vote direction until after the voting period ends. The reasoning chain is encrypted and stored on 0G Storage, provably sealed by TEE attestation. This makes bribery pointless (you can't verify compliance), eliminates social pressure (no one knows how anyone voted), and solves voter apathy (the agent votes autonomously based on user-configured values).

Rebranded from GEASS (our Synthesis hackathon privacy AI project) for 0G ecosystem alignment.

## User Flow

```
User configures 0Geass agent:
  - Connect wallet (holds governance tokens on 0G Chain)
  - Set governance values: "prioritize security over growth",
    "oppose treasury spending > 10%", etc.
  - Delegate voting power to agent contract
        │
        ▼
Autonomous Agent (runs continuously)
        │
        ├── Monitors DAO contract for new proposals
        │
        ├── Reads proposal details (title, description, parameters)
        │
        ├── Sends to 0G Compute (TEE-sealed inference)
        │   ├── Prompt: proposal context + user's values + voting history
        │   ├── Model reasons privately about alignment
        │   └── TEE attestation: model ID, input hash, timestamp
        │
        ├── Casts ENCRYPTED vote on-chain
        │   └── Vote is committed but not revealed (commit-reveal scheme)
        │
        ├── Stores encrypted reasoning on 0G Storage
        │   └── Merkle root recorded on-chain, linked to vote TX
        │
        └── After voting period ends:
            ├── Votes revealed on-chain (bulk reveal)
            └── Reasoning decrypted and viewable on dashboard

Bribery Resistance Demo:
  Briber offers tokens → Can't verify agent's vote → Bribe is worthless
```

## Requirements

**DAO Contracts**
- R1. Mock DAO governance contract on 0G Chain (Galileo testnet) with proposal creation, commit-reveal voting, and tally
- R2. Mock governance token (ERC-20) with pre-distributed supply for demo
- R3. Commit-reveal voting: voters submit hash(vote + salt) during voting period, reveal after deadline. Prevents on-chain vote visibility before period ends
- R4. All contracts verified on 0G block explorer with working links

**Autonomous Governance Agent**
- R5. Node.js/TypeScript service that runs autonomously — monitors for new proposals, reasons about them, votes without human intervention
- R6. User-configurable governance values: natural language preferences that guide the agent's reasoning (e.g., "prioritize protocol security", "oppose inflationary proposals")
- R7. Reasoning via 0G Compute TEE inference (`@0glabs/0g-serving-broker`) — agent sends proposal + user values as prompt, receives vote decision + rationale
- R8. Agent commits encrypted vote on-chain, stores reveal key locally, auto-reveals after voting period ends

**Privacy & Attestation**
- R9. Each vote decision produces a TEE attestation: model ID, input hash (proposal + values), timestamp, output hash
- R10. Encrypted reasoning stored on 0G Storage via `@0gfoundation/0g-ts-sdk` — only decryptable after voting period ends
- R11. On-chain attestation links: vote TX → attestation Merkle root → 0G Storage CID for full reasoning

**Dashboard & Demo**
- R12. Web dashboard showing: active proposals, agent's vote status (committed/revealed), reasoning (post-reveal), attestation proofs
- R13. Bribery resistance demo: simulated briber offers tokens to vote a specific way. Show that the briber CANNOT verify the agent's vote during voting period. After reveal, show the agent voted based on values, not bribe. The bribe was worthless.
- R14. Post-reveal reasoning view: after voting ends, users see the full reasoning chain with TEE attestation proving it was generated privately

**Documentation**
- R15. README with architecture diagram, setup instructions, contract addresses, explorer links
- R16. Demo video (2-3 min) showing: configure values → proposal appears → agent reasons privately → votes → bribery attempt fails → reveal shows reasoning

## Success Criteria

- Agent autonomously detects, reasons about, and votes on proposals without human intervention
- Votes are provably private during voting period — no on-chain data reveals vote direction before reveal
- TEE attestation proves reasoning happened inside trusted environment (verifiable on-chain)
- Bribery resistance is demonstrable: briber cannot verify compliance
- 3 0G components used meaningfully: Chain (DAO contracts + voting), Storage (encrypted reasoning), Compute/TEE (private inference)
- All contracts deployed and verified on 0G Galileo testnet

## Scope Boundaries

- NOT building a full DAO framework — minimal governance contract for demo
- NOT implementing real token-weighted voting math — simple 1-token-1-vote
- NOT building multi-user delegation — single user delegates to single agent
- NOT implementing time-lock or execution of passed proposals — vote + tally only
- NOT integrating with existing DAO frameworks (Governor, Snapshot) — custom minimal contracts
- GEASS Venice.ai code may inform the inference layer but we use 0G Compute, not Venice

## Key Decisions

- **Private DAO Governance over generic privacy middleware**: Concrete product with clear value prop. "Bribery-resistant voting" is immediately legible to judges.
- **Commit-reveal scheme**: Standard cryptographic pattern. Simple to implement, clearly demonstrates vote privacy. Not novel but proven.
- **Bribery resistance as demo hook**: Most dramatic proof of private governance working. Judges remember "the bribe failed."
- **Autonomous over manual**: Agent votes without human intervention — hits the "agentic" requirement of the hackathon.
- **Post-reveal reasoning transparency**: After voting, full reasoning is decrypted. This differentiates from "just hiding your vote" — you prove HOW you reasoned, privately, with TEE attestation.

## Dependencies / Assumptions

- 0G Galileo testnet remains stable through May 9
- 0G Compute TEE inference accessible with suitable model for governance reasoning
- Commit-reveal pattern is gas-feasible on 0G Chain (should be, but untested)
- GEASS codebase provides reusable inference/privacy patterns (speeds up build)

## Outstanding Questions

### Resolve Before Planning
- None — all product decisions resolved

### Deferred to Planning
- [Affects R7][Needs research] Which 0G Compute model reasons best about governance proposals? Test with sample proposals
- [Affects R3][Technical] Commit-reveal implementation: keccak256(abi.encodePacked(vote, salt)) or more sophisticated scheme?
- [Affects R10][Needs research] 0G Storage encryption: client-side encrypt before upload, or does the SDK support encryption natively?
- [Affects R13][Technical] How to script the "briber" for demo — separate wallet/bot or simulated in dashboard UI?
- [Affects R6][Technical] How to structure user values for prompt engineering — free text, predefined categories, or weighted sliders?

## Next Steps

→ `/ce:plan` for structured implementation planning
