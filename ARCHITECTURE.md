# Orichalcos v3 Architecture — locked decisions

**Status:** Locked 2026-05-11. Supersedes PIVOT.md "Open questions" section. No re-deciding without writing a new ADR.

## Product framing (locked)

**Orichalcos is a risk-management protocol for autonomous AI trading strategies.**

Tagline: *"Risk-management protocol for autonomous AI traders. Strategies stay sealed. Capital stays safe. Every trade is verifiable."*

Track 2 alignment (Track 2 description names three product types: yield optimizers, risk-management bots, AI-driven perpetual strategy agents):
- **Risk-management bot** — the protocol IS one (bond + drawdown enforcement + claim settlement)
- **AI-driven perpetual strategy agent** — every Strategy INFT is one (TEE-sealed, trades real perps on Hyperliquid)
- **Yield optimizer** — pool LP yield from premium aggregation (secondary claim)

The insurance mechanic is one *feature* of the risk-management protocol, not the entire pitch. We do NOT position as "insurance marketplace" — that frames us as a place; we position as a protocol that does active risk management.

---

## Economic model (THE load-bearing decisions)

### 1. Lifecycle — episodic 7-day epochs
- Each Strategy INFT runs for one 7-day epoch at a time
- Trader bonds collateral at epoch start; collateral is locked until epoch settles
- Insurance policies are bound to a specific (StrategyINFT, epoch) pair
- Re-bonding for next epoch is a fresh transaction (no auto-roll for v3)

### 2. Failure condition — drawdown breach
- Trader picks `maxDrawdownBps` at bond time (e.g. 2000 = 20%)
- Running P&L is tracked in `TradeAttestation` per-trade
- If equity drops below `(bondAmount * (10000 - maxDrawdownBps)) / 10000`, the strategy is in **breach state**
- Anyone can call `markBreach(strategyId)` once breach condition is on-chain provable
- Breach halts further trade attestations and triggers claim settlement

### 3. Bond sizing — bond ≥ max claim
- `bondAmount` must be ≥ `maxClaimAmount` for any active policy on that strategy
- Pool LPs have **zero principal risk** in v3 (premium aggregator only)
- Pool earns: 100% of premiums on successful epochs, 100% of premiums on breached epochs (claim funded entirely by slashed bond)
- v3.1 roadmap: pool can write policies where claim > bond, LPs underwrite tail

### 4. Three parties
| Party | Role | Stake | Reward |
|---|---|---|---|
| **Trader** | Owns Strategy INFT, bonds collateral, runs strategy via TEE | Bond (USDC) | On success: bond back + reputation. On breach: residual = bond - sum(claims) |
| **Allocator** (insurance buyer) | Pays premium for protected exposure to a strategy | Premium (USDC) | On success: nothing — they paid for "insurance" they didn't need (premium is the cost of protection). On breach: claim payout from bond |
| **Pool LP** | Deposits USDC into protocol pool, earns premium yield | Pool deposit (USDC) | Pro-rata share of all premium income (success or breach) |

**Key flow on breach:**
```
Trader: bond=1000 USDC, maxDrawdown=20%
Allocator: pays 100 USDC premium, maxClaim=800 USDC
Strategy equity hits 790 (-21%) → breach
→ markBreach() called
→ 800 USDC of bond → Allocator (claim payout)
→ 200 USDC residual → Trader
→ 100 USDC premium → Pool LPs (already received at policy buy)
→ Strategy frozen
```

**Key flow on success:**
```
Trader: bond=1000 USDC
Allocator: paid 100 USDC premium
Epoch ends, no breach
→ 1000 USDC bond → Trader
→ 100 USDC premium stays in Pool (LP yield)
→ Strategy can re-bond for next epoch
```

---

## Contract surface (3 contracts, not 4 — vault inlined into INFT)

### `StrategyINFT.sol` (ERC-721 + ERC-7857)
**Renames + extends `ApprenticeINFT.sol`. Inlines per-token vault.**

State per token:
```solidity
struct StrategyData {
  Archetype archetype;          // Bold | Patient | Sharp | Stoic (reused from v2)
  bytes32 sealedSoulRoot;       // 0G Storage merkle root, encrypted strategy
  bytes32 metadataHash;         // ERC-7857
  address mintedBy;
  uint256 mintedAt;

  // v3: collateral vault (inlined)
  uint256 currentEpochId;       // 0 = no active epoch
  uint256 bondAmount;           // current epoch's bond (USDC, 6 decimals)
  uint256 maxDrawdownBps;       // e.g. 2000 = 20%
  uint256 epochStartTs;
  uint256 epochEndTs;
  uint256 currentEquity;        // updated by TradeAttestation on each trade
  EpochStatus status;           // Idle | Active | Breached | Settled
}

enum EpochStatus { Idle, Active, Breached, Settled }
```

External fns:
- `mint(trainer, archetype, sealedSoulRoot, metadataHash) → tokenId`
- `startEpoch(tokenId, bondAmount, maxDrawdownBps, epochDurationSecs)` — transfers USDC in, opens epoch
- `recordEquityUpdate(tokenId, newEquity)` — only callable by TradeAttestation contract
- `markBreach(tokenId)` — anyone can call once equity ≤ breach threshold
- `settleEpoch(tokenId)` — callable after epochEndTs OR after breach; pays out per InsurancePool routing
- `setTradeAttestation(addr)` — owner-only, wires the trusted equity-updater
- `setInsurancePool(addr)` — owner-only, wires the pool that takes claims

Views:
- `getData(tokenId)`, `getActiveEpoch(tokenId)`, `breachThreshold(tokenId)`

### `InsurancePool.sol`
**Protocol-owned premium aggregator. v3 = no underwriting risk.**

