# STATUS — Orichalcos v3 (Risk-Management Protocol)

> **Last updated:** 2026-05-12 (overnight build, Day 12 AM)
> **Deadline:** 2026-05-16 23:59 UTC+8 (4 days remaining)
> **Branch:** `feat/v3-insurance-market`
> **Single source of truth:** read this file first when you wake up.

---

## TL;DR — what you can test in the morning

```bash
# Terminal 1 — start the frontend
cd dashboard
npm run dev
# Open http://localhost:3000

# Terminal 2 — populate demo data on Galileo (one-shot)
cd agent
cp .env.example .env             # fill PRIVATE_KEY in .env (deployer key)
PRIVATE_KEY=0x0967cf3226ff3b10c198740a6002e61b8879d6e72f54d315d190d7e7bf5b9857 \
MOCK_DEX=true \
./node_modules/.bin/tsx src/v3/populate-demo.ts
# This mints 4 Strategy Agents and records ~10 trades each.
# Strategy #4 will end in BREACH state for the demo.
```

Then visit:
- `/strategies/1` through `/strategies/4` — individual Strategy Agent detail pages (the page Frontend Agent A built)
- `/protocol` — LP deposit + active strategies list (the page Frontend Agent B built)
- `/strategies/4/insure` — try buying a policy on the breaching strategy

---

## What's deployed (Galileo testnet, chainId 16602)

| Contract | Address |
|---|---|
| MockUSDC | `0x2F7296aebCBc5a8D67A65FA6BF09dD74c70bC60f` |
| StrategyINFT | `0x349D286aF27501d4119C11709bb48f4Ef9f50450` |
| InsurancePool | `0xdAe6c8DCE82f848e3b5a21320F0b8eeB655a0E91` |
| TradeAttestation | `0x30Fc834477B15B0B3720D61A169FF5dFe4D7C742` |

Demo actors funded with test USDC at deploy time:
- Trader (deployer 0x77C0…8812): 50K USDC
- Allocator A (0x…bEEF): 10K USDC
- Allocator B (0x…BEe9): 10K USDC
- LP1 (0x…c0DE): 20K USDC
- LP2 (0x…C0d3): 20K USDC

> ⚠️ Allocators A/B and LP1/LP2 are deterministic vanity addresses **with no private keys we control**. For frontend interactions you connect your own wallet — that wallet plays whichever role you want. The "trader" role is the deployer key; that's the wallet that mints + manages Strategy Agents. To buy policies as an allocator, connect a DIFFERENT wallet (Metamask, second account).

---

## What's done ✅

### Contracts (all on Galileo)
- 3 v3 contracts deployed, set-once wired, 45 Foundry tests passing, 81% line coverage
- Demo wallets funded with USDC
- 0G Galileo explorer: `https://chainscan-galileo.0g.ai/address/<addr>`

