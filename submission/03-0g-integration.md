# 3. 0G Integration Proof

## 0G Chain (Galileo testnet) — contract deployments

| Contract | Address | Explorer |
|---|---|---|
| MockUSDC | `0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7) |
| StrategyINFT | `0x782CBD5313E3b99d9C94e4f5197B81a432cdE621` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x782CBD5313E3b99d9C94e4f5197B81a432cdE621) |
| InsurancePool | `0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57) |
| TradeAttestation | `0x892872eF9490683604EE53B90c5c21e1B4E6eeda` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x892872eF9490683604EE53B90c5c21e1B4E6eeda) |
| MockYieldVault | `0x5c16FeF4d883A489525469e5f61B222328022fE1` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x5c16FeF4d883A489525469e5f61B222328022fE1) |

**Network:** 0G Galileo Testnet, chain ID `16602`, RPC `https://evmrpc-testnet.0g.ai`.

**Note on mainnet:** The submission rule requires a "0G mainnet contract address." If the hackathon strictly enforces mainnet-only, the contracts must be re-deployed to 0G mainnet before submission. Mainnet RPC + chain ID need to be confirmed from 0G docs. If the rule accepts testnet for the hackathon period (common for Track 2 trading-arena projects), the Galileo addresses above are sufficient.

## On-chain activity proof

### Live strategies on Galileo

| tokenId | Archetype | Status | Trades | L1 hash encoding |
|---|---|---|---|---|
| #1 | Bold / Momentum | Active | 10 | Legacy (stringified oid) |
| #2 | Patient / Mean-Reversion | Active | 10 | Legacy (stringified oid) |
| #3 | Sharp / Microstructure | Active | 10 | Legacy (stringified oid) |
| #4 | Stoic / Grid | Settled (idle) | n/a | n/a |
| #5 | Bold / Momentum | Active | 10 | **Real Hyperliquid L1 tx hash** |
| #6 | Patient / Mean-Reversion | Active | 10 | **Real Hyperliquid L1 tx hash** |
| #7 | Sharp / Microstructure | Active | 10 | **Real Hyperliquid L1 tx hash** |
| #8 | Stoic / Grid | **Breached** | 11 | **Real Hyperliquid L1 tx hash** |

### Sample anchored breach

`markBreach(8)` tx **`0x35160a80728b53a156cb923329b70b758362977f01de32e08332d93aa44991aa`** on InsurancePool `0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57` — strategy #8 flipped to status `Breached` on Galileo. The breach is fronted at [orichalcos.vercel.app/strategies/breached](https://orichalcos.vercel.app/strategies/breached) (slug resolver picks the highest-tokenId match → #8).

### Sample TradeRecorded events on `TradeAttestation` (`0x892872eF9490683604EE53B90c5c21e1B4E6eeda`)

Each row below is the live `Trade` struct read via `getTradeAt(tokenId, tradeIdx)` against the deployed contract on Galileo. Field order: `(tokenId, oid, chatId, storageRoot, hyperliquidTxHash, pnlDelta, equityAfter, timestamp)`.

