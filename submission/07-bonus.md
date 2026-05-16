# 7. Optional Bonus Materials

> Not mandatory, but listed by HackQuest as ways to strengthen a submission.

| Bonus | Status | Where |
|---|---|---|
| Pitch deck / slides | ✅ Done | `docs/pitch-deck.html` — 8 slides, ~3 min walkthrough, brass-on-ink consistent with UI |
| Frontend demo link | ✅ Live | [orichalcos.vercel.app](https://orichalcos.vercel.app) |
| User feedback screenshots | — | Not collected (single-builder hackathon timeline) |
| User testing notes | — | See `docs/DEMO-SCRIPT.md` for the canonical reviewer flow |
| Backend API documentation | Partial | Contract ABIs are in `dashboard/src/lib/abi/v3.ts`; agent runtime entry points in `agent/src/v3/*.ts` |
| Tutorial / technical write-up | Partial | This `submission/` folder + the root `README.md` cover it |
| Integration smoke / backtest | 🟢 Pending | Wave 3 worker — `agent/src/v3/integration-smoke.ts` (full lifecycle: mint → trade → bond → policy → breach → settle → claim) |

## What's most worth filling in if you have spare time post-submission

1. **A short technical write-up** explaining the symmetric premium settlement (v2's 60/40 trader/LP split) and why it differs from the v1 design. This is the protocol's strongest economic claim and reviewers may not catch it from the README alone.
2. **User testing notes** — even a 200-word "what I learned from watching three people try the buy-policy flow" is uncommon enough to stand out.
3. **API documentation** for the agent's runtime — `agent/src/v3/HYPERLIQUID_NOTES.md` already documents some of this; promote it to a top-level `docs/AGENT-API.md` if time permits.
