# 7. Optional Bonus Materials

Listed by HackQuest as ways to strengthen a submission.

| Bonus | Where |
|---|---|
| Pitch deck / slides | [`docs/pitch-deck.html`](../docs/pitch-deck.html) — 8 slides, ~3-minute walkthrough, brass-on-ink consistent with the live UI |
| Frontend demo link | [orichalcos.vercel.app](https://orichalcos.vercel.app) |
| Backend API documentation | Contract ABIs at `dashboard/src/lib/abi/v3.ts`; agent runtime entry points under `agent/src/v3/`; SDK + RPC notes at `agent/src/v3/HYPERLIQUID_NOTES.md` |
| Tutorial / technical write-up | [`README.md`](../README.md) and this `submission/` folder cover end-to-end usage, architecture, and reviewer flow |
| Integration smoke / backtest | [`agent/src/v3/integration-smoke.ts`](../agent/src/v3/integration-smoke.ts) — full lifecycle (mint → epoch → trades → policy → breach → settle → claim), 9/9 assertions pass against deployed Galileo contracts. Run with `pnpm run v3:integration`. |
