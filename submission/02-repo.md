# 2. Code Repository

**GitHub URL:** https://github.com/amrrobb/orichalcos
**Branch:** [`feat/v3-insurance-market`](https://github.com/amrrobb/orichalcos/tree/feat/v3-insurance-market) (public)

## What's in the repo

- 5 v3 contracts under `contracts/src/v3/` — `MockUSDC`, `StrategyINFT`, `InsurancePool`, `TradeAttestation`, `MockYieldVault`
- 50 / 50 Foundry tests passing (`forge test --match-path contracts/test/v3/`)
- Live dashboard at [orichalcos.vercel.app](https://orichalcos.vercel.app), source under `dashboard/src/app/`
- Agent runtime + on-chain seed scripts under `agent/src/v3/`, including the reusable `integration-smoke.ts` lifecycle assertions
- Pitch deck at `docs/pitch-deck.html`, demo script at `docs/DEMO-SCRIPT.md`
- 40+ real Hyperliquid testnet fills attested on chain via the `TradeAttestation` contract
