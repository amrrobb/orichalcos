# Orichalcos — TEE-Sealed Autonomous Trading Agent

An autonomous DeFi trading vault on 0G Chain where strategy inference runs inside TEE-verified compute. Every trade decision is cryptographically attested and stored on 0G's decentralized storage. The agent itself is minted as an ERC-7857 Intelligent NFT.

## The Problem

DeFi trading agents operate in the open — their strategies, inference calls, and decision logic are visible to anyone monitoring the network. This exposes them to:

- **Front-running**: MEV bots see pending trades and sandwich them
- **Strategy theft**: Competitors reverse-engineer profitable strategies
- **Trust deficit**: Users can't verify what model actually ran

## The Solution

Orichalcos uses 0G's TEE-verified compute network to seal the strategy reasoning inside a trusted execution environment. No one — including the operator — can see the strategy. A cryptographic attestation proves what model ran on what input, stored immutably on 0G Storage.

## Architecture

```
┌─────────────────────────────────────────────────┐
│               0G Chain (Galileo)                 │
│                                                   │
│  MockWETH ←→ OrichalcosPair ←→ MockUSDC          │
│                    ↕                              │
│  OrichalcosVault (deposits, trades, attestations) │
│  OrichalcosINFT (ERC-7857 agent identity)         │
└─────────────────────────────────────────────────┘
        ↕                          ↕
┌──────────────┐         ┌──────────────────┐
│ 0G Compute   │         │ 0G Storage       │
│ (TEE sealed  │         │ (Attestation     │
│  inference)  │         │  proofs stored   │
└──────────────┘         │  with Merkle     │
                         │  roots on-chain) │
                         └──────────────────┘
        ↕
┌──────────────────────────────────────────┐
│ Autonomous Agent (Node.js/TypeScript)     │
│                                           │
│ Monitor → Reason (TEE) → Trade → Attest   │
│                                           │
│ Side-by-side demo:                        │
│ Sealed agent vs Exposed agent + MEV bot   │
└──────────────────────────────────────────┘
        ↕
┌──────────────────────────────────────────┐
│ Dashboard (Next.js)                       │
│ PnL chart, trade history, attestation     │
│ viewer, side-by-side comparison, INFT     │
└──────────────────────────────────────────┘
```

## 0G Components Used

| Component | Usage | Why |
|-----------|-------|-----|
| **0G Chain** | Smart contracts (Vault, Pair, INFT), trade execution, attestation registry | All trading logic and proofs are on-chain and verifiable |
| **0G Compute (TEE)** | Strategy inference runs inside TEE — sealed from everyone including the operator | Prevents front-running and strategy theft |
| **0G Storage** | Each trade's TEE attestation (model ID, input hash, output hash, timestamp) is stored with Merkle root on-chain | Immutable, decentralized proof trail |
| **INFT (ERC-7857)** | The agent itself is minted as an Intelligent NFT with encrypted metadata on 0G Storage | Agent identity, ownership, and performance data are tokenized |

## Deployed Contracts (0G Galileo Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| MockWETH | `0x2e6d0aa9ca3348870c7cbbc28bf6ea90a3c1fe36` | [View](https://chainscan-galileo.0g.ai/address/0x2e6d0aa9ca3348870c7cbbc28bf6ea90a3c1fe36) |
| MockUSDC | `0xc4cebf58836707611439e23996f4fa4165ea6a28` | [View](https://chainscan-galileo.0g.ai/address/0xc4cebf58836707611439e23996f4fa4165ea6a28) |
| OrichalcosPair | `0x062b41f54f6ce612e82bf0b7e8385a8f3a5d8d81` | [View](https://chainscan-galileo.0g.ai/address/0x062b41f54f6ce612e82bf0b7e8385a8f3a5d8d81) |
| OrichalcosVault | `0xdaaa0a7b450198b5111a579864504e083f92b198` | [View](https://chainscan-galileo.0g.ai/address/0xdaaa0a7b450198b5111a579864504e083f92b198) |
| OrichalcosINFT | `0x6286ae313d7621dfe18afab15cd3384eadc92fdd` | [View](https://chainscan-galileo.0g.ai/address/0x6286ae313d7621dfe18afab15cd3384eadc92fdd) |

## Tech Stack

- **Contracts**: Solidity 0.8.24, Foundry, OpenZeppelin
- **Agent**: TypeScript, ethers.js v6, `@0glabs/0g-serving-broker`, `@0gfoundation/0g-ts-sdk`
- **Dashboard**: Next.js 14, Tailwind CSS, Recharts
- **Chain**: 0G Galileo Testnet (Chain ID: 16602)

## Quick Start

### Prerequisites

- Node.js 18+
- Foundry (`forge`, `cast`)
- 0G testnet tokens (faucet: https://faucet.0g.ai)

### 1. Deploy Contracts

```bash
cd contracts
cp .env.example .env  # Add your private key
source .env
forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

### 2. Run Agent

```bash
cd agent
cp .env.example .env  # Fill in contract addresses from deployment
npm install
npm run start
```

Set `MOCK_COMPUTE=true` in `.env` to run without 0G Compute (uses local strategy logic). Set to `false` with 3+ OG in wallet for real TEE inference.

### 3. Run Dashboard

```bash
cd dashboard
cp .env.example .env.local  # Fill in contract addresses
npm install
npm run dev
```

Open http://localhost:3000

### 4. Run Tests

```bash
cd contracts
forge test -vv  # 16 tests
```

## Demo Flow

1. Agent starts → reads vault balance (10 WETH + 30K USDC)
2. Monitors pool reserves and price
3. Sends market context to 0G Compute (TEE-sealed) → receives trade decision
4. Executes trade on-chain via vault contract
5. Stores TEE attestation on 0G Storage → Merkle root registered on-chain
6. Dashboard shows live PnL, trade history, attestation proofs
7. Side-by-side: sealed agent vs exposed agent — MEV bot sandwiches the exposed one

## How TEE Attestation Works

Each trade decision flows through:

```
Market Data → 0G Compute TEE Enclave → Trade Decision + Attestation
                                              ↓
                                     0G Storage (encrypted JSON)
                                              ↓
                                     Merkle Root → On-Chain Registry
```

The attestation includes: model ID, input hash (keccak256 of prompt), output hash (keccak256 of response), timestamp, TEE chat ID, and verification status. Anyone can download the attestation from 0G Storage using the Merkle root and verify it matches the on-chain record.

## Project Structure

```
orichalcos/
├── contracts/           # Foundry — Solidity smart contracts
│   ├── src/
│   │   ├── tokens/      # MockWETH, MockUSDC
│   │   ├── dex/         # OrichalcosPair (constant-product AMM)
│   │   ├── OrichalcosVault.sol
│   │   └── OrichalcosINFT.sol
│   ├── test/            # 16 tests
│   └── script/          # Deploy script
├── agent/               # TypeScript — Autonomous trading agent
│   └── src/
│       ├── compute.ts   # 0G Compute TEE integration
│       ├── storage.ts   # 0G Storage integration
│       ├── market.ts    # Pool state reader
│       ├── executor.ts  # On-chain trade execution
│       ├── inft.ts      # INFT minting + updates
│       ├── agent.ts     # Main autonomous loop
│       └── simulation/  # MEV side-by-side demo
├── dashboard/           # Next.js — Web dashboard
│   └── src/
│       ├── hooks/       # useVault, useTradeHistory, useSimulation
│       ├── components/  # VaultCard, TradeTable, PnLChart
│       └── lib/         # Contract ABIs + addresses
└── deployments.json     # All deployed contract addresses
```

## License

MIT
