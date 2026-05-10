# Orichalcos — System Architecture

> Defines services, data flow, deployment topology, and how components communicate. Reference this when wiring contracts, agent runner, frontend, and 0G SDK calls.

---

## 1. Deployment Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                            USER (Browser)                             │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       VERCEL (Frontend)                              │
│                       orichalcos.xyz                                 │
│                       Next.js 14 App Router                          │
│                       Wagmi + Viem for wallet                        │
└────┬─────────────────────┬──────────────────────────────────┬───────┘
     │                     │                                  │
     │ wagmi RPC           │ Direct fetch                     │ wagmi events
     ▼                     ▼                                  │
┌──────────┐    ┌─────────────────────────┐                  │
│ 0G Chain │    │   AGENT RUNNER (Contabo VPS)              │
│ Galileo  │    │   Node.js + 0G SDK                        │
│ /Aristot │    │   /home/claude/orichalcos/agent-runner    │
└──┬───────┘    └─────┬─────────────────┬──┬─────────────────┘
   │                  │                 │  │
   │ on-chain         │ inference       │  │ pyth update
   │ events           │ calls           │  │
   │                  ▼                 │  ▼
   │         ┌────────────────┐         │ ┌──────────┐
   │         │ 0G Compute TEE │         │ │ Pyth     │
   │         │ Qwen 2.5 7B    │         │ │ Hermes   │
   │         │ Intel TDX/H100 │         │ │ API      │
   │         └────────────────┘         │ └──────────┘
   │                                    │
   │                                    ▼
   │                            ┌────────────────┐
   │                            │  0G Storage    │
   │                            │  Encrypted     │
   │                            │  blobs + tells │
   │                            └────────────────┘
   │
   └──> on-chain events propagate back to frontend via Wagmi watchEvent
