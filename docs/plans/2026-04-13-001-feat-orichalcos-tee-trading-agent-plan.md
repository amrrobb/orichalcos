---
title: "feat: Orichalcos — Autonomous TEE-Sealed Trading Agent"
type: feat
status: active
date: 2026-04-13
origin: docs/brainstorms/2026-04-13-orichalcos-requirements.md
---

# Orichalcos — Autonomous TEE-Sealed Trading Agent

## Overview

Build an autonomous DeFi trading vault on 0G Chain where strategy inference runs inside TEE-verified compute. Users deposit funds, the agent trades autonomously, and every decision is cryptographically attested. A side-by-side demo shows PnL divergence between a sealed (TEE) and exposed agent to prove front-running resistance. The agent itself is minted as an ERC-7857 INFT.

## Problem Frame

DeFi trading agents expose their strategies to front-running, strategy theft, and trust deficits. 0G's TEE compute enables sealed inference where no one — including the operator — can see the strategy reasoning. Orichalcos proves this works with a live autonomous vault. (see origin: docs/brainstorms/2026-04-13-orichalcos-requirements.md)

## Requirements Trace

- R1. Vault contract on 0G Galileo testnet for user deposits
- R2. Uniswap V2 AMM on 0G Chain with seeded WETH/USDC pools
- R3. Mock ERC-20 tokens with pre-minted supply
- R4. All contracts verified on 0G explorer
- R5. Autonomous Node.js/TypeScript agent service
- R6. Strategy inference via 0G Compute TEE (`@0glabs/0g-serving-broker`)
- R7. Agent executes trades via vault contract
- R8. Configurable trading parameters
- R9. TEE attestation per trade decision
- R10. Attestations stored on 0G Storage with Merkle root on-chain
- R11. On-chain attestation registry (trade TX → Merkle root)
- R12. Agent minted as ERC-7857 INFT
- R13. INFT metadata on 0G Storage
- R14. INFT ownership = agent ownership
- R15. Dashboard: vault balance, PnL, trade history, attestation verification
- R16. Side-by-side demo: sealed vs exposed agent with MEV simulation
- R17. Attestation detail view with explorer links
- R18. README with architecture, setup, contract addresses
- R19. Demo video (2-3 min)

## Scope Boundaries

- NOT production DEX — Uniswap V2 is demo infrastructure
- NOT real price oracles — mock/scripted price movements
- NOT multi-user — single pre-funded wallet
- NOT gas-optimized — hackathon demo
- NOT full ERC-7857 transfer proofs — simplified INFT with data hashes + descriptions
- NOT fine-tuning on 0G — too risky for demo reliability

## Context & Research

### 0G Compute SDK (`@0glabs/0g-serving-broker@0.6.2`)

```
broker = await createZGComputeNetworkBroker(wallet)
broker.ledger.addLedger(3)                              // 3 OG minimum
broker.ledger.transferFund(provider, "inference", 1 OG)  // per provider
broker.inference.acknowledgeProviderSigner(provider)      // once per provider
broker.inference.getServiceMetadata(provider) → { endpoint, model }
broker.inference.getRequestHeaders(provider, query) → headers  // SINGLE USE
// Then standard OpenAI SDK: openai.chat.completions.create({...}, { headers })
broker.inference.processResponse(provider, chatId, content) → boolean  // TEE verify
```

**Testnet models:** Qwen-2.5-7B, GPT-OSS-20B, Gemma-3-27B
**Key gotcha:** Headers are single-use. Regenerate per request.

### 0G Storage SDK (`@0gfoundation/0g-ts-sdk`)

```
indexer = new Indexer(INDEXER_RPC_TURBO)
memData = new MemData(new TextEncoder().encode(jsonString))
[tree, err] = await memData.merkleTree()
rootHash = tree.rootHash()   // bytes32 — compute BEFORE upload
[tx, err] = await indexer.upload(memData, RPC_URL, signer)
```

