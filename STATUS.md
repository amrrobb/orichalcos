# STATUS — Orichalcos v3 (Risk-Management Protocol)

> **Last updated:** 2026-05-13 (Day 13, loop iteration 2 closed)
> **Deadline:** 2026-05-16 23:59 UTC+8 (3 days remaining)
> **Branch:** `feat/v3-insurance-market`
> **Single source of truth:** read this file first when you wake up.

> **Loop iteration 2 closed.** Shipped: HANDOFF Section 2 v3 rewrite, frontend rebrand (landing/header/footer), strategy-runner.ts autonomous loop. All loop-able tasks complete. Remaining tasks require user-in-browser (#18 demo rehearsal), real-money decision (#19 mainnet deploy), recording (#20 video), or final submission (#22).

> **Note on legacy strategies (#1-16):** TradeModal will show "Demo trade (legacy encoding — explorer link unavailable)" for these. Not a bug — they were minted before the oid-encoding fix. Demo flow uses #17-20 only.

---

## TL;DR — IT'S ALREADY LIVE. CLICK + TEST.

```bash
cd dashboard
npm run dev
# Open http://localhost:3000/strategies/4
# (strategy 4 is the BREACHED one — Stoic/Grid, equity at 790, threshold 800)
```

Demo data is **already populated** on Galileo. Canonical demo strategies are **#17-20** — they have **real Hyperliquid testnet trades** with linkable explorer URLs.

| URL | What it shows |
|---|---|
| `/strategies/17` | Bold/Momentum, equity 1135 (+13.5%), 10 real HL trades |
| `/strategies/18` | Patient/Mean-Reversion, equity 1055 (+5.5%) |
| `/strategies/19` | Sharp/Microstructure, equity 1041 (+4.1%) |
| `/strategies/20` | **Stoic/Grid, equity 790 (-21%) → READY TO BREACH** ← demo Frame 3 |
| `/protocol` | LP deposit + active strategies grid |
| `/strategies/17/insure` | Buy a policy (use SECOND wallet — self-insurance blocked) |

> Click any trade in the timeline on `/strategies/17` → modal shows clickable Hyperliquid testnet order ID that resolves to the real fill page.

To trigger Strategy #20 breach in demo:
1. Open `/strategies/20` — see equity 790, threshold 800, ready to mark
2. Click "Mark Breach" in the BreachBanner → tx fires
3. Click "Settle Epoch" → bond slashed, pool absorbs residual
4. Watch `/protocol` LP yield go up

> ⚠️ Strategies #1-16 are historical demo data with various encoding. #1-12 use mock HL hashes (random bytes32, no real fills). #13-16 use real HL fills but with KECCAK-hashed oids (explorer links broken). #17-20 use pad-encoded oids (lossless, links work).

If equity ever gets restored above 800 (e.g. someone runs populate-demo by accident):
```bash
cd agent
# populate-demo now BLOCKS re-runs by default (idempotency guard)
PRIVATE_KEY=0x... npm run v3:populate    # will error: "12+ strategies already exist"

# To re-trigger breach on a specific strategy:
PRIVATE_KEY=0x... ./node_modules/.bin/tsx src/v3/force-breach.ts 20 750
```

If you want to re-run the populator (fresh trades, e.g. after Aristotle deploy):
```bash
cd agent
PRIVATE_KEY=0x... MOCK_DEX=true npm run v3:populate
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

### Contracts (Galileo)
- 3 v3 contracts deployed, set-once wired, 45 Foundry tests passing, 81% line coverage
- Demo wallets funded with USDC at deploy

### Demo data on chain
- **20 Strategy Agents minted total** (tokenIds 1-20)
- **#17-20 are the canonical demo strategies** (real Hyperliquid testnet trades with linkable explorer URLs)
- **#13-16 had real HL trades but keccak-hashed oids** (explorer links broken; superseded by #17-20)
- **#1-12 are mock-HL demo data** (random bytes32 hashes, no real fills)
- **Strategy #20 in pre-breach state** (equity 790, threshold 800, status Active — judges click Mark Breach to demo)

Real Hyperliquid integration verified end-to-end:
- HL trading wallet: `0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d`
- HL wallet balance: ~$97 (started $100, $0.075/trade slippage × 40 trades)
- One trade verified: strategy #17 trade 0 → oid `52968867292` → https://app.hyperliquid-testnet.xyz/explorer/order/52968867292 → HTTP 200

### Agent runner scaffolding
- `agent/src/v3/hyperliquid.ts` — `@nktkas/hyperliquid` SDK wrapper, 3 fns
- `agent/src/v3/test-hl.ts` — HL smoke test (needs funded `HL_TEST_PRIVATE_KEY`)
- `agent/src/v3/HYPERLIQUID_NOTES.md` — caveats (HL `oid` not `txHash`)
- `agent/src/v3/populate-demo.ts` — one-shot demo data populator ✅ ran successfully
- `agent/src/v3/smoke-test-galileo.ts` — health check, all wires verified ✓
- npm scripts: `npm run v3:populate`, `npm run v3:hl-test`

### Frontend
- `dashboard/src/lib/{contracts.ts, abi/v3.ts, v3format.ts}` — wiring + ABIs + USDC formatting helpers
- 8 hooks under `dashboard/src/hooks/v3/`
- 8 components under `dashboard/src/components/{strategy,v3}/`
- 3 routes: `/strategies/[tokenId]`, `/protocol`, `/strategies/[tokenId]/insure`
- BreachBanner wired into Strategy detail page (polls breach every 5s, markBreach + settleEpoch buttons inline)
- All 3 routes return HTTP 200 with content — verified via curl
- Dev server boots in 500ms

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

## Frontend deep dive (built by 2 parallel background agents, integrated by me)

**Agent A** built the Strategy detail page. **Agent B** built the protocol landing + buyPolicy flow + BreachBanner. I integrated BreachBanner into Agent A's detail page (they ran parallel and didn't coordinate the import).

Important behaviors:
- Approve flow approves the *premium* only, not maxClaim. Skips approve when allowance is sufficient.
- `premiumBps` read live from pool, `V3_PREMIUM_BPS_DEFAULT` is fallback only
- Trade rows most-recent first; modal opens on click; Esc + backdrop close
- `BreachBanner` polls every 5s while status is Active/Breached, short-circuits in Idle/Settled
- After settle confirms, banner self-promotes to 10s green "settled" confirmation

Known polish TODO (Day 14):
- 6 pre-existing TS errors in `src/app/api/tell/route.ts` block `npm run build` (not `npm run dev`) — unrelated to v3, but blocks Vercel deploy
- Owner display shows current owner (via `ownerOf`) not `mintedBy` (intentional, they can diverge after transfer)
- Storage-root link points to chainscan-galileo `/address/<hash>` ("explorer pending" label since it's a merkle root, not an address)

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