```

---

## 2. Service Boundaries

### Service A — Frontend (Vercel)

**Lives at:** `orichalcos.xyz`

**Responsibilities:**
- Render all UI per DESIGN_SYSTEM.md and USER_FLOW.md
- Wallet connection, transaction signing
- Read on-chain state via wagmi (RPC: 0G Galileo or Aristotle)
- Subscribe to contract events for live updates
- Display TEE attestations, 0G Storage hashes, Pyth proofs
- Direct fetch from 0G Storage for public tells (read-only)

**Does NOT:**
- Generate sealed souls (Agent Runner does this)
- Run TEE inference (Agent Runner does this)
- Hold any private keys
- Hold any encryption keys

### Service B — Agent Runner (Contabo VPS)

**Lives at:** Contabo VPS, exposes nothing publicly (private worker, no inbound)

**Responsibilities:**
- Continuously run NPC Champion duels (training data + Codex content)
- Listen for `DuelChallenged` events on-chain
- Fetch sealed souls from 0G Storage
- Decrypt symmetric keys (held in env vars or local secret storage)
- Call 0G Compute TEE for inference, get TEE-signed responses
- Upload public tells to 0G Storage, get content-addressed CIDs
- Submit `commitDirection` transactions on-chain
- Wait for settle window
- Submit `settle` transactions with Pyth update data

**Does NOT:**
- Serve frontend HTTP requests
- Hold user funds (only holds the operator's gas key)
- Have permission to modify Apprentice stats directly (only via Codex contract)

### Service C — 0G Chain (Smart contracts)

**Lives at:** Galileo testnet (Phase 1) → Aristotle mainnet (Phase 2, Day 7)

**Contracts:**
1. `ApprenticeINFT` — ERC-7857 Apprentice tokens
2. `ScryingDuel` — Challenge / commit / settle state machine
3. `Codex` — ELO + Title progression, source of truth for stats
4. `ApprenticeMarket` — Listings, purchases (MVP B only)
5. `MockPyth` — Testnet only; real Pyth on mainnet

**Responsibilities:**
- Authoritative state for all on-chain data
- Emit events for frontend + agent runner consumption
- Verify TEE attestations (off-chain proof, on-chain hash commit)
- Settle duels via Pyth oracle reading

### Service D — 0G Compute (TEE)

**Lives at:** 0G's hosted Sealed Inference service

**Responsibilities:**
- Run Qwen 2.5 7B inside Intel TDX + H100 enclave
- Decrypt sealed souls inside the enclave (TEE-only key access)
- Generate signed responses (direction call + public tell)
- Return TEE attestation + signed payload

**Accessed via:**
- `@0gfoundation/0g-compute-ts-sdk` package
- Broker pattern with sub-account funding (3 OG locked minimum)

### Service E — 0G Storage

**Lives at:** 0G's hosted storage service

**Responsibilities:**
- Store encrypted soul blobs (one per Apprentice)
- Store public tells (decrypted reasoning, content-addressed)
- Provide merkle roots for on-chain commitment
- Public read access; write access requires signed payment

**Accessed via:**
- `@0gfoundation/0g-storage-ts-sdk` package (or REST API)

### Service F — Pyth Network (Oracle)

**Lives at:** Pyth's Hermes API + on-chain Pyth contract

**Responsibilities:**
- Provide price feeds (BTC/USD, ETH/USD, SOL/USD)
- Return signed VAA (Verifiable Action Approval) for on-chain settlement
- Hermes API serves price update data; on-chain contract validates VAAs

**Accessed via:**
- `@pythnetwork/hermes-client` (TypeScript) for fetching update data
- `@pythnetwork/pyth-sdk-solidity` for on-chain consumption
- Mainnet contract: `0x2880aB155794e7179c9eE2e38200202908C17B43`
- Testnet: NOT deployed → use MockPyth.sol with same IPyth interface

---

## 3. End-to-End Duel Sequence (Critical Path)

This is the canonical flow. Every other interaction is a simpler variant.

```
ACTOR              ACTION                                    SERVICE
──────────────────────────────────────────────────────────────────────────────
Trainer        →   Click "Challenge Champion"                Frontend
Frontend       →   Build challenge tx                        Frontend
Frontend       →   Submit challenge() transaction             0G Chain
0G Chain       →   Emit DuelChallenged event                  0G Chain
                   { duelId, challenger, defender,
                     priceFeedId, settleWindow, stake }
                                                               
Agent Runner   →   Listen via wagmi watchEvent (or polling)   Agent Runner
Agent Runner   →   For each Apprentice in duel:               Agent Runner
                   - Fetch sealed soul blob hash from
                     ApprenticeINFT.sealedSoulRoot
                   - Resolve hash → 0G Storage CID            0G Storage
                   - Download encrypted blob                   0G Storage
                   - Load symmetric key from local secrets    Agent Runner (local)
                   - Build prompt with priceContext + nonce
                   - POST to 0G Compute /chat/completions     0G Compute
                                                               (with Authorization)
0G Compute     →   Decrypt soul inside TEE                    0G Compute (TDX)
0G Compute     →   Run Qwen 2.5 inference                     0G Compute
0G Compute     →   Return: { direction, publicTell,           
                              attestationSignature, chatID }   Agent Runner
                                                               
Agent Runner   →   broker.inference.processResponse(chatID)   Agent Runner
                   verifies the TEE signature
                                                               
Agent Runner   →   Upload publicTell to 0G Storage            0G Storage
0G Storage     →   Return CID (merkle root)                   Agent Runner
                                                               
Agent Runner   →   commitDirection(duelId, direction,         0G Chain
                                   publicTellCID,
                                   attestationSig)
                   (called twice — once per Apprentice)
0G Chain       →   Emit DirectionCommitted event              0G Chain
0G Chain       →   When both commits land: emit               0G Chain
                   ReadyForSettlement event
                                                               
Agent Runner   →   Wait for settleTimestamp to elapse         Agent Runner
Agent Runner   →   Fetch Pyth price update data               Pyth Hermes
Agent Runner   →   settle(duelId, pythUpdateData)             0G Chain
0G Chain       →   Decode Pyth update, get current price      0G Chain
                   (calls Pyth contract.updatePriceFeeds)