**Root hash is the on-chain proof key** — store it in contract mapping.

### ERC-7857 INFT

Reference: `github.com/0gfoundation/0g-agent-nft` branch `eip-7857-draft`

Core concept: `dataHashes[]` (bytes32, pointing to 0G Storage roots) + `dataDescriptions[]` (strings like "strategy_config", "performance_history"). TEE transfer proofs have TODOs in reference impl — **use simplified version for hackathon**: mint with data hashes, skip transfer proof machinery.

### 0G Chain Deployment

- Galileo testnet: chain ID 16602, RPC `https://evmrpc-testnet.0g.ai`
- **Must use `evm_version = "cancun"`** or get invalid opcode errors
- Solidity 0.8.19 recommended
- Explorer: `https://chainscan-galileo.0g.ai`
- Faucet: `https://faucet.0g.ai` (0.1 OG/day)

### Uniswap V2 on 0G

Must recompute `INIT_CODE_HASH` after factory deployment — the hardcoded Ethereum hash `0x96e8ac42...` won't work. Deploy order: WETH9 → Factory → compute hash → update Library → Router.

### Existing Patterns

OathKeeper project uses: Foundry contracts + Next.js 14 dashboard + TypeScript services. Reuse this stack shape. Foundry config pattern from `oathkeeper/contracts/foundry.toml`.

## Key Technical Decisions

- **Foundry over Hardhat**: Existing pattern from OathKeeper, faster compilation, better testing. 0G docs support both.
- **Simplified INFT over full ERC-7857**: Full spec requires oracle/verifier + transfer proofs with TEE attestation — 3+ days of work for marginal hackathon value. Instead: ERC-721 base + `dataHashes[]`/`dataDescriptions[]` + `intelligentDataOf()` view. Judges see ERC-7857 compliance on the interface level without the transfer proof overhead.
- **GPT-OSS-20B over Qwen-2.5-7B**: Slightly larger model, better reasoning for trading signals. Both are cheap on testnet. If GPT-OSS-20B is unreliable, fall back to Gemma-3-27B.
- **Scripted MEV bot over real MEV simulation**: The "exposed" agent's MEV extraction is a scripted bot that front-runs with deterministic timing. Real MEV simulation is impossible on a testnet with no other participants. The script makes the demo reliable.
- **Next.js dashboard**: Matches OathKeeper pattern. SSR not needed — client-side with ethers.js/viem for on-chain reads.
- **MemData over ZgFile for Storage**: Attestation JSON is small (<1KB). No need for file system — upload directly from memory.

## Open Questions

### Resolved During Planning

- **Which Uniswap V2 fork?** Use official `uniswap/v2-core` + `uniswap/v2-periphery` with INIT_CODE_HASH fix. Simplest, most documented.
- **MEV simulation approach?** Scripted bot. Runs same strategy as sealed agent but submits trades to mempool visibly. A second script front-runs it with sandwich trades. Deterministic, demo-reliable.
- **TEE attestation storage schema?** JSON object: `{ tradeId, model, inputHash, outputHash, timestamp, teeSignerAddress, chatId, isValid }`. Upload as MemData to 0G Storage. Store rootHash on-chain in attestation registry.

### Deferred to Implementation

- Exact prompt engineering for trading signal generation — test with real 0G Compute responses
- 0G faucet rate limits — may need multiple wallets funded early
- Whether `processResponse()` returns enough attestation data or if `verifyService()` is needed for richer proofs

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification.*