### Agent runner
- `agent/src/v3/hyperliquid.ts` — Hyperliquid SDK wrapper (placePerp, getEquity, closePerp)
- `agent/src/v3/test-hl.ts` — smoke test (needs `HL_TEST_PRIVATE_KEY` funded from https://app.hyperliquid-testnet.xyz/drip)
- `agent/src/v3/HYPERLIQUID_NOTES.md` — caveats (HL returns `oid` not `txHash`)
- `agent/src/v3/populate-demo.ts` — one-shot demo data populator (mocks trades by default)

### Frontend
- `dashboard/src/lib/abi/v3.ts` — all v3 ABIs auto-extracted from forge artifacts
- `dashboard/src/lib/contracts.ts` — `V3_ADDRESSES`, archetype labels, enums
- `dashboard/.env.local` — v3 env vars set
- Two frontend agents built UI overnight — see "What was built by background agents" section below

---

## What's mocked (swap to real later)

| What | How it's mocked | How to swap to real |
|---|---|---|
| Hyperliquid trades | `populate-demo.ts` generates random bytes32 "txHashes" when `MOCK_DEX=true` | Fund HL wallet → set `HL_TEST_PRIVATE_KEY` → set `MOCK_DEX=false` → re-run populator |
| TEE attestation `chatId` | populate-demo generates random bytes32 | Need real 0G Compute integration in the runner — Day 13 task |
| 0G Storage `storageRoot` | populate-demo generates random bytes32 | Need to wire `agent/src/duel/storage.ts` upload helpers — Day 13 task |
| LP deposits / allocator buys | None — they happen through the frontend with your wallet | n/a, this is intentional |

The economic flow is **100% real on chain** — the only fakes are the off-chain attestation references (chatId, storageRoot, hyperliquidTxHash). Bond, premium, claim, settle all happen as real txs.

---

## What was built by background agents

> Two agents ran overnight. When they finish, check their reports in the message log (search "agentId: a3ea4782" and "agentId: adfa15fb"). Their files:

**Agent A (Strategy detail page, agentId a3ea4782):**
- Route: `/strategies/[tokenId]`
- Components for archetype header, status badge, vault stats, sealed soul hash, P&L sparkline, trade timeline, trade modal
- Hooks: `useStrategyData(tokenId)`, `useTradesForStrategy(strategyId)` under `dashboard/src/hooks/v3/`
- *Their report will land in the conversation when they finish*

**Agent B (Allocator + buyPolicy + breach UI, agentId adfa15fb):**
- Routes: `/protocol` (LP + active strategies), `/strategies/[tokenId]/insure` (buyPolicy flow)
- Exported `useBreachStatus(tokenId)` hook + Breach banner component for Agent A's detail page to embed
- Hooks: `useInsurancePool()`, `useAllPolicies()`, `useBuyPolicy()` under `dashboard/src/hooks/v3/`
- *Their report will land in the conversation when they finish*

---

## ⚠️ Decisions queued for AM (you decide, then I move)

1. **Hyperliquid funding** — fund a fresh wallet at https://app.hyperliquid-testnet.xyz/drip and paste private key into `agent/.env` `HL_TEST_PRIVATE_KEY=`. This unlocks real testnet trades. Default until then is `MOCK_DEX=true`.

2. **Demo epoch length** — currently `populate-demo.ts` hardcodes 1 day. For demo recording you want this much shorter (5min or 30min) so the breach can fire visibly during recording. Adjust `epochDurationSecs` in the script before mainnet deploy.

3. **Frontend look + feel** — the two agents made design decisions. Skim their pages first thing in the morning, flag anything off-brand. We have time on Day 14 to polish.

4. **Mainnet deploy timing** — currently planned Day 15 AM. The deploy script (`script/v3/DeployGalileo.s.sol`) is parameterized only by RPC URL. To deploy to Aristotle just change `--rpc-url https://evmrpc.0g.ai` and `--legacy`. Cost ~0.025 OG.

---

## 5-day plan from here

| Day | Output |
|---|---|
| **May 12 AM** ✅ | Galileo deploy + agent/v3 scaffold + populate-demo script + 2 frontend agents running |
| **May 12 PM** | Wake up, verify frontend works, run populator, click through full flow. Fix bugs. |
| **May 13** | Wire real Hyperliquid trades (HL faucet → real txHashes). Wire real 0G Compute TEE for at least 1 trade per strategy. Polish frontend. |
| **May 14** | End-to-end rehearsal. Anything broken? Fix. Anything ugly? Polish. Buffer day. |
| **May 15 AM** | **Aristotle mainnet deploy** (~0.025 OG, after Galileo demo is rock-solid). Verify on chainscan. |
| **May 15 PM** | Record demo video (≤3 min). Rewrite README.md for v3. |
| **May 16** | Final polish. X post. Submit on HackQuest. |

---

## Open known issues / things to check on wake-up

- [ ] Run `npm run dev` in `dashboard/` — does it boot cleanly? Any TS errors?
- [ ] Visit `/strategies/1` before running populator — should show "no strategy" or empty state, NOT crash
- [ ] Run populate-demo.ts — does it complete without reverts?
- [ ] After populator, visit `/strategies/4` — does P&L sparkline show the descent → breach?
- [ ] Try buyPolicy on `/strategies/1/insure` with your wallet — does premium math feel right (~12.5% of maxClaim)?
- [ ] Try `markBreach` + `settleEpoch` on strategy #4 — does the breach banner appear, settle work, residual go to pool?
- [ ] Read the two agent reports — anything they flagged as TODO?

---

## Memory + docs index (auto-loaded next session)

- `PIVOT.md` — original v3 pivot decision + 5-day plan
- `ARCHITECTURE.md` — locked economic model, contracts, user framing
- `MEMORY.md` (in `~/.claude/.../memory/`) — TEE trust envelope, user framing, hackathon battle plan
- `deployments-v3-galileo.json` — all addresses + actors
- `agent/src/v3/HYPERLIQUID_NOTES.md` — HL gotchas