0G Chain       →   Compute price delta, determine winner      0G Chain
0G Chain       →   Codex.recordOutcome(duelId, winner, loser) 0G Chain
0G Chain       →   ApprenticeINFT.setStats() for both         0G Chain
                   (calls update ELO, wins, losses)
0G Chain       →   Emit DuelSettled event                     0G Chain
                                                               
Frontend       →   Receives DuelSettled via watchEvent        Frontend
Frontend       →   Fetch publicTells from 0G Storage          0G Storage
Frontend       →   Trigger Mind Reveal animation              Frontend
Frontend       →   Update Apprentice card state               Frontend
                   (new ELO, new Title if changed)
```

**Critical timing:**
- Total elapsed time from challenge to settle: **120-240 seconds** depending on settle window
- TEE inference latency: **5-15 seconds per call**
- Pyth update + settle: **10-20 seconds**
- Frontend animation: **5 seconds (Mind Reveal)**

---

## 4. Contract Interaction Map

### ApprenticeINFT.sol

```solidity
interface IApprenticeINFT {
  // Read functions (called by Frontend, Agent Runner, Codex)
  function ownerOf(uint256 tokenId) external view returns (address);
  function getApprentice(uint256 tokenId) external view returns (ApprenticeData memory);
  function tokenURI(uint256 tokenId) external view returns (string memory);
  
  // Write functions (called by Trainers via Frontend)
  function mint(
    Type apprenticeType,
    string calldata name,
    bytes32 sealedSoulRoot,
    bytes32 metadataHash
  ) external returns (uint256 tokenId);
  
  // Restricted writes (called by Codex contract only)
  function setStats(
    uint256 tokenId,
    uint16 newElo,
    uint32 newWins,
    uint32 newLosses,
    Title newTitle
  ) external; // onlyCodex modifier
  
  // ERC-7857 spec compliance
  event Updated(uint256 indexed tokenId, bytes32 oldHash, bytes32 newHash, address updatedBy);
}
```

### ScryingDuel.sol

```solidity
interface IScryingDuel {
  // Called by Trainers
  function challenge(
    uint256 challengerTokenId,
    uint256 defenderTokenId,
    bytes32 priceFeedId,
    uint256 settleWindow
  ) external payable returns (uint256 duelId);
  
  // Called by Agent Runner (twice per duel)
  function commitDirection(
    uint256 duelId,
    Direction direction,
    bytes32 publicTellCID,
    bytes calldata teeAttestation
  ) external;
  
  // Called by Agent Runner once both commits are in
  function settle(
    uint256 duelId,
    bytes[] calldata pythUpdateData
  ) external payable;
  
  // Read
  function getDuel(uint256 duelId) external view returns (Duel memory);
  
  // Events
  event DuelChallenged(uint256 indexed duelId, uint256 challenger, uint256 defender, bytes32 priceFeedId, uint256 settleTimestamp);
  event DirectionCommitted(uint256 indexed duelId, uint256 indexed tokenId, Direction direction, bytes32 tellCID);
  event ReadyForSettlement(uint256 indexed duelId);
  event DuelSettled(uint256 indexed duelId, uint256 winner, uint256 loser, int64 priceDelta);
}
```

### Codex.sol

```solidity
interface ICodex {
  // Called by ScryingDuel only
  function recordOutcome(
    uint256 duelId,
    uint256 winnerTokenId,
    uint256 loserTokenId
  ) external; // onlyDuelContract
  
  // Read functions
  function getApprenticeHistory(uint256 tokenId, uint256 limit, uint256 offset) external view returns (DuelOutcome[] memory);
  function getEloHistory(uint256 tokenId) external view returns (uint16[] memory);
  function getRecentDuels(uint256 limit) external view returns (DuelOutcome[] memory);
  