```
┌─────────────────────────────────────────────────────┐
│                   0G Chain (Galileo)                  │
│                                                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ MockWETH │  │ MockUSDC  │  │ WETH9            │  │
│  │ (ERC-20) │  │ (ERC-20)  │  │ (for Router)     │  │
│  └──────────┘  └───────────┘  └──────────────────┘  │
│                                                       │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ UniswapV2Factory │  │ UniswapV2Router02        │  │
│  │ + Pair (auto)    │  │ (swapExact..., addLiq..) │  │
│  └──────────────────┘  └──────────────────────────┘  │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ OrichalcosVault.sol                           │    │
│  │  - deposit(token, amount)                     │    │
│  │  - executeTrade(path, amountIn, amountOutMin) │    │
│  │  - registerAttestation(tradeId, rootHash)     │    │
│  │  - getTradeHistory() → Trade[]                │    │
│  │  - onlyAgent modifier (agent wallet only)     │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ OrichalcosINFT.sol (simplified ERC-7857)      │    │
│  │  - mint(dataHashes[], dataDescriptions[])     │    │
│  │  - updateData(tokenId, dataHashes[])          │    │
│  │  - intelligentDataOf(tokenId)                 │    │
│  │  - ERC-721 base (ownerOf, transfer)           │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Agent Service (Node.js/TS)               │
│                                                       │
│  ┌─────────────┐  ┌────────────────────────────┐    │
│  │ Market       │  │ Strategy Engine             │    │
│  │ Monitor      │  │  - Reads pool state         │    │
│  │ (poll loop)  │──│  - Calls 0G Compute (TEE)   │    │
│  │              │  │  - Parses trade decision     │    │
│  └─────────────┘  │  - Executes via Vault        │    │
│                    │  - Stores attestation (0G    │    │
│                    │    Storage + on-chain)        │    │
│                    └────────────────────────────┘    │
│                                                       │
│  ┌─────────────┐  ┌────────────────────────────┐    │
│  │ MEV Sim Bot │  │ Exposed Agent (no TEE)      │    │
│  │ (scripts    │  │  - Same strategy, open       │    │
│  │  sandwich   │  │  - Bot front-runs its trades │    │
│  │  trades)    │  │  - PnL tracked separately    │    │
│  └─────────────┘  └────────────────────────────┘    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Dashboard (Next.js)                      │
│                                                       │
│  - Vault balance + PnL chart                          │
│  - Trade history table                                │
│  - Side-by-side: Sealed vs Exposed PnL                │
│  - Attestation viewer (click trade → TEE proof)       │
│  - INFT display (agent identity + data hashes)        │
│  - Links to 0G Explorer + 0G Storage                  │
└─────────────────────────────────────────────────────┘
```

## Implementation Units

### Phase 1: On-Chain Foundation (Days 1-2)

- [ ] **Unit 1: Mock Tokens + Uniswap V2 Deployment**

**Goal:** Deploy the trading infrastructure on 0G Galileo testnet.

**Requirements:** R2, R3

**Dependencies:** None

**Files:**
- Create: `contracts/src/tokens/MockWETH.sol`
- Create: `contracts/src/tokens/MockUSDC.sol`
- Create: `contracts/src/dex/` (Uniswap V2 core + periphery, vendored)
- Create: `contracts/script/DeployDex.s.sol`
- Create: `contracts/test/DexSetup.t.sol`

**Approach:**
- Deploy MockWETH (ERC-20 with mint) + MockUSDC (ERC-20 with mint, 6 decimals)
- Vendor Uniswap V2 core (Factory + Pair) and periphery (Router02 + Library)
- After factory deploy, compute INIT_CODE_HASH: `cast call <FACTORY> "pairCodeHash()(bytes32)"` and update UniswapV2Library
- Deploy Router02 with factory + WETH9 addresses
- Create WETH/USDC pair, seed with initial liquidity (e.g., 100 WETH + 300,000 USDC)
- Record all addresses in a `deployments.json`

**Patterns to follow:**
- OathKeeper Foundry config (`foundry.toml`): optimizer=true, runs=200
- Add `evm_version = "cancun"` and `solc_version = "0.8.19"`

**Test scenarios:**
- Happy path: Factory creates pair, router adds liquidity, swap WETH→USDC returns expected amount
- Edge case: Swap with zero amount reverts
- Integration: Full flow — mint tokens → approve → addLiquidity → swap → check balances

