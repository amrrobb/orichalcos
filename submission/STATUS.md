# Submission Status — Orichalcos

**Read this first when you wake up.** Single source of truth. Last updated by overnight session.

## TL;DR — where we are

- **Live app:** https://orichalcos.vercel.app (deployed, working, latest code)
- **Contracts:** Fully redeployed to 0G Galileo testnet, 50/50 tests passing
- **Real Hyperliquid L1 hashes** captured per fill on strategies #5–#8 (verifiable on Hyperliquid's testnet explorer)
- **Pitch deck:** `docs/pitch-deck.html` — 8 slides, brass sigil on title, ~3 min walkthrough
- **Demo script:** `docs/DEMO-SCRIPT.md` — 7 shots, 3 minutes flat
- **Submission folder:** `submission/` — 7 files matching the HackQuest requirements
- **Integration smoke:** `agent/src/v3/integration-smoke.ts` (Wave 3 worker building this) — end-to-end lifecycle assertions for mainnet-readiness

## What's left for YOU to do (in order, ~5 hours)

### 1. Browser smoke (15 min)
Open `https://orichalcos.vercel.app` in a clean browser. Walk through:
1. Onboarding modal appears (clear localStorage first if it's been dismissed)
2. `/strategies/breached` resolves to **strategy #8** — Stoic / Grid, breach state. Click a trade row. The TradeModal should show a "View tx on Hyperliquid ↗" link that opens to a real testnet order page (not a blank one).
3. `/strategies/settled` resolves to **strategy #7 (or #5/#6/#8)** — should be one of the recent ones with real hashes. Click a trade row, same verification path.
4. `/strategies/breached/insure` — slider, premium pill flashes, two-step buy flow.
5. `/protocol` — should show all live strategies + the MockYieldVault "Idle yield" section in the LP panel.

If any step fails, check `docs/PRE-RECORD-CHECKLIST.md` for fallback fixes.

### 2. Push the repo (10 min)

The working branch is `feat/v3-insurance-market`. The git remote may or may not be set.

```bash
cd /Users/ammar.robb/Documents/Web3/hackathons/hackquest-0g
git status                # confirm clean working tree
git log --oneline -10     # confirm recent commits
gh repo view              # check if it has a github origin already

# if no origin, create + push:
gh repo create orichalcos-protocol/orichalcos --public --source=. --remote=origin --push

# if origin exists, just push:
git push origin feat/v3-insurance-market
```

Make sure the repo is **public** OR explicitly shared with hackathon judges.

### 3. Record the demo (3-4 hours)

Follow `docs/PRE-RECORD-CHECKLIST.md` exactly. Then walk `docs/DEMO-SCRIPT.md` shot-by-shot. Upload to YouTube as **unlisted**, copy the URL.

### 4. Post on X (5 min)

Pick a draft from `submission/x-post-drafts.md`. Capture a screenshot or 10-second clip of `/strategies/breached`. Post with the required hashtags + tags. Copy the post URL.

### 5. Submit on HackQuest (15 min)

Open the HackQuest submission form. Cross-reference each numbered file in `submission/`:
- `01-basic-info.md` → fill the form fields
- `02-repo.md` → paste GitHub URL
- `03-0g-integration.md` → paste contract addresses + at least one chainscan + one Hyperliquid testnet tx URL
- `04-demo-video.md` → paste YouTube URL
- `05-readme-pointer.md` → paste GitHub README link
- `06-x-post.md` → paste X post URL
- `07-bonus.md` → pitch deck URL (`/docs/pitch-deck.html` rendered, or upload to a public host)

Hit submit before the deadline (May 16, your local time — verify the timezone on the form).

## What overnight workers produced

| Worker | Status | What it shipped |
|---|---|---|
| HL txHash + re-seed | ✅ done | `agent/src/v3/hyperliquid.ts` captures real L1 hashes; strategies #5–#8 minted with real-hash provenance; #8 force-breached |
| Vercel deploy (round 1) | ✅ done | `orichalcos.vercel.app` live with all UI changes |
| Slug resolver fix | ✅ done | `/strategies/breached` → #8 (real hashes), `/strategies/settled` → newest healthy strategy |
| Vercel deploy (round 2) | ✅ done | resolver fix live |
| Wave 1 — pitch deck sigil | ✅ done | Title slide now has rotating wax-seal sigil matching the UI |
| Wave 1 — X post drafts | ✅ done | `submission/x-post-drafts.md` with 3 variants |
| Wave 1 — submission stubs | ✅ done | 7 numbered files in `submission/` |
| Wave 2 — concrete data backfill | ✅ done | `submission/03-0g-integration.md` filled with real tx hashes pulled live from chain; pitch deck 4→5 contracts, 47→50 tests |
| Wave 3 — integration smoke | ✅ done | `agent/src/v3/integration-smoke.ts` — 9/9 lifecycle steps pass on Galileo; `pnpm run v3:integration` from `agent/` re-runs |

### Wave 3 — concrete results (proof of FE/BE/SC integration)

The integration smoke ran fresh against the deployed Galileo contracts. All 9 steps pass:

1. ✓ Mint tokenId=10
2. ✓ startEpoch with 100 USDC bond, 20% drawdown, 1-day epoch
3. ✓ Record 3 trades (+5, +5, -100) — equity now 10 USDC, below 80 USDC threshold
4. ✓ Allocator (derived second wallet) buys 50 USDC policy for 6.25 USDC premium
5. ✓ markBreach(10) — status → Breached
6. ✓ settleEpoch(10) — event `toAllocators=50.0 USDC`, `toTrader=0`
7. ✓ Atomic settleClaim verified — policy → Claimed, allocator balance += 50 USDC
8. ✓ Double-claim guard verified — second settleClaim reverts
9. ✓ Allocator P&L: **+43.75 USDC** (claim 50 − premium 6.25), exactly matches v2 economic model

Settle tx on Galileo: `0x03baf226a91d7f59c1fc44c675f668360da4ce3c5387caf20e643609fd358c72`

**Mainnet portability:** the script mints a fresh tokenId each run, so it's safe to re-invoke on mainnet to validate the deployment day-1. Two contract-truth deviations the worker discovered (both intentional design, not bugs):
- Status resets to `Idle` after settlement (re-bond-friendly), not `Settled`
- `settleClaim` is called atomically inside `settleEpoch`, not a separate allocator-pulled step

## Known facts to verify before recording

- The pitch deck previously said "47/45 tests" — Wave 2 was told to update to 50/50. **Spot-check `docs/pitch-deck.html` slide 7 has the badge "50/50".**
- The pitch deck previously said "4 contracts" — Wave 2 was told to update to 5 (MockYieldVault added). **Spot-check slide 1 or 4.**
- Strategies #5/#6/#7 are healthy and carry real L1 hashes. Strategy #8 is breached with 11 trades.
- Hyperliquid agent wallet `0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d` has 40+ real fills visible at https://app.hyperliquid-testnet.xyz/explorer/address/0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d

## Decisions I made on your behalf

1. **v2 settlement pivot** — committed. Premium splits 60% trader / 40% LP on a kept promise. The asymmetric "trader gets bond back, nothing else" v1 model is replaced. README + pitch deck explain this.
2. **Slug naming** — locked to `breached` and `settled` (mirrors `EpochStatus` enum). Aliases `active`/`healthy` accepted but not canonical.
3. **Hyperliquid verify link** — switched from broken `/explorer/order/{oid}` to working `/explorer/tx/{hash}`. Legacy strategies (#1–#3) still have oids; new strategies (#5–#8) have real hashes.
4. **Slug resolver sort** — prefers the **highest tokenId** so demo URLs always land on the newest (real-hash) strategy.
5. **MockYieldVault** — deployed as a demo-grade simulated yield wrapper. Labeled "demo" in code and UI. 8% APR, seeded with 1M USDC reserve.

If any of these decisions need rolling back, the rollback is documented inline in the affected commits.

## Backout plan (if something is broken at submission time)

- **Demo URL broken:** the contracts are independent of the dashboard. Walk a judge through `chainscan-galileo.0g.ai` reads + `cast call` if needed.
- **Hyperliquid links broken:** fall back to the address page link, which is permanent. The pitch deck mentions both.
- **txHash captures missed for some trades:** strategies #1–#3 still work as healthy demo examples (they just lack per-trade clickable verification). #8 is the canonical breach demo.

## Files to check before submission

```bash
# Glance at each. They should reflect current state.
cat submission/STATUS.md          # this file
cat submission/01-basic-info.md   # for form copy
cat submission/03-0g-integration.md  # for proof links — Wave 2 backfills this
cat docs/DEMO-SCRIPT.md           # for recording
cat docs/PRE-RECORD-CHECKLIST.md  # for setup before camera
```

Good luck. Submit before the deadline.
