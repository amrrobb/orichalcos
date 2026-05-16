# 8. Progress During the Hackathon

> Optional submission section. Documents what was built inside the hackathon window — useful context for judges weighing "substantial development progress."

## Hackathon timeline

| Phase | Approximate dates | What shipped |
|---|---|---|
| Pre-hackathon (idea) | Early April 2026 | Project framing during the 0G APAC hackathon period; initial scoping discussions |
| v1 prototype (vault framing) | Early–mid May 2026 | First contract surface — autonomous trading vault, MEV simulation, attestation registry. See [`docs/checkpoint-submission.v1-archived.md`](../docs/checkpoint-submission.v1-archived.md) for the checkpoint snapshot. |
| Design pivot to promise-keeping market | May 13–14, 2026 | Recognized the v1 vault framing didn't make the economics symmetric. Pivoted to a two-sided market: traders bond against on-chain promises, allocators take the other side. |
| v3 contract suite | May 14–16, 2026 | Five contracts on 0G Galileo: `MockUSDC`, `StrategyINFT`, `InsurancePool`, `TradeAttestation`, `MockYieldVault`. 50/50 Foundry tests passing. |
| Symmetric settlement (v2 economic model) | May 16, 2026 | `InsurancePool.expirePolicy` splits premium 60% trader / 40% LP on a kept promise. Replaces v1 where the trader had no upside on success. Full redeploy + re-seed on Galileo. |
| Hyperliquid integration | May 14–16, 2026 | Agent runtime captures real Hyperliquid testnet L1 tx hashes per fill via `userFillsByTime`. Strategies #5–#8 carry real per-trade verifiability — clickable on Hyperliquid's testnet explorer. |
| Frontend redesign + UX | May 13–15, 2026 | Four pages redesigned with brass-on-ink dossier aesthetic, framer-motion entrance animations, onboarding modal, faucet button, MockYieldVault idle-yield panel, slug routes (`/strategies/breached`, `/strategies/settled`). |
| Integration smoke + handoff | May 16, 2026 | End-to-end lifecycle script (`agent/src/v3/integration-smoke.ts`) — 9/9 assertions pass on Galileo. Reusable as mainnet day-1 smoke. |

## Notable milestones (with on-chain evidence)

- **markBreach(8) tx** — `0x35160a80728b53a156cb923329b70b758362977f01de32e08332d93aa44991aa` ([chainscan](https://chainscan-galileo.0g.ai))
- **Integration smoke settleEpoch tx** — `0x03baf226a91d7f59c1fc44c675f668360da4ce3c5387caf20e643609fd358c72`
- **Sample Hyperliquid testnet fill** — `0x792f1c724e2bed447aa80421d6ea270107003457e92f0c161cf7c7c50d2fc72f` ([hl-testnet explorer](https://app.hyperliquid-testnet.xyz/explorer/tx/0x792f1c724e2bed447aa80421d6ea270107003457e92f0c161cf7c7c50d2fc72f))
- **Agent trading wallet on Hyperliquid testnet** — `0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d` ([full ledger](https://app.hyperliquid-testnet.xyz/explorer/address/0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d))

## Lines of code shipped during hackathon

(rough, single-builder)

- Solidity: ~1,500 (5 contracts + 50 tests)
- TypeScript (agent runtime): ~2,000 across `agent/src/v3/` including the new `integration-smoke.ts`, real-txHash capture in `hyperliquid.ts`, retry-resilient `resume-trades.ts`
- TypeScript (frontend): ~4,000 across `dashboard/src/app/` + `dashboard/src/components/v3/redesign/`
- Docs: ~12,000 lines across `docs/`, `README.md`, and `submission/`

The final commit on `feat/v3-insurance-market` (`e47cec6` + `6a640a3`) summarizes the overnight delta as: **68 files changed, +9,021 / −1,185** — most of that landed in the last 24 hours of the hackathon window after the design pivot.

## What changed mid-hackathon (and why it's not a red flag)

The mid-hackathon pivot from vault to market is documented in the README's "Roadmap" section and explicitly called out in `submission/01-basic-info.md` under "Why this is a market, not insurance." The v1 prototype contracts referenced in `docs/checkpoint-submission.v1-archived.md` are not part of the current submission — they were a stepping-stone that informed the better v3 design.

For a single builder, pivoting on protocol-design discovery during the hackathon period is healthy. The contracts and frontend that ship in the final submission are coherent and integrated end-to-end (proven by the integration smoke script).