**Verification:**
- Pair contract exists with non-zero reserves
- Router swap executes successfully
- All contracts verified on `chainscan-galileo.0g.ai`

---

- [ ] **Unit 2: OrichalcosVault Contract**

**Goal:** Deploy the vault that holds user funds and executes agent trades.

**Requirements:** R1, R7, R11

**Dependencies:** Unit 1 (needs DEX addresses)

**Files:**
- Create: `contracts/src/OrichalcosVault.sol`
- Create: `contracts/script/DeployVault.s.sol`
- Create: `contracts/test/OrichalcosVault.t.sol`

**Approach:**
- Vault holds WETH and USDC balances per depositor
- `deposit(token, amount)` — transfers ERC-20 into vault
- `withdraw(token, amount)` — owner withdraws
- `executeTrade(path, amountIn, amountOutMin)` — calls Router.swapExactTokensForTokens. Guarded by `onlyAgent` modifier (only the agent wallet can call)
- `registerAttestation(bytes32 tradeId, bytes32 storageRootHash)` — maps trade to 0G Storage attestation. Also `onlyAgent`.
- `getTradeCount()`, `getTrade(index)` — read trade history
- Store trades as struct array: `{ tradeId, timestamp, tokenIn, tokenOut, amountIn, amountOut, attestationRoot }`
- Constructor takes: router address, agent address, vault owner

**Patterns to follow:**
- OathKeeper `SLAEnforcement.sol`: `require()` with string messages, simple access control via address checks
- `vm.prank(agent)` pattern for testing agent-only functions

**Test scenarios:**
- Happy path: deposit USDC → agent executes swap → vault holds WETH → trade recorded with attestation root
- Happy path: owner withdraws after trades
- Error path: non-agent wallet calls executeTrade → reverts
- Error path: non-owner calls withdraw → reverts
- Edge case: executeTrade with insufficient vault balance → reverts
- Integration: deposit → trade → registerAttestation → getTrade returns correct data

**Verification:**
- Vault accepts deposits and only agent can trade
- Trade history is queryable with attestation roots
- Contract verified on explorer

---

- [ ] **Unit 3: Simplified INFT Contract**

**Goal:** Mint the trading agent as an ERC-7857-inspired INFT.

**Requirements:** R12, R13, R14

**Dependencies:** None (can parallel with Unit 2)

**Files:**
- Create: `contracts/src/OrichalcosINFT.sol`
- Create: `contracts/script/DeployINFT.s.sol`
- Create: `contracts/test/OrichalcosINFT.t.sol`

**Approach:**
- Extends ERC-721 (OpenZeppelin)
- Adds `dataHashes` (bytes32[]) and `dataDescriptions` (string[]) per token
- `mint(address to, bytes32[] dataHashes, string[] dataDescriptions)` → returns tokenId
- `updateData(uint256 tokenId, bytes32[] newDataHashes)` — owner only, for updating performance data
- `intelligentDataOf(uint256 tokenId)` → returns `IntelligentData[]` struct array (matches ERC-7857 metadata interface)
- `dataHashesOf(tokenId)` and `dataDescriptionsOf(tokenId)` — individual getters
- Skip: transfer proofs, oracle/verifier, sealed keys, clone. These are the complex parts of ERC-7857 that don't add hackathon demo value.
- Mint one INFT representing the Orichalcos agent with initial data: `["strategy_config", "performance_log"]` pointing to 0G Storage roots

**Patterns to follow:**
- OpenZeppelin ERC-721 base
- 0G reference `AgentNFT` struct: `TokenData { owner, dataDescriptions[], dataHashes[], authorizedUsers[] }`

**Test scenarios:**
- Happy path: mint INFT → intelligentDataOf returns correct hashes and descriptions
- Happy path: updateData with new hashes → intelligentDataOf reflects update
- Error path: non-owner calls updateData → reverts
- Edge case: mint with empty arrays → still valid (no data yet)

**Verification:**
- INFT minted and viewable on 0G explorer
- `intelligentDataOf` returns data matching 0G Storage uploads