State:
```solidity
IERC20 public immutable usdc;
address public immutable strategyINFT;

uint256 public totalShares;
uint256 public totalAssets;   // = USDC balance held for LPs (premium yield only, no claim risk)
mapping(address => uint256) public lpShares;

struct Policy {
  uint256 strategyId;
  uint256 epochId;            // matches StrategyINFT.currentEpochId at issue time
  address allocator;          // beneficiary on breach
  uint256 premium;            // already paid in
  uint256 maxClaim;           // payout cap (≤ available bond at issue time)
  PolicyStatus status;        // Active | Claimed | Expired
}
mapping(uint256 => Policy) public policies;
uint256 public nextPolicyId = 1;
```

External fns:
- `deposit(amount)` — LP deposits USDC, mints shares
- `withdraw(shares)` — LP redeems shares for USDC pro-rata (against premium yield only)
- `buyPolicy(strategyId, premium, maxClaim) → policyId` — allocator pays premium, gets policy NFT (or just policyId record)
- `settleClaim(policyId)` — called by StrategyINFT.settleEpoch on breach; routes bond-derived USDC to policy.allocator
- `expirePolicy(policyId)` — called by StrategyINFT.settleEpoch on success; premium becomes LP yield

Premium pricing for v3: **fixed BPS of maxClaim** (e.g. 10% premium for 80% coverage). v3.1 = risk-based pricing oracle.

### `TradeAttestation.sol`
**Append-only log of TEE-verified trades. Computes running equity.**

State:
```solidity
struct Trade {
  uint256 strategyId;
  uint256 epochId;
  bytes32 chatId;             // 0G Compute TEE attestation ID
  bytes32 storageRoot;        // 0G Storage hash of {decision, attestation, tradeReceipt}
  bytes32 hyperliquidTxHash;  // real Hyperliquid testnet txHash (or 0x0 if MOCK_DEX)
  int256 pnlDelta;            // signed P&L change in USDC (6 decimals); cumulative tracked in INFT
  uint256 timestamp;
}
mapping(uint256 => Trade[]) public tradesByStrategy;
```

External fns:
- `recordTrade(strategyId, chatId, storageRoot, hyperliquidTxHash, pnlDelta)` — only operator (off-chain agent runner with signing key); calls `StrategyINFT.recordEquityUpdate(...)` to push new equity
- `getTrades(strategyId) → Trade[]` — for frontend P&L curve
- `setOperator(addr)` — owner-only

**No automatic price oracle.** P&L is reported by the operator and trusted to match the Hyperliquid txHash. v3.1 = Pyth or Hyperliquid oracle to verify P&L on-chain. For demo: judge can click txHash → Hyperliquid explorer → see the actual fill.

---

## What gets archived

```
contracts/src/legacy/v2/
├── ApprenticeINFT.sol          # superseded by StrategyINFT
├── Codex.sol                   # ELO/Title progression dropped from v3
├── ScryingDuel.sol             # superseded by TradeAttestation
└── (interfaces stay shared)
```

Tests in `contracts/test/legacy/v2/` move with them. New tests go in `contracts/test/v3/`.

---

## TEE trust envelope (what we can claim)

See memory `orichalcos_tee_trust_envelope.md`. Summary:
- ✅ "Strategy is sealed in TEE — operator can't read prompt/weights"
- ✅ "Every decision is TEE-attested via chatId + signature"
- ❌ "TEE protects against MEV / front-running" — order signing is outside enclave
- Soft claim: "Decision-to-execution latency reduces front-running surface"

---

## What this enables for the demo

Frame the demo as: *"This is a risk-management protocol. Watch it protect capital from an AI strategy going wrong."*

1. Judge opens Strategy Agent detail page
2. Sees: archetype, sealed strategy hash, bond, current equity, drawdown threshold, P&L curve
3. Clicks a trade → modal shows TEE chatId + 0G Storage hash + Hyperliquid txHash (clickable)
4. Switches to allocator view → "Get protected exposure: 100 USDC premium for 800 USDC coverage against drawdown breach"
5. Operator triggers a breaching trade (mocked for demo) → equity drops below threshold
6. Frontend shows live "BREACH DETECTED" → `markBreach()` tx → protocol auto-settles
7. Allocator's wallet receives 800 USDC payout; trader's wallet receives 200 USDC residual; pool LPs keep premium

Verbal angle for the demo voiceover: *"The strategy itself is sealed inside 0G Compute TEE — nobody, not even the operator, can read it. But every trade is on-chain attested. When the strategy breaches its risk parameters, the protocol enforces the rules automatically. This is what risk management looks like when it's autonomous, verifiable, and adversarial."*

---

## Open implementation questions (don't block on these — decide while coding)

- **USDC on 0G Galileo**: is there an official testnet USDC, or do we deploy a `MockUSDC.sol`? Likely deploy mock; check 0G docs first.
- **Policy as NFT or just struct?**: Just struct for v3, simpler. NFT in v3.1 if secondary market emerges.
- **Operator key**: single EOA controlled by us for demo. Real version = TEE-signed but that's the trust-envelope problem above.
- **Epoch duration enforcement**: hard 7 days, or settable per-bond? Settable, but UI defaults to 7d. For demo we'll likely use shorter (1h, 1day) so the breach can happen during the recording.

---

## Next steps after this doc

1. Move v2 contracts to `contracts/src/legacy/v2/` (mechanical)
2. Draft `StrategyINFT.sol` — start by copying ApprenticeINFT, then add vault state + epoch lifecycle
3. Draft `InsurancePool.sol` — fresh file, ERC-4626-lite for LP shares
4. Draft `TradeAttestation.sol` — fresh file, append-only with operator role
5. Foundry tests for each (target: 80% coverage on new code)
6. Deploy to 0G Galileo, update `deployments-v3.json`
