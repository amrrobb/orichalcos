---
date: 2026-04-13
topic: orichalcos-tee-sealed-trading-agent
---

# Orichalcos — Autonomous TEE-Sealed Trading Agent

## Problem Frame

DeFi trading agents operate in the open — their strategies, inference calls, and decision logic are visible to anyone monitoring the network. This exposes them to:
- **Front-running**: MEV bots see pending trades and sandwich them
- **Strategy theft**: Competitors reverse-engineer profitable strategies by watching agent behavior
- **Trust deficit**: Users depositing into agent-managed vaults can't verify what model actually ran or whether the operator manipulated outputs

0G's TEE-verified compute network solves this by running AI inference inside trusted execution environments — the strategy reasoning is sealed, and a cryptographic attestation proves what model ran on what input. Orichalcos is an autonomous trading vault that uses this to create the first **verifiably private, autonomous DeFi strategy agent**.

## User Flow

```
User deposits funds into Orichalcos Vault (0G Chain)
        │
        ▼
Autonomous Agent (Node.js service, runs continuously)
        │
        ├── Monitors market data (price feeds, pool state)
        │
        ├── Sends strategy prompt to 0G Compute (TEE-sealed)
        │   └── Model reasons about position sizing, entry/exit
        │       └── TEE attestation generated (model ID, input hash, timestamp)
        │
        ├── Executes trade on DEX (Uniswap V2 on 0G Chain)
        │
        ├── Stores attestation proof on 0G Storage
        │   └── On-chain Merkle root links to full attestation data
        │
        └── Updates dashboard (PnL, trade history, attestation log)

User views dashboard:
  - Live PnL and trade history
  - TEE attestation proofs (verifiable on-chain)
  - Side-by-side comparison: sealed vs exposed agent
```

## Requirements

**Vault & On-Chain Infrastructure**
- R1. Smart contract vault on 0G Chain (Galileo testnet) where users deposit funds (mock WETH/USDC)
- R2. Uniswap V2 AMM deployed on 0G Chain with seeded liquidity pools (WETH/USDC minimum)
- R3. Mock ERC-20 tokens (WETH, USDC) with faucet or pre-minted supply for demo
- R4. All contracts verified on 0G block explorer with working links

**Autonomous Trading Agent**
- R5. Node.js/TypeScript service that runs autonomously — monitors pool state, generates signals, executes trades without human intervention
- R6. Strategy reasoning via 0G Compute TEE inference (`@0glabs/0g-serving-broker`) — agent sends market context as prompt, receives trade decision
- R7. Agent executes trades on-chain via vault contract (not user's wallet directly)
- R8. Configurable trading parameters: pair, max position size, rebalance frequency

**TEE Verification & Attestation**
- R9. Each trade decision produces a TEE attestation: model ID, input hash, timestamp, output hash
- R10. Attestations stored on 0G Storage via `@0gfoundation/0g-ts-sdk` — Merkle root recorded on-chain
- R11. On-chain attestation registry contract that maps trade TX → attestation Merkle root for verification

**INFT (Agent-as-NFT)**
- R12. Trading agent minted as ERC-7857 INFT on 0G Chain — encrypted metadata includes strategy config, performance history, attestation references
- R13. INFT metadata stored encrypted on 0G Storage, referenced by on-chain token URI
- R14. Owning the INFT conceptually represents ownership of the agent (transfer = transfer agent ownership)

**Dashboard & Demo**
- R15. Web dashboard showing: vault balance, PnL chart, trade history, attestation verification
- R16. Side-by-side demo mode: two agents (sealed via TEE vs exposed/open) running identical strategies — simulated MEV bot extracts value from the open agent while the sealed agent remains protected. PnL divergence visible in real-time
- R17. Attestation detail view: click any trade to see TEE proof (model, input hash, timestamp), link to 0G Storage and block explorer

**Documentation**
- R18. README with architecture diagram, setup instructions, contract addresses, explorer links
- R19. Demo video (2-3 min) showing the full flow: deposit → agent trades → TEE attestation → side-by-side comparison

## Success Criteria

- Autonomous agent executes real trades on 0G Chain without human intervention for 30+ minutes continuously
- TEE attestation proofs are verifiable on-chain — judges can click explorer links and see the proof chain
- Side-by-side demo clearly shows PnL divergence between sealed and exposed agents
- 4 0G components used meaningfully: Chain (contracts + execution), Storage (attestations), Compute/TEE (inference), INFT (agent identity)
- All contracts deployed and verified on 0G Galileo testnet with working explorer links

## Scope Boundaries

- NOT building a production-grade DEX — Uniswap V2 is demo infrastructure only
- NOT implementing real cross-chain bridges or external price oracles — mock data is acceptable
- NOT building user auth/accounts — single-user demo with pre-funded wallet
- NOT optimizing for gas efficiency — hackathon demo, not production
- NOT building the "exposed agent" MEV simulation as a separate full system — can be simulated/scripted to show the contrast
- Fine-tuning on 0G Compute is OUT — too risky for demo reliability

## Key Decisions

- **Uniswap V2 over V3/V4**: V2 is ~300 lines vs 3000+. DEX is infrastructure, not the product. Solo dev, 10 days.
- **Strategy Vault over Launchpad/Middleware**: Deepest product narrative, best demo arc (deposit → agent trades → PnL), clearest "autonomous agent" story.
- **Agent-as-INFT**: Adds 4th 0G component for integration depth scoring. ~1 day extra work. Worth it for criterion #1.
- **Side-by-side demo**: Most visceral proof that TEE matters. Judges remember the PnL divergence.
- **Mock DEX on 0G Chain over cross-chain**: Maximizes 0G integration depth (criterion #1). All trades verifiable on 0G explorer.

## Dependencies / Assumptions

- 0G Galileo testnet remains stable through May 9
- 0G Compute TEE inference is accessible via `@0glabs/0g-serving-broker` with available models (DeepSeek-v3, GPT-OSS-120B)
- Faucet provides enough testnet tokens for demo (0.1 0G/day — may need multiple wallets or early funding)
- ERC-7857 INFT standard is implementable as custom ERC-721 extension (no deployed reference contracts exist)

## Outstanding Questions

### Resolve Before Planning
- None — all product decisions resolved

### Deferred to Planning
- [Affects R6][Needs research] Which 0G Compute model is best for trading signal generation? Test DeepSeek-v3 vs GPT-OSS-120B response quality and latency
- [Affects R9][Needs research] What exactly does the TEE attestation look like from `0g-serving-broker`? Need to inspect actual SDK response to design the attestation storage schema
- [Affects R12][Needs research] ERC-7857 INFT — review the standard spec and determine minimal implementation needed
- [Affects R16][Technical] How to simulate MEV extraction on the "exposed" agent — scripted bot or deterministic replay?
- [Affects R2][Technical] Exact Uniswap V2 fork to use — OpenZeppelin, SushiSwap, or raw Uniswap contracts?

## Next Steps

→ `/ce:plan` for structured implementation planning