---

### Phase 2: Agent Service (Days 3-5)

- [ ] **Unit 4: 0G Compute Integration**

**Goal:** Connect to 0G TEE inference and get trading signals.

**Requirements:** R6, R9

**Dependencies:** None (can start before contracts deploy)

**Files:**
- Create: `agent/src/compute.ts`
- Create: `agent/src/types.ts`
- Create: `agent/package.json`
- Create: `agent/tsconfig.json`
- Create: `agent/.env.example`
- Create: `agent/test/compute.test.ts`

**Approach:**
- Initialize broker: `createZGComputeNetworkBroker(wallet)`
- One-time setup function: `setupComputeProvider()` — addLedger(3), transferFund(1 OG), acknowledgeProviderSigner
- `getTradeSignal(marketContext: MarketContext)` function:
  - Build prompt with pool reserves, current prices, position state, trade history
  - Get single-use headers via `broker.inference.getRequestHeaders()`
  - Call via OpenAI SDK to provider endpoint
  - Parse response into structured TradeDecision: `{ action: "buy"|"sell"|"hold", token, amount, reasoning }`
  - Verify via `broker.inference.processResponse()` → captures chatId + isValid
  - Return `{ decision, attestation: { chatId, model, isValid, timestamp, inputHash, outputHash } }`
- `inputHash` = keccak256 of the prompt string
- `outputHash` = keccak256 of the raw response content
- Start with GPT-OSS-20B provider on testnet. Fallback to Gemma-3-27B.

**Test scenarios:**
- Happy path: getTradeSignal with valid market context → returns structured TradeDecision with attestation
- Error path: provider unreachable → throws with descriptive error
- Edge case: model returns unparseable response → defaults to "hold" action
- Happy path: processResponse returns true for valid TEE-signed response

**Verification:**
- Can call 0G Compute and receive valid inference responses
- Attestation data (chatId, isValid) is captured per request

---

- [ ] **Unit 5: 0G Storage Integration**

**Goal:** Store attestation proofs on 0G decentralized storage.

**Requirements:** R10

**Dependencies:** Unit 4 (needs attestation data shape)

**Files:**
- Create: `agent/src/storage.ts`
- Create: `agent/test/storage.test.ts`

**Approach:**
- `storeAttestation(attestation: AttestationData)` function:
  - Serialize attestation to JSON
  - Create MemData from JSON bytes
  - Compute merkleTree → get rootHash (bytes32) BEFORE upload
  - Upload via indexer to turbo endpoint
  - Return rootHash for on-chain registration
- `retrieveAttestation(rootHash: string)` function:
  - Download from indexer to temp path
  - Parse JSON and return
- Use turbo indexer: `https://indexer-storage-testnet-turbo.0g.ai`
- Attestation JSON schema: `{ tradeId, model, inputHash, outputHash, timestamp, teeSignerAddress, chatId, isValid, marketContext: { reserves, prices } }`

**Test scenarios:**
- Happy path: store attestation → returns valid bytes32 rootHash → retrieve by rootHash returns identical data
- Error path: upload with invalid signer → throws
- Edge case: large attestation (include full market context) → still uploads within timeout

**Verification:**
- Round-trip: store → retrieve returns identical attestation JSON
- rootHash format matches `0x` + 64 hex chars

---

- [ ] **Unit 6: Autonomous Trading Loop**

**Goal:** Wire everything into an autonomous agent that monitors, reasons, trades, and attests.

**Requirements:** R5, R7, R8

**Dependencies:** Units 1, 2, 4, 5

**Files:**
- Create: `agent/src/agent.ts` (main loop)
- Create: `agent/src/market.ts` (pool state reader)
- Create: `agent/src/executor.ts` (on-chain trade execution)
- Create: `agent/src/config.ts` (parameters)
- Create: `agent/src/index.ts` (entry point)