  // Internal logic
  function _calculateNewElo(uint16 ratingA, uint16 ratingB, bool aWon) internal pure returns (uint16, uint16);
  function _checkTitleProgression(uint256 tokenId, uint32 newWins, uint16 newElo) internal returns (Title);
}
```

---

## 5. Data Schema

### On-chain (per ApprenticeData struct)

```solidity
struct ApprenticeData {
    Type apprenticeType;       // enum: Bold, Patient, Sharp, Stoic
    Title currentTitle;        // enum: Initiate, Apprentice, Adept, Master, Sage
    uint16 elo;                // Default 1200 on mint
    uint32 wins;
    uint32 losses;
    bytes32 sealedSoulRoot;    // 0G Storage merkle root for encrypted soul
    bytes32 metadataHash;      // ERC-7857 metadata commitment
    string name;               // Apprentice display name
    address mintedBy;
    uint256 mintedAt;
}

enum Type { Bold, Patient, Sharp, Stoic }
enum Title { Initiate, Apprentice, Adept, Master, Sage }
enum Direction { LONG, SHORT, NONE }
```

### 0G Storage (encrypted soul blob)

Encrypted with AES-256-GCM. Plaintext format:

```json
{
  "version": 1,
  "tokenId": "12345",
  "type": "Bold",
  "personality": {
    "trader_voice": "I'm a Bold-type Apprentice. Aggressive momentum, high conviction, short holding periods. I love volatility. I hate ranges.",
    "decision_style": "...",
    "communication_style": "..."
  },
  "system_prompt_template": "You are {name}, a {type}-type Apprentice in the Orichalcos arena. ...",
  "generation_metadata": {
    "generated_at": "2026-05-09T14:32:00Z",
    "model": "qwen-2.5-7b-instruct",
    "tee_attestation": "0x...",
    "agent_runner_version": "1.0"
  }
}
```

### 0G Storage (public tell — decrypted, content-addressed)

Plain text, content-addressed. Format:

```json
{
  "version": 1,
  "duelId": "67890",
  "tokenId": "12345",
  "asset": "BTC/USD",
  "priceContext": {
    "currentPrice": 95234.50,
    "timestamp": 1715266320,
    "windowSeconds": 60
  },
  "decision": {
    "direction": "LONG",
    "confidence": 0.72,
    "publicTell": "I'm seeing momentum building above 95k. Volatility increasing in the past 5m. The breakout from 94.8k held. I'm calling LONG with high conviction over the next 60 seconds — this looks like a continuation move.",
    "internal_reasoning_hash": "0x..." // hash of the actual reasoning, not exposed
  },
  "tee_attestation": "0x...",
  "agent_signature": "0x..."
}
```

---

## 6. Environment Configuration

### Frontend `.env.local`

```bash
# Network selection
NEXT_PUBLIC_NETWORK=galileo  # or 'aristotle' for mainnet

# RPC endpoints
NEXT_PUBLIC_GALILEO_RPC=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_ARISTOTLE_RPC=https://evmrpc.0g.ai

# Chain IDs
NEXT_PUBLIC_GALILEO_CHAIN_ID=16602
NEXT_PUBLIC_ARISTOTLE_CHAIN_ID=16661

# Contract addresses (populated after deploy)
NEXT_PUBLIC_APPRENTICE_INFT=0x...
NEXT_PUBLIC_SCRYING_DUEL=0x...
NEXT_PUBLIC_CODEX=0x...
NEXT_PUBLIC_MARKETPLACE=0x...
NEXT_PUBLIC_PYTH=0x... # Real Pyth on mainnet, MockPyth on testnet

# 0G Storage (read-only access for frontend)
NEXT_PUBLIC_OG_STORAGE_GATEWAY=https://storage-gateway.0g.ai

# Pyth Hermes
NEXT_PUBLIC_PYTH_HERMES=https://hermes.pyth.network

# Wallet Connect Project ID
NEXT_PUBLIC_WC_PROJECT_ID=...
```

### Agent Runner `.env`

```bash
# Network selection
NETWORK=galileo  # or 'aristotle'

