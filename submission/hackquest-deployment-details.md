# HackQuest form — Deployment Details field

**Form settings:**
- Ecosystem Deployed: **0G**
- Testnet/Mainnet: **Mainnet**

Copy everything below the next `---` line and paste into the **Contract address & deployed link** textarea.

---

## 0G Aristotle Mainnet · chainId 16661

- RPC: https://evmrpc.0g.ai
- Explorer: https://chainscan.0g.ai
- Storage indexer: https://indexer-storage-turbo.0g.ai
- Deployer: 0x1E7EC0af660e34Aa6d5b990D8a6aFB62A3fCf801

## Primary contract (StrategyINFT, ERC-7857 INFT)

Address:
0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db

Chainscan:
https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db

## Full deployment (5 contracts, all wired)

**MockUSDC**
0x998Bbb06e6313FE48BD040B4247aeE67bD46fE52
https://chainscan.0g.ai/address/0x998Bbb06e6313FE48BD040B4247aeE67bD46fE52

**StrategyINFT** (ERC-7857)
0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db
https://chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db

**InsurancePool**
0xE61Cb4adB78f4aD4D36cf2A262532Ed3Ba9E8941
https://chainscan.0g.ai/address/0xE61Cb4adB78f4aD4D36cf2A262532Ed3Ba9E8941

**TradeAttestation**
0x6F677989784Cc214E4Ee02257Fad3fc4374dD383
https://chainscan.0g.ai/address/0x6F677989784Cc214E4Ee02257Fad3fc4374dD383

**MockYieldVault**
0xA7289d4f49E01c3aDEb5987091B23c67a0aa2C02
https://chainscan.0g.ai/address/0xA7289d4f49E01c3aDEb5987091B23c67a0aa2C02

## Live evidence of 4-of-5 0G stack integration

**Token #1** (TEE-attested wager):

sealedSoulRoot (real 0G Storage merkle root):
0x8c295ccf1a0df5c994a2398e5b2a18ea939d56404c515fe3dba5050f000815a8

chatId (verified via broker.inference.processResponse): ✓ TEE-valid
5740115b-4729-42ee-b904-64abcbe86578

**Token #2** (TEE-attested wager):

sealedSoulRoot:
0x157a2a3aa79419de03da9497b6c71b2650f47cc760e21ee0948d4ec1a15dfb06

chatId: ✓ TEE-valid
e976a328-b765-450d-bc98-9e7a1baa598b

**Full wiring map (JSON):**
https://github.com/amrrobb/orichalcos/blob/feat/v3-insurance-market/deployments-v3-mainnet.json
