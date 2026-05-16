# 8. Progress During the Hackathon

## What shipped

- **5 v3 contracts on 0G Galileo** — `MockUSDC`, `StrategyINFT`, `InsurancePool`, `TradeAttestation`, `MockYieldVault`. 50 / 50 Foundry tests pass.
- **Symmetric premium settlement** — on a kept promise, `InsurancePool.expirePolicy` splits premium 60% to the trader / 40% to the LP pool. The trader now earns yield for keeping the bonded promise, not just bond return.
- **Real Hyperliquid testnet integration** — the agent runtime captures L1 transaction hashes per fill via `userFillsByTime`. Strategies #5–#8 carry directly clickable per-trade verifiability on Hyperliquid's testnet explorer.
- **Live dashboard** at [orichalcos.vercel.app](https://orichalcos.vercel.app) — 4 redesigned pages, onboarding modal, in-app faucet, slug routes (`/strategies/breached`, `/strategies/settled`).
- **End-to-end integration smoke** — [`agent/src/v3/integration-smoke.ts`](../agent/src/v3/integration-smoke.ts) runs the full lifecycle (mint → epoch → trades → policy → breach → settle → claim) with assertions at every step. 9 / 9 pass against deployed Galileo contracts. Reusable as mainnet day-1 smoke.

## On-chain evidence

| Event | Tx hash |
|---|---|
| `markBreach(8)` — breach demo flipped to Breached | [`0x35160a80…44991aa`](https://chainscan-galileo.0g.ai) |
| Integration smoke `settleEpoch` — full lifecycle proof | [`0x03baf226…58c72`](https://chainscan-galileo.0g.ai) |
| Sample Hyperliquid testnet fill | [`0x792f1c72…fc72f`](https://app.hyperliquid-testnet.xyz/explorer/tx/0x792f1c724e2bed447aa80421d6ea270107003457e92f0c161cf7c7c50d2fc72f) |
| Agent trading wallet (full HL ledger) | [`0x438FD476…2d5d`](https://app.hyperliquid-testnet.xyz/explorer/address/0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d) |

## Design evolution

The project went through two protocol-design iterations during the hackathon:

1. **First framing — autonomous trading vault.** Mirrored Track 2's "AI-driven yield optimizer" archetype. Documented for history in [`docs/checkpoint-submission.v1-archived.md`](../docs/checkpoint-submission.v1-archived.md).
2. **Current framing — promise-keeping market.** A two-sided market where AI agents bond credibility against an on-chain promise, allocators take the other side, and LPs underwrite the float. This is what the submission ships and what the demo records.

The cryptographic primitives (sealed strategy in 0G TEE, attestation via 0G Storage merkle root, on-chain settlement on 0G Chain) are unchanged across iterations. The economic mechanism is what evolved into the current symmetric design.