# RPC and chain ID
RPC_URL=https://evmrpc-testnet.0g.ai
CHAIN_ID=16602

# Contract addresses
APPRENTICE_INFT=0x...
SCRYING_DUEL=0x...
CODEX=0x...
PYTH=0x...

# Operator key (the agent's gas wallet)
OPERATOR_PRIVATE_KEY=0x...  # NEVER commit this

# 0G Compute
OG_COMPUTE_LEDGER_PRIVATE_KEY=0x...
OG_PROVIDER_ADDRESS=0x...  # Provider running TeeML mode

# 0G Storage
OG_STORAGE_PRIVATE_KEY=0x...
OG_STORAGE_GATEWAY=https://storage-gateway.0g.ai

# Pyth
PYTH_HERMES=https://hermes.pyth.network
PYTH_FEED_BTC_USD=0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
PYTH_FEED_ETH_USD=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
PYTH_FEED_SOL_USD=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d

# Symmetric key seed (for sealed soul encryption)
SOUL_KEY_SEED=...  # Used to derive per-Apprentice keys via HKDF
```

---

## 7. Process Layout on Contabo VPS

```
/home/ammar/orichalcos/
├── agent-runner/
│   ├── src/
│   ├── dist/
│   ├── .env  (secrets)
│   └── package.json
├── data/
│   └── secrets/
│       └── soul-keys.json  (symmetric keys per tokenId, encrypted at rest)
└── logs/
    ├── duel-loop.log
    └── champion-runner.log

# Run as systemd services
# /etc/systemd/system/orichalcos-duel-loop.service
[Unit]
Description=Orichalcos Duel Loop Service
After=network.target

[Service]
Type=simple
User=ammar
WorkingDirectory=/home/ammar/orichalcos/agent-runner
ExecStart=/usr/bin/node dist/duel-loop.js
Restart=always
RestartSec=10
StandardOutput=append:/home/ammar/orichalcos/logs/duel-loop.log
StandardError=append:/home/ammar/orichalcos/logs/duel-loop.log
Environment="NODE_ENV=production"
EnvironmentFile=/home/ammar/orichalcos/agent-runner/.env

