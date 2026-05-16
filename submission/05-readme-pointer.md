# 5. README / Documentation

The full README lives at the **repository root**: [`/README.md`](../README.md).

Per hackathon rules, the README must be in English or Chinese (✓ English) and must include:

| Required section | Where in README |
|---|---|
| Project overview | Top — leads with the dilemma + promise-keeping market framing |
| System architecture diagram / technical description | "How it works" + "Architecture" sections |
| Which 0G modules are used | "0G Integration" section — see also `submission/03-0g-integration.md` |
| How those modules support the product | Inline within each role description (Trader / Allocator / LP) + the technical mechanism section |
| Local deployment / reproduction steps | "Setup" / "Run locally" sections |
| Test account details, faucet, reviewer notes | "Demo wallets" + "Get test USDC" instructions |

## Reviewer quick-start

A judge can verify the project in under five minutes:

1. **Open** [orichalcos.vercel.app](https://orichalcos.vercel.app)
2. **Connect** any EVM wallet to 0G Galileo testnet (chain ID `16602`, RPC `https://evmrpc-testnet.0g.ai`)
3. **Click "Get test USDC"** in the header (header faucet button calls `MockUSDC.mint(yourAddr, 10000e6)`)
4. **Open** `/strategies/breached` — see the breach dossier, click any trade row to see TEE + Storage + Hyperliquid provenance
5. **Open** `/strategies/breached/insure` — buy a 500-USDC coverage policy
6. **Open** `/strategies/breached` again — click "Mark Breach" (already breached, but the button arms the settle flow) → "Settle Epoch" → watch the bond pay out to your wallet

## Faucet instructions

- **0G testnet gas:** [0G faucet](https://faucet.0g.ai) (or whichever URL is current — check 0G docs)
- **Test USDC:** in-app button OR direct cast call to MockUSDC at `0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7`: `mint(address,uint256)` is permissionless.
- **Hyperliquid testnet USDC:** [app.hyperliquid-testnet.xyz/drip](https://app.hyperliquid-testnet.xyz/drip) — only needed if the user wants to run the agent themselves; the demo wallet is already funded.
