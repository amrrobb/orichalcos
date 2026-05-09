# Orichalcos — Full Project Handoff

## Hackathon: 0G APAC Hackathon
- **Prize pool**: $150,000 (no separate track prizes — one pool)
- **Grand Prizes**: 1st $45K, 2nd $35K, 3rd $20K
- **Excellence Awards**: 10 × $3,700
- **Community Awards**: 10 × $1,300
- **Deadline**: May 9, 2026, 23:59 UTC+8
- **Platform**: HackQuest (https://www.hackquest.io/hackathons/0G-APAC-Hackathon)

## Judging Criteria (in order of weight)
1. **0G Technical Integration Depth & Innovation** — Extent of adoption of 0G components, innovative solutions to AI/on-chain pain points
2. **Technical Implementation & Completeness** — Functional integrity, code quality, MANDATORY on-chain deployment (explorer link/contract address must be provided)
3. **Product Value & Market Potential** — Market fit, problem-solving capability, user value, growth roadmap
4. **User Experience & Demo Quality** — UI/UX intuitiveness, clarity and persuasiveness of pitch/demo
5. **Team Capability & Documentation** — Team background, quality of open-source code and README

## Mandatory Requirements
- At least one 0G component must be used (failure = point deduction)
- **Must publish at least one public project post on X** and submit the link — MANDATORY, will be checked
- Must submit through HackQuest platform before deadline
- On-chain deployment with explorer link/contract address required

## Tracks (categories, not separate prize pools)
1. **Track 1: Agentic Infrastructure & OpenClaw Lab** — agent frameworks, skills, pipelines
2. **Track 2: Agentic Trading Arena (Verifiable Finance)** — autonomous DeFi, yield optimizers, AI trading agents ← WE'RE HERE
3. **Track 3: Agentic Economy & Autonomous Applications** — economic protocols, consumer AI dApps
4. **Track 5: Privacy & Sovereign Infrastructure** — privacy protocols, MEV-resistant infra

---

## What Orichalcos Is

An autonomous DeFi trading vault on 0G Chain where AI strategy inference runs inside TEE-verified compute. Users deposit funds (WETH/USDC), the agent autonomously trades on a DEX, and every trade decision is cryptographically attested with proofs stored on 0G Storage. The agent itself is minted as an ERC-7857 Intelligent NFT (INFT).

### The Flow
1. User deposits WETH + USDC into vault contract on 0G Chain
2. Agent reads pool reserves/price every 30 seconds
3. Sends market context to 0G Compute (TEE-sealed Qwen 2.5 7B) — nobody can see the reasoning
4. AI decides buy/sell/hold
5. Agent executes swap via vault contract on DEX
6. TEE attestation (model, input hash, output hash, timestamp) stored on 0G Storage
7. Attestation Merkle root registered on-chain linked to the trade
8. Agent itself is an ERC-7857 INFT with performance data on 0G Storage

### 0G Components Used (4 — maximum integration depth)
| Component | Usage |
|-----------|-------|
| **0G Chain** | 5 smart contracts deployed on Galileo testnet (EVM L1) |
| **0G Compute (TEE)** | Strategy inference via Qwen 2.5 7B running in TeeML enclave |
| **0G Storage** | Attestation proofs uploaded via MemData, Merkle roots on-chain |
| **INFT (ERC-7857)** | Agent minted as Intelligent NFT with encrypted metadata |

---

## Deployed Contracts (0G Galileo Testnet, Chain ID 16602)

| Contract | Address | Explorer |
|----------|---------|----------|
| MockWETH | `0x2e6d0aa9ca3348870c7cbbc28bf6ea90a3c1fe36` | [View](https://chainscan-galileo.0g.ai/address/0x2e6d0aa9ca3348870c7cbbc28bf6ea90a3c1fe36) |
| MockUSDC | `0xc4cebf58836707611439e23996f4fa4165ea6a28` | [View](https://chainscan-galileo.0g.ai/address/0xc4cebf58836707611439e23996f4fa4165ea6a28) |
| OrichalcosPair | `0x062b41f54f6ce612e82bf0b7e8385a8f3a5d8d81` | [View](https://chainscan-galileo.0g.ai/address/0x062b41f54f6ce612e82bf0b7e8385a8f3a5d8d81) |
| OrichalcosVault | `0xdaaa0a7b450198b5111a579864504e083f92b198` | [View](https://chainscan-galileo.0g.ai/address/0xdaaa0a7b450198b5111a579864504e083f92b198) |
| OrichalcosINFT | `0x6286ae313d7621dfe18afab15cd3384eadc92fdd` | [View](https://chainscan-galileo.0g.ai/address/0x6286ae313d7621dfe18afab15cd3384eadc92fdd) |

**Deployer/Agent wallet**: `0x77C037fbF42e85dB1487B390b08f58C00f438812`
**Balance**: ~7.03 OG remaining
**0G Compute ledger**: Active, provider funded (Qwen 2.5 7B at `0xa48f01287233509FD694a22Bf840225062E67836`)

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Contracts | Solidity 0.8.24, Foundry, OpenZeppelin, evm_version=cancun |
| Agent | TypeScript, ethers.js v6, `@0glabs/0g-serving-broker`, `@0gfoundation/0g-ts-sdk`, OpenAI SDK |
| Dashboard | Next.js 16, Tailwind CSS, RainbowKit, Recharts, wagmi |
| Chain | 0G Galileo Testnet (Chain ID 16602, RPC: https://evmrpc-testnet.0g.ai) |

## Project Structure

```
hackquest-0g/
├── contracts/                    # Foundry
│   ├── src/
│   │   ├── tokens/MockWETH.sol   # ERC-20 with mint + WETH deposit/withdraw
│   │   ├── tokens/MockUSDC.sol   # ERC-20, 6 decimals
│   │   ├── dex/OrichalcosPair.sol # Constant-product AMM, 0.3% fee
│   │   ├── OrichalcosVault.sol   # Vault: deposit, trade (onlyAgent), attestation registry
│   │   └── OrichalcosINFT.sol    # Simplified ERC-7857 with dataHashes + descriptions
│   ├── test/OrichalcosTest.t.sol # 16 tests
│   └── script/Deploy.s.sol      # Full deployment script
├── agent/                        # TypeScript autonomous agent
│   └── src/
│       ├── compute.ts            # 0G Compute broker + TEE inference + mock mode
│       ├── storage.ts            # 0G Storage upload/download via MemData
│       ├── market.ts             # Pool state reader (reserves, price, vault balance)
│       ├── executor.ts           # On-chain trade execution + attestation registration
│       ├── inft.ts               # INFT minting + performance data updates
│       ├── agent.ts              # Main autonomous loop
│       ├── simulation/runner.ts  # MEV side-by-side simulation + HTTP API
│       ├── setup.ts              # One-time 0G Compute ledger + provider setup
│       ├── discover.ts           # List available compute providers
│       ├── config.ts             # Env var loader
│       ├── types.ts              # Type definitions
│       └── index.ts              # Entry point
├── dashboard/                    # Next.js web dashboard
│   └── src/
│       ├── app/page.tsx          # Main dashboard: vault stats, agent card, trade feed
│       ├── app/agent/page.tsx    # INFT display page
│       ├── app/attestation/[id]/page.tsx # TEE proof detail page
│       ├── app/providers.tsx     # RainbowKit + wagmi providers
│       ├── app/layout.tsx        # Root layout
│       ├── app/globals.css       # Custom fonts + animations + hex pattern bg
│       ├── hooks/useVault.ts     # Vault balance polling (5s)
│       ├── hooks/useTradeHistory.ts # Trade array polling (5s)
│       ├── hooks/useSimulation.ts # MEV simulation data polling (3s)
│       ├── lib/contracts.ts      # ABIs + addresses + constants
│       └── lib/wagmi.ts          # 0G chain config + RainbowKit config
├── docs/
│   ├── brainstorms/2026-04-13-orichalcos-requirements.md
│   ├── plans/2026-04-13-001-feat-orichalcos-tee-trading-agent-plan.md
│   └── checkpoint-submission.md
├── README.md
├── STATUS.md
└── deployments.json              # All contract addresses
```

---

## Current State

### What Works
- ✅ 5 contracts deployed on 0G Galileo testnet
- ✅ 16/16 Foundry tests passing
- ✅ Agent runs with REAL 0G Compute TEE inference (Qwen 2.5 7B, TEE valid: true)
- ✅ 6 trades executed on-chain autonomously
- ✅ Attestation proofs stored on 0G Storage with Merkle roots on-chain
- ✅ INFT minted on-chain (ERC-7857)
- ✅ Dashboard builds and renders (vault stats, trade feed, attestation page, agent page)
- ✅ RainbowKit wallet connection (Rabby/MetaMask)
- ✅ Checkpoint submitted (April 15)
- ✅ GitHub repo: https://github.com/amrrobb/orichalcos

### What's NOT Done
- ❌ **X/Twitter post** — MANDATORY for eligibility
- ❌ **HackQuest platform submission** — MANDATORY
- ❌ **Demo video** (2-3 min) — important for judging
- ❌ Latest dashboard redesign not pushed to GitHub
- ❌ Contract source verification on 0G explorer
- ❌ MEV simulation not tested end-to-end (code exists)
- ❌ Dashboard not deployed to public URL

---

## How to Run

### Agent
```bash
cd agent
source .env  # or cp .env.example .env and fill
npm run start  # runs autonomous trading loop
# Set MOCK_COMPUTE=true in .env to skip real TEE (no OG cost)
# Set MOCK_COMPUTE=false for real 0G Compute TEE inference
```

### Dashboard
```bash
cd dashboard
npm run dev  # http://localhost:3000
```

### Tests
```bash
cd contracts
forge test -vv  # 16 tests
```

### Deploy (already done)
```bash
cd contracts
source .env
forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

---

## Key SDK Patterns

### 0G Compute (TEE Inference)
```typescript
// CJS require needed — ESM exports broken on Node 23
const { createRequire } = await import("module");
const require = createRequire(import.meta.url);
const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");

broker = await createZGComputeNetworkBroker(wallet);
// Setup: addLedger(3 OG) + transferFund(1 OG) + acknowledgeProviderSigner
// Inference: getRequestHeaders() → OpenAI SDK call → processResponse(addr, chatId, usageData)
```

### 0G Storage
```typescript
import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
const indexer = new Indexer("https://indexer-storage-testnet-turbo.0g.ai");
const memData = new MemData(new TextEncoder().encode(json));
const [tree] = await memData.merkleTree();
const rootHash = tree.rootHash(); // bytes32 — store on-chain
await indexer.upload(memData, rpcUrl, signer);
```

### Gotchas
- `evm_version = "cancun"` required for 0G Chain contracts
- 0G Compute headers are SINGLE USE — regenerate per request
- processResponse signature: `(providerAddress, chatID, usageData)` — order matters
- `@0glabs/0g-serving-broker` ESM is broken on Node 23 — use CJS require workaround
- Compute ledger needs 3 OG minimum to create
- Testnet provider: `0xa48f01287233509FD694a22Bf840225062E67836` (Qwen 2.5 7B, chatbot)

---

## What Needs To Happen Before May 9

### MUST DO (eligibility)
1. Push latest code to GitHub
2. Post about project on X/Twitter
3. Submit on HackQuest platform with all required fields

### SHOULD DO (scoring)
4. Record 2-3 min demo video
5. Run agent for more trades (to show activity on-chain)
6. Verify contract sources on 0G explorer

### NICE TO HAVE
7. Deploy dashboard to public URL
8. Test MEV simulation side-by-side
9. Polish UI further