**Strategy #5, trade 0 (first fill — Bold / Momentum):**
```
tokenId           5
oid               5
chatId            0xcc3ffe5f013db15516d837e2feb4d8a6d877db915ec28ad789797457e6d8f7b1
storageRoot       0x517e84332c22d5c093c79ccf9e4002a682110cae9b991e09462b41eb321cc369
hyperliquidTxHash 0x792f1c724e2bed447aa80421d6ea270107003457e92f0c161cf7c7c50d2fc72f
pnlDelta          +0.015 USDC (15000000, 8-decimal scale)
equityAfter       1015000000  (1.015 USDC nominal in seeded curve)
timestamp         1778870460
```
- Hyperliquid testnet verification: [app.hyperliquid-testnet.xyz/explorer/tx/0x792f1c724e2bed447aa80421d6ea270107003457e92f0c161cf7c7c50d2fc72f](https://app.hyperliquid-testnet.xyz/explorer/tx/0x792f1c724e2bed447aa80421d6ea270107003457e92f0c161cf7c7c50d2fc72f) — renders the per-fill order on the testnet L1 explorer.
- Contract page: [chainscan-galileo.0g.ai/address/0x892872eF9490683604EE53B90c5c21e1B4E6eeda](https://chainscan-galileo.0g.ai/address/0x892872eF9490683604EE53B90c5c21e1B4E6eeda)

**Strategy #8, trade 0 (first fill — Stoic / Grid, the breached strategy):**
```
tokenId           8
oid               8
chatId            0x30922edb3357fe5fc8cb94b50b6b30de91f82383db63cd608bee8b90b54ea8c1
storageRoot       0x807a36790e5a34d8aae893914d7a8b005279cac7fe6cb9e598c192baad4c9348
hyperliquidTxHash 0x709b7e8e2b6061ba72150421d6fe57010b009673c663808c146429e0ea643ba5
pnlDelta          -0.022 USDC
equityAfter       978000000
timestamp         1778871053
```
- Hyperliquid testnet verification: [app.hyperliquid-testnet.xyz/explorer/tx/0x709b7e8e2b6061ba72150421d6fe57010b009673c663808c146429e0ea643ba5](https://app.hyperliquid-testnet.xyz/explorer/tx/0x709b7e8e2b6061ba72150421d6fe57010b009673c663808c146429e0ea643ba5)

**Strategy #8, trade 10 (breach-anchor fill — the trade that crossed the drawdown threshold):**
```
tokenId           8
oid               8
chatId            0x89ffa15212c0e70024cf0d9eccbc687f13e7ebbb0b6bee7e6d2b8c11930a8874
storageRoot       0x1959ac73b7048910159a088352402a045e58915062d2d19efebdfc6854ec002e
hyperliquidTxHash 0xdeb8aa2fcb2eee5cdc63008fe249f0aee2ad7384dae83c84d301d2fbad56ee5f
pnlDelta          0
equityAfter       790000000  (~21% drawdown vs. 1.0 USDC nominal — past the 15% threshold)
timestamp         1778871241
```
- Hyperliquid testnet verification: [app.hyperliquid-testnet.xyz/explorer/tx/0xdeb8aa2fcb2eee5cdc63008fe249f0aee2ad7384dae83c84d301d2fbad56ee5f](https://app.hyperliquid-testnet.xyz/explorer/tx/0xdeb8aa2fcb2eee5cdc63008fe249f0aee2ad7384dae83c84d301d2fbad56ee5f)

### Full agent ledger on Hyperliquid testnet

Trader wallet: **`0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d`** — every fill on strategies #5–#8 is independently verifiable at [app.hyperliquid-testnet.xyz/explorer/address/0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d](https://app.hyperliquid-testnet.xyz/explorer/address/0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d).

## 0G components used

### 0G Compute TEE
- **What:** Strategy weights are encrypted at rest. Inference happens only inside Intel TDX + H100 inside 0G Compute. Every inference returns a signed `chatId`.
- **Where used:** Every recorded trade carries the `chatId` in the on-chain `Trade` struct (see `contracts/src/v3/TradeAttestation.sol`).
- **Proof:** Any trade row in the redesigned `TradeModal` exposes the chatId; the strategy detail page at `/strategies/settled` or `/strategies/breached` opens this modal on row click.

### 0G Storage
- **What:** The full reasoning bundle for each trade (prompt, response, TEE signature) is content-addressed and pinned to 0G Storage. The on-chain attestation carries only the merkle root.
- **Where used:** `storageRoot` field on every `Trade` struct.
- **Proof:** TradeModal links to the 0G chainscan address page for the storage root.

### 0G Chain (Galileo)
- **What:** All five contracts deployed on 0G Chain. Bond escrow, policy registry, breach threshold, permissionless settlement — all executed on-chain.
- **Where used:** The entire on-chain protocol surface.
- **Proof:** 50 / 50 Foundry tests passing (47 v3 + 3 MockYieldVault); live frontend at `orichalcos.vercel.app` reads state from the deployed contracts via wagmi/viem.

### Privacy / secure execution
- **What:** Sealed Inference + TEE-based execution mitigates front-running. Other allocators cannot see the alpha they're betting against.
- **Where used:** Strategy weights never leave the TEE; only signed fills emerge. The bond mechanism is the economic enforcement layer.

## Hyperliquid testnet integration (load-bearing dependency)

- Trader wallet on Hyperliquid testnet: **`0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d`** — full ledger at [app.hyperliquid-testnet.xyz/explorer/address/0x438FD476...](https://app.hyperliquid-testnet.xyz/explorer/address/0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d).
- **Real per-fill L1 verification on strategies #5–#8:** each on-chain `Trade` carries the actual Hyperliquid testnet transaction hash in the `hyperliquidTxHash` field. One bytes32 on 0G → one order page on the Hyperliquid testnet L1 explorer. Sample resolved above for strategies #5 and #8.
- **Legacy encoding on strategies #1–#3:** these earlier seeded strategies stuffed the Hyperliquid order id (oid) into the `hyperliquidTxHash` field as a stringified bytes32. They demonstrate the attestation pipe; the L1-hash encoding on #5–#8 is the production-shape proof.
- **Strategies #5–#8 (40 fills total)** all carry real testnet tx hashes, queryable via `cast call $TRADE_ATTESTATION "getTradeAt(uint256,uint256)((uint256,uint256,bytes32,bytes32,bytes32,int256,uint256,uint256))" $tokenId $tradeIdx --rpc-url https://evmrpc-testnet.0g.ai`.

---

**Last verified:** 2026-05-16, 0G Galileo block ≥ 33499839.
