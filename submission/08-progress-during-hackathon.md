# 8. Progress During the Hackathon

### What shipped

- 5 contracts on 0G Galileo (`MockUSDC`, `StrategyINFT`, `InsurancePool`, `TradeAttestation`, `MockYieldVault`). 50 / 50 Foundry tests pass.
- Symmetric premium settlement — on a kept promise, premium splits 60% trader / 40% LP. Trader earns yield for being right, not just bond return.
- Real Hyperliquid testnet integration — per-fill L1 transaction hashes captured on chain and directly clickable on Hyperliquid's testnet explorer.
- Live dashboard at [orichalcos.vercel.app](https://orichalcos.vercel.app) — slug routes `/strategies/breached` and `/strategies/settled`, onboarding modal, in-app faucet, MockYieldVault LP yield panel.
- End-to-end integration smoke ([`agent/src/v3/integration-smoke.ts`](../agent/src/v3/integration-smoke.ts)) — mint → epoch → trades → policy → breach → settle → claim, 9 / 9 assertions pass against deployed contracts.

### Challenges

- **Hyperliquid uses tx-hash addressing, not order-id URLs.** The first integration captured the API's internal `oid` and stuffed it into a `bytes32` on chain — only to discover Hyperliquid's explorer routes by L1 tx hash. Rebuilt the agent to look up the real hash via `userFillsByTime` after each fill, then re-seeded the demo strategies so every trade now carries a directly verifiable link.
- **`StrategyINFT.setInsurancePool` is set-once.** Wiring a new `InsurancePool` after the symmetric-settlement change required a full v3 redeploy of all four core contracts plus re-wire of the agent runtime, frontend address constants, and re-seeding the demo state.
- **Asymmetric vs symmetric settlement.** The first economic design returned the bond to the trader on a kept promise but gave them no upside — a rational trader has no reason to bond capital with zero return. Reworked `InsurancePool.expirePolicy` to split the premium 60% trader / 40% LP, creating a real two-sided market instead of one-sided insurance.
- **Slug routing collision.** Both legacy (oid-encoded) and current (real-hash) breached strategies existed on chain after the redeploy. The slug resolver now sorts by highest tokenId so demo URLs always land on the newest strategy with real verifiability.
