# HackQuest form — Progress During Hackathon field

Copy everything between the `===` lines below into the **Progress During Hackathon** field on the HackQuest submission form.

================================================================
What shipped

- 5 contracts deployed to 0G Aristotle mainnet (chainId 16661, RPC evmrpc.0g.ai). MockUSDC, StrategyINFT (ERC-7857), InsurancePool, TradeAttestation, MockYieldVault — all wired and verified on chainscan.0g.ai. Same five also deployed to Galileo testnet for the lifecycle demo.
- 50/50 Foundry tests pass. End-to-end lifecycle smoke (agent/src/v3/integration-smoke.ts) verifies mint → bond → stake → breach → settle → claim against deployed contracts.
- Trader-side mint UI at /wagers/new on the live dashboard. Trader writes a free-text promise, the server-side route encrypts to 0G Storage, runs a real Qwen 2.5 VL 72B inference on 0G Compute TEE, verifies the chatId enclave signature, and mints the INFT on 0G Chain — all in one HTTP request.
- 4-of-5 0G stack wired end-to-end on mainnet. Live evidence: tokens #1 and #2 carry real 0G Storage merkle roots and TEE-verified chatIds, queryable via getData() on the StrategyINFT contract.
- Symmetric stake settlement — on a kept promise, the stake splits 60% trader / 40% LP. Trader earns recurring yield for being right; LP earns from total stake volume. Both sides can earn from each other.
- Real Hyperliquid testnet execution — per-fill L1 transaction hashes captured on chain and directly clickable on Hyperliquid's testnet explorer.
- Live dashboard at orichalcos.vercel.app — slug routes /strategies/breached and /strategies/settled, in-app MockUSDC faucet, LP deposit/withdraw panel, TradeModal with TEE chatId + 0G Storage root + Hyperliquid tx hash per trade.

Challenges and resolutions

Hyperliquid uses tx-hash addressing, not order-id URLs. The first integration captured the API's internal oid and stuffed it into a bytes32 on chain — only to discover Hyperliquid's explorer routes by L1 tx hash. Rebuilt the agent to look up the real hash via userFillsByTime after each fill, then re-seeded the demo wagers so every trade now carries a directly verifiable link.

Asymmetric vs symmetric settlement. The first economic design returned the bond to the trader on a kept promise but gave them no upside — a rational trader has no reason to bond capital with zero return. Reworked InsurancePool.expirePolicy to split the stake 60% trader / 40% LP, creating a real two-sided market instead of one-sided insurance.

StrategyINFT.setInsurancePool is set-once. Wiring a new InsurancePool after the symmetric-settlement change required a full redeploy of all five core contracts plus re-wire of the agent runtime, frontend address constants, and re-seeding the demo state.

0G mainnet sub-account funding. The 0G Compute SDK on mainnet requires a pre-funded ledger sub-account before TEE inference works — addLedger(3 0G) + transferFund(provider, 1 0G, "inference"). Wrote agent/src/v3/bootstrap-mainnet-compute.ts to do this once after the mainnet contract deploy; subsequent /api/mint-wager calls now run TEE inference end-to-end against the funded provider.

Slug routing collision. Both legacy (oid-encoded) and current (real-hash) breached wagers existed on chain after the redeploy. The slug resolver now sorts by highest tokenId so demo URLs always land on the newest wager with real verifiability.
================================================================
