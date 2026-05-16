# 3. 0G Integration Proof

## Summary — 4 of 5 0G components, wired end-to-end on mainnet

| 0G component | Where it's used in Orichalcos | Mainnet evidence |
|---|---|---|
| **0G Chain (Aristotle, chainId 16661)** | 5 deployed contracts | See mainnet table below |
| **0G INFT (ERC-7857)** | Each wager is a transferable INFT | `StrategyINFT` 0x443e…56db on mainnet |
| **0G Storage** | Encrypted per-wager soul, real merkle root committed to INFT at mint | sealedSoulRoot `0x8c295ccf…` for token #1, `0x157a2a3a…` for token #2 |
| **0G Compute (TEE)** | Real inference call inside Intel TDX + H100 (Qwen 2.5 VL 72B) per mint, verified via `processResponse` | chatId `5740115b-4729-42ee…` (token #1, TEE-valid), chatId `e976a328-b765-450d…` (token #2, TEE-valid) |
| 0G DA | Not used; commitment layer covered by Storage merkle roots | — |

## 0G Chain — mainnet contract deployments

| Contract | Mainnet address (chainId 16661) | Chainscan |
|---|---|---|
| **MockUSDC** | `0x998Bbb06e6313FE48BD040B4247aeE67bD46fE52` | [view](https://chainscan.0g.ai/address/0x998Bbb06e6313FE48BD040B4247aeE67bD46fE52) |
| **StrategyINFT (ERC-7857)** | `0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db` | [view](https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db) |
| **InsurancePool** | `0xE61Cb4adB78f4aD4D36cf2A262532Ed3Ba9E8941` | [view](https://chainscan.0g.ai/address/0xE61Cb4adB78f4aD4D36cf2A262532Ed3Ba9E8941) |
| **TradeAttestation** | `0x6F677989784Cc214E4Ee02257Fad3fc4374dD383` | [view](https://chainscan.0g.ai/address/0x6F677989784Cc214E4Ee02257Fad3fc4374dD383) |
| **MockYieldVault** | `0xA7289d4f49E01c3aDEb5987091B23c67a0aa2C02` | [view](https://chainscan.0g.ai/address/0xA7289d4f49E01c3aDEb5987091B23c67a0aa2C02) |

**RPC:** `https://evmrpc.0g.ai` · **Explorer:** `https://chainscan.0g.ai` · **Deployer:** `0x1E7EC0af660e34Aa6d5b990D8a6aFB62A3fCf801` · See `/deployments-v3-mainnet.json` for the full wiring map + cross-references.

### First TEE-attested wagers minted on mainnet

| tokenId | archetype | sealedSoulRoot (0G Storage) | chatId (0G Compute) | mint tx |
|---|---|---|---|---|
| **#1** | Sharp / microstructure | `0x8c295ccf1a0df5c994a2398e5b2a18ea939d56404c515fe3dba5050f000815a8` | `5740115b-4729-42ee-b904-64abcbe86578` ✓ TEE-valid | [`0xf5162e30d01f15f4…`](https://chainscan.0g.ai/tx/0xf5162e30d01f15f4f0d8) |
| **#2** | Bold / momentum | `0x157a2a3aa79419de03da9497b6c71b2650f47cc760e21ee0948d4ec1a15dfb06` | `e976a328-b765-450d-bc98-9e7a1baa598b` ✓ TEE-valid | [`0x36382b3dd607f303…`](https://chainscan.0g.ai/tx/0x36382b3dd607f303b330a2b75756be4576739533d52cec59532a191aa790ebd8) · startEpoch [`0x2a02814be42c90e5…`](https://chainscan.0g.ai/tx/0x2a02814be42c90e57852570df813ad7015701316a1365ba9662adab260183fd6) |

Both wagers are queryable via `cast call 0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db "getData(uint256)(...)" 1 --rpc-url https://evmrpc.0g.ai`. The `sealedSoulRoot` field on each wager points to a real encrypted blob on 0G Storage mainnet (`https://indexer-storage-turbo.0g.ai`); the `metadataHash` is `keccak256(chatId || inputHash || outputHash)` of the TEE attestation, binding every wager to its real 0G Compute inference.

## 0G Chain — Galileo testnet (lifecycle demo deployments)

The lifecycle Scenarios A/B/C below were walked on Galileo earlier in the build cycle (Hyperliquid is the execution venue, mainnet vs testnet for the 0G layer doesn't change the lifecycle math). Galileo contracts are also live and queryable.

| Contract | Galileo address | Explorer |
|---|---|---|
| MockUSDC | `0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7) |
| StrategyINFT | `0x782CBD5313E3b99d9C94e4f5197B81a432cdE621` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x782CBD5313E3b99d9C94e4f5197B81a432cdE621) |
| InsurancePool | `0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x0CBCa83b87e063573EC6FF9920fd6BBda1A42e57) |
| TradeAttestation | `0x892872eF9490683604EE53B90c5c21e1B4E6eeda` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x892872eF9490683604EE53B90c5c21e1B4E6eeda) |
| MockYieldVault | `0x5c16FeF4d883A489525469e5f61B222328022fE1` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x5c16FeF4d883A489525469e5f61B222328022fE1) |

## On-chain activity proof

### Full lifecycle scenarios walked on 2026-05-16

Three end-to-end scenarios were executed live on Galileo against the deployed contracts. Every Hyperliquid fill is a real testnet order; every USDC flow is a real on-chain MockUSDC transfer. Driver: `agent/src/v3/demo-scenarios.ts`. Trader: `0x77C0…8812`. Allocator (derived): `0x2CE7…5Ebd`. LP (derived): `0x06C0…cE58`.

#### Scenario A — kept promise (clean settle, 60/40 split) · tokenId 11

| Step | 0G Galileo tx | Note |
|---|---|---|
| mint Sharp | [0xdb92c8051f…](https://chainscan-galileo.0g.ai/tx/0xdb92c8051faa46233434e629d94e0fd651a496342c384ad53ccf7f0c5f9110a2) | archetype=2 |
| startEpoch | [0x1776bc2428…](https://chainscan-galileo.0g.ai/tx/0x1776bc24287a54209639cb6fcd38c4532957a6908469ef0276c49bf9bceb2657) | bond=100, drawdown=20%, dur=600s |
| recordTrade #1 | [0x4f3dafbb2f…](https://chainscan-galileo.0g.ai/tx/0x4f3dafbb2f5e1fd2c62e5bd86abdd8173245b7c879ce61491eb5a8a530b0d1c9) | Δ+5, equity 105 |
| recordTrade #2 | [0x8984549fd6…](https://chainscan-galileo.0g.ai/tx/0x8984549fd6b5e904b19a7448259c693c0ddb6cbf50c9da954e87bc2291e5acf3) | Δ+3, equity 108 |
| recordTrade #3 | [0x782733a500…](https://chainscan-galileo.0g.ai/tx/0x782733a500c0c91f85525f78a48bad4bc33acdba7c2378aa6d1ab9ca2fe608d5) | Δ+4, equity 112 |
| buyPolicy | [0xce20c2b606…](https://chainscan-galileo.0g.ai/tx/0xce20c2b606958ee6f71fb12b7652baf628008435a3a4390d34f70c67e1b194f5) | policyId=3, premium 6.25, maxClaim 50 |
| **settleEpoch** | [0x037c19ac6c…](https://chainscan-galileo.0g.ai/tx/0x037c19ac6c14591ba61885dfd59b584565a31344682dbe084660f71a5a001d0a) | **PolicyExpired: LP=2.50, Trader=3.75** · trader nets +103.75 |

Real Hyperliquid testnet fills (all LONG $12 BTC):
- [0x4bcd344570…](https://app.hyperliquid-testnet.xyz/explorer/tx/0x4bcd344570af4ed04d460421dbcb07010f004c2b0ba26da2ef95df982fa328ba)
- [0x7eefd3e1a8…](https://app.hyperliquid-testnet.xyz/explorer/tx/0x7eefd3e1a862b92880690421dbcba8010600ebc74365d7fa22b87f3467669313)
- [0xdc22a5dce4…](https://app.hyperliquid-testnet.xyz/explorer/tx/0xdc22a5dce4cbe829dd9c0421dbcc1a010200bdc27fcf06fb7feb512fa3cfc214)

#### Scenario B — broken promise (breach, allocator paid from bond) · tokenId 12

| Step | 0G Galileo tx | Note |
|---|---|---|
| mint Stoic | [0x7981516f88…](https://chainscan-galileo.0g.ai/tx/0x7981516f889e6f9b41e892b0b324b8b03cd48507ed62cd9d6d6b2b1775f08dc9) | archetype=3 |
| startEpoch | [0xa3ed807d50…](https://chainscan-galileo.0g.ai/tx/0xa3ed807d50a87d0827cbab3b5b24aa956c3b110d186788359f1dc413c3a8bef4) | bond=100, drawdown=20%, dur=600s |
| recordTrade #1 | [0x33dddaeb87…](https://chainscan-galileo.0g.ai/tx/0x33dddaeb87d2a3a2db8c4a1c793d57519cace3d5f55eb26018e73602da68d706) | Δ+5, equity 105 |
| recordTrade #2 | [0x3c984949f9…](https://chainscan-galileo.0g.ai/tx/0x3c984949f97ef3439facaea13d08f71f44bcbd09ae02f352c54f49b5292ca745) | Δ+5, equity 110 |
| recordTrade #3 | [0xdca00c2477…](https://chainscan-galileo.0g.ai/tx/0xdca00c24773cfd6f90dc86db108b28e2164b05b8f871bdfc04058577fb4dadc4) | Δ−100, equity 10 (below 80 threshold) |
| buyPolicy | [0x19a0ac843a…](https://chainscan-galileo.0g.ai/tx/0x19a0ac843adaa2706fc40688c5a0f34139839fc9674fe7afacb0310cf1958834) | policyId=4 |
| markBreach | [0xc71825181f…](https://chainscan-galileo.0g.ai/tx/0xc71825181f9bbf6dbd717147632feffb61ce878b265307ae38bebdc5b5c46819) | status → Breached(2) |
| **settleEpoch** | [0x1eb35bfe37…](https://chainscan-galileo.0g.ai/tx/0x1eb35bfe372bcd23ca131ad0bad0d29c9faa7dcbe7fa8211d6a9777fcb6df67f) | **EpochSettled: Alloc=50.0, Trader=0** · allocator nets +43.75 |

Real Hyperliquid testnet fills:
- LONG $12: [0x4ce4694435…](https://app.hyperliquid-testnet.xyz/explorer/tx/0x4ce469443531a5bb4e5e0421dbe0130104008129d034c48df0ad1496f4357fa5)
- LONG $12: [0x73c05d425f…](https://app.hyperliquid-testnet.xyz/explorer/tx/0x73c05d425f993e6e753a0421dbe07d0108007527fa9c5d40178908951e9d1859)
- SHORT $25: [0xfc7d1df751…](https://app.hyperliquid-testnet.xyz/explorer/tx/0xfc7d1df7519cd7cefdf60421dbe11001090035dcec9ff6a1a045c94a1090b1b9)

#### Scenario C — LP deposit + withdraw with accrued yield

Fresh LP deposits 1000 USDC, pool grew 1171.25 → 2171.25 USDC. LP burns half shares and pulls 1085.625 USDC back — premium yield from accumulated kept-promise splits (A's 2.50 + earlier).

| Step | 0G Galileo tx |
|---|---|
| approve(pool) | [0xc7ed60d723…](https://chainscan-galileo.0g.ai/tx/0xc7ed60d723f0c16aee2447e8ec3160085b4f15280cb910af4be81ea2a8aa9445) |
| deposit 1000 USDC | [0x1d42c6f0ac…](https://chainscan-galileo.0g.ai/tx/0x1d42c6f0ac928d7f925e600a1998c6793382ab9e2f9e3160a416b17977a91769) |
| withdraw 500 shares → 1085.625 USDC | [0x7ea2f2aaa2…](https://chainscan-galileo.0g.ai/tx/0x7ea2f2aaa242d0ca8efea80e592f291afb5e4217b8944ec132517080d7b18e4b) |

### Earlier seeded strategies on Galileo (still queryable)

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
| #11 | Sharp — Scenario A | Idle (kept-promise settled) | 3 | **Real Hyperliquid L1 tx hash** |
| #12 | Stoic — Scenario B | Idle (breach settled) | 3 | **Real Hyperliquid L1 tx hash** |

### Sample anchored breach (legacy)

`markBreach(8)` tx **`0x35160a80728b53a156cb923329b70b758362977f01de32e08332d93aa44991aa`** on StrategyINFT — strategy #8 flipped to status `Breached` on Galileo. The breach is fronted at [orichalcos.vercel.app/strategies/breached](https://orichalcos.vercel.app/strategies/breached) (slug resolver picks the highest-tokenId match).

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