**Approach:**
- `MarketMonitor`: polls Uniswap pair reserves every N seconds via ethers.js
- `TradeExecutor`: calls `vault.executeTrade()` + `vault.registerAttestation()` via ethers.js
- Main loop (`runAgent()`):
  1. Read market state (reserves, price, current vault positions)
  2. Call `getTradeSignal(marketContext)` → decision + attestation
  3. If action != "hold": execute trade via vault contract
  4. Store attestation on 0G Storage → get rootHash
  5. Register attestation on-chain: `vault.registerAttestation(tradeId, rootHash)`
  6. Log to console + emit event for dashboard
  7. Sleep for configurable interval (default 30s for demo, longer for sustained run)
- Config: `{ pair, maxPositionSize, rebalanceInterval, agentPrivateKey, providerAddress }`
- Graceful shutdown on SIGINT

**Test scenarios:**
- Happy path: agent starts → reads market → gets signal → executes trade → stores attestation → registers on-chain. Full cycle completes.
- Edge case: signal is "hold" → no trade executed, no attestation stored
- Error path: 0G Compute call fails → agent logs error, skips cycle, retries next interval
- Error path: on-chain tx fails (insufficient gas) → agent logs, continues
- Integration: run for 3 cycles → vault has 3 trades with 3 attestation roots on-chain

**Verification:**
- Agent runs continuously for 5+ minutes without crashing
- Trade history on-chain matches agent logs
- Attestation roots on-chain point to valid 0G Storage entries

---

- [ ] **Unit 7: INFT Minting + Data Updates**

**Goal:** Mint the agent as INFT and update its data hashes as it trades.

**Requirements:** R12, R13

**Dependencies:** Units 3, 5, 6

**Files:**
- Modify: `agent/src/agent.ts` (add INFT update after trades)
- Create: `agent/src/inft.ts` (INFT interaction)

**Approach:**
- On first run: mint INFT with initial data hashes (strategy config stored on 0G Storage)
- After every N trades (e.g., every 5): update INFT data hashes with latest performance summary uploaded to 0G Storage
- Performance summary: `{ totalTrades, winRate, pnl, lastUpdated, attestationRoots[] }`
- Store tokenId in agent config for subsequent updates

**Test scenarios:**
- Happy path: agent mints INFT on startup → tokenId stored → intelligentDataOf returns strategy config hash
- Happy path: after 5 trades → INFT data updated with performance hash
- Error path: INFT update tx fails → agent logs warning, continues trading (non-blocking)

**Verification:**
- INFT visible on 0G explorer with correct owner
- `intelligentDataOf` returns hashes that resolve to valid 0G Storage entries

---

### Phase 3: MEV Demo Simulation (Day 6)

- [ ] **Unit 8: Side-by-Side MEV Simulation**

**Goal:** Create the exposed agent + MEV bot for the side-by-side demo.

**Requirements:** R16

**Dependencies:** Unit 6

**Files:**
- Create: `agent/src/simulation/exposed-agent.ts`
- Create: `agent/src/simulation/mev-bot.ts`
- Create: `agent/src/simulation/runner.ts`

**Approach:**
- `ExposedAgent`: identical trading logic to the sealed agent BUT:
  - Uses a regular HTTP API call instead of 0G Compute TEE (or calls 0G Compute but "leaks" the prompt/response to a public log)
  - Trades through a separate "exposed vault" contract (same code, different instance)
  - Strategy decisions are visible in the public log
- `MevBot`:
  - Monitors the exposed agent's "leaked" strategy decisions
  - When exposed agent is about to buy: bot buys first (front-run), then sells after (sandwich)
  - Deterministic timing: bot acts within same block window as exposed agent
  - Tracks its own profit from sandwiching
- `SimulationRunner`:
  - Starts both agents + MEV bot simultaneously
  - Feeds same market data to both
  - Tracks PnL for: sealed agent, exposed agent, MEV bot
  - Exposes PnL data via simple HTTP endpoint (for dashboard polling)
- The sealed agent's decisions are invisible to the MEV bot (TEE inference) — bot has nothing to front-run