[Install]
WantedBy=multi-user.target
```

---

## 8. Failure Modes & Recovery

| Failure | Detection | Recovery |
|---|---|---|
| **Agent Runner crashes** | systemd restart automatic | systemd auto-restarts; logs to file; alert via Discord webhook (optional) |
| **TEE inference timeout (>30s)** | timeout in fetch() call | Retry up to 3 times with exponential backoff; if all fail, mark duel as failed and refund stake |
| **0G Storage upload fails** | HTTP error from gateway | Retry up to 5 times with exponential backoff; if persistent, fall back to alternative gateway URL |
| **Pyth update unavailable** | Hermes API returns error | Wait 30s and retry; if still failing after 5 minutes, contact Pyth team and pause settlements |
| **0G Chain RPC slow/down** | RPC timeout or 5xx | Switch to backup RPC (record one in env vars); resume operations |
| **Compute ledger runs out of OG** | Pre-flight check before each duel | Monitor balance, alert when below 1 OG; auto-top-up disabled in v1 (manual reload by operator) |
| **Operator wallet runs out of OG (gas)** | Pre-flight check before each tx | Same — monitor and alert |
| **Stale Pyth price (older than maxAge)** | settle() reverts | Catch revert, retry with newer Pyth update data |
| **TEE attestation verification fails** | broker.inference.processResponse returns false | Reject the inference output, retry the call (most likely a transient issue) |

---

## 9. Monitoring & Observability

For the demo period (May 9-16), keep it minimal but functional:

- **Agent Runner logs** stream to `logs/duel-loop.log`, rotated daily
- **Duel-counter dashboard** — simple Next.js page (`/admin/stats`) showing:
  - Total duels run
  - Success/failure ratio
  - Average TEE latency
  - Compute ledger balance
  - Operator wallet balance
- **Discord webhook for critical alerts** (optional Day 5+ task):
  - Compute ledger < 1 OG
  - Operator wallet < 0.1 OG
  - 5+ consecutive duel failures
  - Service crashed / restarted

---

## 10. Deployment Checklist

### Pre-deployment (Day 1)
- [ ] Provision Contabo VPS (KVM 2 should suffice — 4 GB RAM, 2 cores, $6/mo)
- [ ] Set up SSH access
- [ ] Install Node 22, pnpm, systemd
- [ ] Set up domain orichalcos.xyz pointing to Vercel
- [ ] Set up GitHub repo CI for Vercel deployment

### Day 2-3 (Testnet contracts)
- [ ] Run `scripts/deploy-galileo.ts`
- [ ] Verify contracts on chainscan-galileo.0g.ai
- [ ] Update frontend `.env.local` with addresses
- [ ] Deploy frontend to Vercel preview

### Day 4 (Agent Runner)
- [ ] Build agent-runner (`pnpm build`)
- [ ] Copy to Contabo VPS
- [ ] Configure `.env` on VPS
- [ ] Set up systemd service
- [ ] Mint 4 Champions on testnet
- [ ] Start duel-loop service
- [ ] Verify duels are running (check logs)

### Day 7 morning (Mainnet)
- [ ] Buy 7-8 OG on Bitget/MEXC, withdraw to operator wallet
- [ ] Run `scripts/deploy-aristotle.ts`
- [ ] Verify on chainscan.0g.ai
- [ ] Update frontend `.env.local` with mainnet addresses
- [ ] Update agent-runner `.env` on VPS with mainnet config
- [ ] Mint 4 Champions on mainnet
- [ ] Run 5-10 verification duels on mainnet
- [ ] Confirm chainscan shows "verifiable on-chain activity"
- [ ] Deploy frontend production build to Vercel
- [ ] Update DNS / Vercel custom domain to orichalcos.xyz

### Day 8 (Submit)
- [ ] Final smoke test: trigger a live duel, verify Mind Reveal renders
- [ ] Capture all chainscan links for HackQuest submission
- [ ] Final commit + push
- [ ] Submit on HackQuest

---

## 11. Network Reference

| Network | Chain ID | RPC | Explorer | Pyth | Status |
|---|---|---|---|---|---|
| 0G Galileo Testnet | 16602 | https://evmrpc-testnet.0g.ai | https://chainscan-galileo.0g.ai | NOT deployed (use MockPyth) | Free OG via faucet |
| 0G Aristotle Mainnet | 16661 | https://evmrpc.0g.ai | https://chainscan.0g.ai | 0x2880aB155794e7179c9eE2e38200202908C17B43 | Real OG required (~7-8 OG total) |

### Pyth Price Feed IDs (same on both networks where Pyth is deployed)

| Asset | Feed ID |
|---|---|
| BTC/USD | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| ETH/USD | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |
| SOL/USD | `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d` |

---

## 12. Stop Conditions

If you're tempted to add any of the following, stop and reconsider:

- **A backend HTTP API for the frontend.** No — frontend reads on-chain state via wagmi directly, and reads 0G Storage directly. No middle-layer API exists. Adding one balloons scope.
- **A database.** No — all state is on-chain or in 0G Storage. The only "database" is the file-based secret storage on the VPS for symmetric keys.
- **User accounts / sign-up flow.** No — wallet connection IS the account. ERC-7857 ownership IS the identity.
- **A websocket server for live updates.** No — wagmi watchEvent on the contract is sufficient. Polling every 5-15s is the fallback.
- **A separate "agent management" UI.** No — Apprentices are managed through the Apprentice detail page. Champions are NPC-only and managed by the operator off-chain (you).
- **Mobile app.** No — desktop responsive web is enough for demo + judging.

The discipline IS the architecture. Three services, six external dependencies, no extras.
