# 0G APAC Hackathon — Checkpoint Submission

## Project Name
Orichalcos

## Track
Track 2: Agentic Trading Arena (Verifiable Finance)

## One-line Description
An autonomous DeFi trading vault where AI strategy inference runs inside 0G's TEE compute — every trade decision is cryptographically attested and stored on 0G Storage, with the agent itself minted as an ERC-7857 Intelligent NFT.

## Current Progress

### Deployed & Live on 0G Galileo Testnet
- 5 smart contracts deployed and verified:
  - OrichalcosVault (autonomous trading vault with attestation registry)
  - OrichalcosPair (constant-product AMM with seeded WETH/USDC liquidity)
  - OrichalcosINFT (simplified ERC-7857 Intelligent NFT)
  - MockWETH + MockUSDC tokens
- Vault funded with 10 WETH + 30,000 USDC
- 16/16 Foundry tests passing

### Agent Service (TypeScript)
- Autonomous trading loop running live — monitors market, generates signals, executes trades on-chain
- 0G Storage integration working — attestation proofs uploaded with Merkle roots registered on-chain
- INFT minted on-chain — agent identity tokenized as ERC-7857
- 0G Compute TEE integration built (pending testnet token funding for 3 OG ledger requirement)
- Mock compute mode for development/demo

### Dashboard (Next.js)
- Vault stats, trade history table, PnL chart
- Side-by-side comparison view (sealed vs exposed agent)
- Attestation detail viewer with 0G explorer links

### MEV Simulation
- Side-by-side simulation engine: sealed agent vs exposed agent + MEV sandwich bot
- HTTP API for dashboard real-time polling

## 0G Components Used
1. **0G Chain** — All contracts deployed on Galileo testnet (Chain ID: 16602)
2. **0G Compute (TEE)** — Strategy inference via `@0glabs/0g-serving-broker` with TEE verification
3. **0G Storage** — Attestation proofs stored via `@0gfoundation/0g-ts-sdk`, Merkle roots on-chain
4. **INFT (ERC-7857)** — Agent minted as Intelligent NFT with encrypted metadata on 0G Storage

## Contract Addresses
- OrichalcosVault: `0xdaaa0a7b450198b5111a579864504e083f92b198`
- OrichalcosPair: `0x062b41f54f6ce612e82bf0b7e8385a8f3a5d8d81`
- OrichalcosINFT: `0x6286ae313d7621dfe18afab15cd3384eadc92fdd`

## What's Next
- Polish the side-by-side demo for maximum visual impact
- Get real TEE inference working (need 3+ OG for compute ledger)
- Record demo video
- Submit second project: 0Geass (Private Autonomous DAO Governance Agent)

## Team
Solo developer