**Test scenarios:**
- Happy path: run simulation → exposed agent PnL < sealed agent PnL due to MEV extraction
- Happy path: MEV bot profits are roughly equal to exposed agent's PnL loss
- Edge case: both agents get "hold" signal → no MEV opportunity, PnLs stay equal

**Verification:**
- After 10+ trade cycles, sealed agent PnL is measurably higher than exposed agent
- MEV bot accumulates profit only from exposed agent trades

---

### Phase 4: Dashboard (Days 7-8)

- [ ] **Unit 9: Dashboard Foundation**

**Goal:** Build the web dashboard showing vault state and trade history.

**Requirements:** R15, R17

**Dependencies:** Units 2, 6 (needs deployed contracts + running agent)

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/src/app/layout.tsx`
- Create: `dashboard/src/app/page.tsx`
- Create: `dashboard/src/app/globals.css`
- Create: `dashboard/src/lib/contracts.ts` (ABIs + addresses)
- Create: `dashboard/src/hooks/useVault.ts`
- Create: `dashboard/src/hooks/useTradeHistory.ts`
- Create: `dashboard/src/components/VaultCard.tsx`
- Create: `dashboard/src/components/TradeTable.tsx`
- Create: `dashboard/src/components/PnLChart.tsx`

**Approach:**
- Next.js 14 with App Router (matches OathKeeper pattern)
- Client-side reads via ethers.js v6 to 0G testnet RPC
- `useVault` hook: reads vault balances (WETH + USDC), total deposits, current NAV
- `useTradeHistory` hook: reads trade array from vault contract, polls every 5s
- `PnLChart`: line chart of vault value over time (computed from trade history). Use recharts (already in OathKeeper deps).
- `TradeTable`: each row shows timestamp, pair, direction, amounts, attestation status (link to detail)
- `VaultCard`: deposit amount, current value, PnL %, trade count

**Patterns to follow:**
- OathKeeper dashboard: `hooks/usePonderData.ts` polling pattern, ethers.js contract reads
- Dark theme, clean cards layout

**Test scenarios:**
- Happy path: dashboard loads → shows vault balance, trade history populates as agent runs
- Edge case: no trades yet → shows empty state with "Agent starting..." message
- Happy path: click trade row → navigates to attestation detail

**Verification:**
- Dashboard renders without errors
- Data matches on-chain state (verify against explorer)

---

- [ ] **Unit 10: Attestation Viewer + Side-by-Side**

**Goal:** Add attestation detail view and the side-by-side PnL comparison.

**Requirements:** R16, R17

**Dependencies:** Units 8, 9

**Files:**
- Create: `dashboard/src/app/attestation/[id]/page.tsx`
- Create: `dashboard/src/components/AttestationDetail.tsx`
- Create: `dashboard/src/components/SideBySide.tsx`
- Create: `dashboard/src/hooks/useSimulation.ts`
- Modify: `dashboard/src/app/page.tsx` (add side-by-side section)

**Approach:**
- `AttestationDetail`: given a trade ID, fetch attestation rootHash from contract, download JSON from 0G Storage via indexer, display: model, input hash, output hash, timestamp, TEE verification status, links to 0G explorer tx + 0G Storage
- `SideBySide`: two-column layout showing sealed vs exposed agent PnL. Line chart with two series. Polls simulation runner's HTTP endpoint for real-time data. Highlights MEV extraction events on the exposed agent's chart.
- `useSimulation` hook: fetches PnL data from simulation runner (localhost:3001/api/simulation)

**Test scenarios:**
- Happy path: click trade → attestation page shows all TEE proof fields with working explorer links
- Happy path: side-by-side chart shows diverging PnL lines
- Edge case: attestation download from 0G Storage fails → shows "Fetching..." with retry

**Verification:**
- Attestation detail page shows real data from 0G Storage
- Side-by-side clearly shows PnL gap between sealed and exposed agents

---

### Phase 5: Polish + Submission (Days 9-10)

- [ ] **Unit 11: INFT Display + Agent Identity Page**

**Goal:** Show the agent's INFT on the dashboard.

**Requirements:** R12, R14

**Dependencies:** Units 7, 9

**Files:**
- Create: `dashboard/src/app/agent/page.tsx`
- Create: `dashboard/src/components/INFTCard.tsx`
- Create: `dashboard/src/hooks/useINFT.ts`

**Approach:**
- Display INFT metadata: token ID, owner, data descriptions, data hashes (linked to 0G Storage)
- Show agent "identity card": name, strategy type, creation date, total trades, cumulative PnL
- Link to 0G explorer for the INFT contract + token

**Test expectation: none** — pure display component, verified visually.

**Verification:**
- INFT data matches on-chain state
- All explorer links work

---

- [ ] **Unit 12: README + Documentation + Demo Video**

**Goal:** Complete submission materials.

**Requirements:** R18, R19

**Dependencies:** All previous units

**Files:**
- Create: `README.md`
- Create: `docs/architecture.md` (optional, can inline in README)

**Approach:**
- README sections: Overview, Architecture diagram (ASCII), Tech Stack, 0G Components Used (Chain, Compute/TEE, Storage, INFT — with explanations), Setup Instructions, Contract Addresses + Explorer Links, Demo Guide, Screenshots
- Demo video (2-3 min): deposit → agent trades live → show attestation on 0G Storage → side-by-side PnL divergence → INFT on explorer
- Record via OBS or Loom

**Test expectation: none** — documentation artifact.

**Verification:**
- README has all required elements
- All explorer links and contract addresses are correct and live
- Demo video shows complete flow

## System-Wide Impact

- **Interaction graph:** Agent service → 0G Compute (TEE) → OrichalcosVault (on-chain) → 0G Storage. Dashboard reads from Vault contract + 0G Storage. Simulation runner coordinates exposed agent + MEV bot.
- **Error propagation:** Agent is fault-tolerant — 0G Compute failures skip the cycle. Storage failures log but don't block trading. Dashboard shows stale data gracefully.
- **State lifecycle risks:** Agent must not double-trade if a tx is pending. Use nonce management or tx receipt confirmation before next cycle.
- **Unchanged invariants:** Uniswap V2 contracts are unmodified except INIT_CODE_HASH. No custom AMM logic.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 0G Compute testnet unreliable / models down | Fall back to Gemma-3-27B, or mock the inference response for demo |
| 0G faucet rate limit (0.1 OG/day) insufficient | Fund wallets early, use multiple wallets, request team funding from 0G Discord |
| INIT_CODE_HASH mismatch silently breaks pair addresses | Compute hash immediately after factory deploy, verify pair address resolves |
| 0G Storage upload fails during demo | Cache last successful attestation, show cached data with "pending upload" status |
| Side-by-side PnL doesn't diverge enough | Increase MEV bot aggressiveness (larger sandwich amounts), run more trade cycles |
| ERC-7857 interface mismatch with judges' expectations | Clearly label as "ERC-7857 inspired" in README, link to the EIP |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-13-orichalcos-requirements.md](docs/brainstorms/2026-04-13-orichalcos-requirements.md)
- **0G Compute Starter Kit:** https://github.com/0gfoundation/0g-compute-ts-starter-kit
- **0G Storage SDK docs:** https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
- **0G Agent NFT (ERC-7857):** https://github.com/0gfoundation/0g-agent-nft (branch: eip-7857-draft)
- **ERC-7857 EIP:** https://eips.ethereum.org/EIPS/eip-7857
- **0G Chain deploy docs:** https://docs.0g.ai/developer-hub/building-on-0g/contracts-on-0g/deploy-contracts
- **Uniswap V2 Core:** https://github.com/Uniswap/v2-core
- **OathKeeper (pattern reference):** /Users/ammar.robb/Documents/Web3/hackathons/oathkeeper/
