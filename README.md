# Orichalcos

> *Trainers, not depositors. Apprentices, not vaults.*

Orichalcos is a verifiable AI trading agent protocol — a cryptographic alternative to the unverifiable crypto signal economy. Built on 0G for the **0G APAC Hackathon** (May 2026).

**Live demo (Galileo testnet):** *deploy URL pending Vercel rollout — runs locally via `dashboard/`*

## The Problem

Crypto signal sellers operate a multi-billion-dollar subscription economy where trading calls cannot be cryptographically verified. The Swiss Finance Institute's 2023 study of 29,000+ financial influencers found that **56% produce −2.3% monthly abnormal returns for followers** — yet attract more followers than the 28% who are genuinely skilled. FINRA's 2024 survey found **69% of finfluencer followers targeted by fraud lose money**, vs. 26% of non-followers. The FBI logged **$11.3B in U.S. crypto fraud losses in 2025**.

The cause is structural: signals can be edited, deleted, back-dated, or rebranded after they're proven wrong. Sellers blame subscribers for "entering late" or "not managing risk." Reputations are reset by burning a Discord and starting fresh.

## The Solution

Orichalcos uses 0G's full stack to make this impossible:

- **0G Compute (Sealed Inference / TEE):** Every signal is sealed inside a hardware enclave (Intel TDX + H100) before publication. The TEE-signed attestation proves the call was sealed *before* the market moved.
- **0G Storage:** The reasoning ("public tell") is content-addressed. Editing the past rewrites the hash. Deletion is impossible without abandoning the entire reputation.
- **0G Chain:** All duels, ELO, and Title progression are immutable on-chain.
- **ERC-7857 INFT:** The Apprentice is a transferable AI agent. The track record is bound to the token. Burning the identity means walking away from years of accumulated reputation.

## The Game

Trainers raise **Apprentices** — AI agents represented as ERC-7857 INFTs. Each Apprentice has a Type (**Bold**, **Patient**, **Sharp**, **Stoic**) and progresses through Titles (Initiate → Apprentice → Adept → Master → Sage) by winning **Trials**. A Trial is a **Scrying Duel**: a 60-180s binary direction prediction on a Pyth-fed asset price, settled by the oracle, with both Apprentices' calls cryptographically sealed before the price moves.

**Champions** are NPC bosses, one per Type — **Agni** (Bold/fire), **Tirta** (Patient/water), **Bayu** (Sharp/wind), **Pertiwi** (Stoic/earth) — Sanskrit/Indonesian elemental names rooted in Javanese cultural heritage. Built solo in Yogyakarta, Indonesia.

## Architecture

```
                             ┌──────────────┐
                             │   Frontend    │
                             │   Next.js 16  │
                             │  Vercel/local │
                             └──────┬───────┘
                                    │ wagmi reads + /api/tell
            ┌───────────────────────┼─────────────────────────┐
            │                       │                         │
            ▼                       ▼                         ▼
    ┌──────────────┐       ┌──────────────┐         ┌──────────────────┐
    │   0G Chain    │      │   Agent       │         │   0G Storage      │
    │   (Galileo    │      │   Runner      │         │   (encrypted     │
    │   testnet)    │      │   Node + tsx  │         │    soul blobs +   │
    │               │      │               │         │    public tells) │
    │  4 contracts  │      │  TEE attested │         │                   │
    │  ApprINFT     │      │  Champion     │         │                   │
    │  Codex        │◀─────│  duel runner  │────────▶│                   │
    │  ScryingDuel  │      │               │         │                   │
    │  MockPyth     │      └──────┬───────┘         └──────────────────┘
    └──────────────┘              │
                                  ▼
                         ┌──────────────────┐
                         │   0G Compute     │
                         │   (TEE provider) │
                         │   Qwen 2.5 7B    │
                         │   Intel TDX+H100 │
                         └──────────────────┘
```

## 0G Components Used (4 of 5)

| Component | Role |
|---|---|
| 0G Chain | All 4 contracts deployed on Galileo testnet |
| 0G Compute (TEE) | Real-time TEE-attested AI inference for every duel — Qwen 2.5 7B inside Intel TDX |
| 0G Storage | Encrypted sealed souls + content-addressed public tells |
| INFT (ERC-7857) | Apprentices as transferable AI agents with bound reputation |

(0G DA was intentionally dropped — running a DA Client+Encoder node was infeasible in 7 days. 0G Storage merkle roots committed on-chain serve as the data-availability narrative substitute.)

## Deployments

**Galileo Testnet (chainId 16602):**

| Contract | Address |
|---|---|
| ApprenticeINFT | [`0x7fb2a815fa88c2096960999ec8371bccdf147874`](https://chainscan-galileo.0g.ai/address/0x7fb2a815fa88c2096960999ec8371bccdf147874) |
| Codex | [`0x24b1ca69816247ef9666277714fada8b1f2d901e`](https://chainscan-galileo.0g.ai/address/0x24b1ca69816247ef9666277714fada8b1f2d901e) |
| ScryingDuel | [`0x74078bc45e3e208beb4b74522ab193dcf071d93f`](https://chainscan-galileo.0g.ai/address/0x74078bc45e3e208beb4b74522ab193dcf071d93f) |
| MockPyth | [`0xc2cc2835219a55a27c5184eaacd9b8fccef00f85`](https://chainscan-galileo.0g.ai/address/0xc2cc2835219a55a27c5184eaacd9b8fccef00f85) |

Champion roster (live on chain):

| Champion | Type | Token | Sealed soul root |
|---|---|---|---|
| Agni | Bold | 1 | `0xf509…22ae2` |
| Tirta | Patient | 2 | `0x81f9…58062` |
| Bayu | Sharp | 3 | `0xa11e…d01cc` |
| Pertiwi | Stoic | 4 | `0xafde…4c c60` |

**10 autonomous Champion-vs-Champion duels** have run end-to-end on Galileo, all with TEE-valid attestations. Browse the duel records in [`agent/data/duels/`](./agent/data/duels/) or live on the dashboard.

## Quickstart

```bash
git clone https://github.com/amrrobb/orichalcos
cd orichalcos
git checkout feat/scrying-duel-v2

# 1. Run the contract test suite (71/71 passing)
cd contracts
forge test

# 2. Run the dashboard against the deployed Galileo contracts
cd ../dashboard
npm install --legacy-peer-deps
cp .env.local.example .env.local        # defaults already point at Galileo
npm run dev                              # http://localhost:3000

# 3. (Optional) Run the agent runner — produces new Champion duels
cd ../agent
cp .env.example .env                     # add your PRIVATE_KEY
npm install
node_modules/.bin/tsx src/duel/run-champion-duel.ts Agni Tirta
```

## Reviewer Notes

- **Faucet:** [https://faucet.0g.ai](https://faucet.0g.ai) — request testnet OG, no signup
- **Explorer:** [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) — all contract addresses + tx hashes verifiable
- **Live demo:** local at `localhost:3000` (Vercel deploy pending). The landing page shows the live duel feed, click any duel → DuelStage → "Replay Mind Reveal" plays the 5-frame TEE-attestation reveal animation.
- **Verifiable Tier-2-real proof:** every Champion's encrypted soul is on 0G Storage. The agent runner's `mint-champions.ts` encrypts with AES-256-GCM (HKDF-derived per-Apprentice key from `SOUL_KEY_SEED`), uploads to 0G Storage, and commits the merkle root on-chain in `ApprenticeINFT.sealedSoulRoot`.

## Honest Scope

Orichalcos is a **paper-trading prediction protocol**, not a real trading platform. We don't execute trades on a DEX, custody user funds, or run a managed fund. Apprentices place binary direction calls on Pyth price feeds; the oracle settles. The "verifiable signal" thesis is real; the trading mechanics are intentional paper-mode.

The **Sealed Soul implementation is Tier 2-real**: encrypted blobs in 0G Storage, decryption inside the TEE during inference (verifiable via attestation chain), with the symmetric key held by the agent runner's environment. **Roadmap v2** moves key custody fully into a TEE-only key derivation flow with re-encryption oracle on transfer per the full ERC-7857 spec.

The **demo path is intentionally narrow**: landing → Champion roster → DuelStage → Mind Reveal. Mint flow, marketplace, and full Codex pagination are out of v2 scope. See [`docs/plans/2026-05-10-001-feat-orichalcos-v2-frontend-plan.md`](./docs/plans/2026-05-10-001-feat-orichalcos-v2-frontend-plan.md) for the explicit cut order.

## Documents

- [HANDOFF.md](./HANDOFF.md) — strategic project spec (5-layer problem statement, decision log, 7-day plan)
- [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) — Tempered Codex palette, Editorial Codex typography, Quincunx Sigil mark, Mind Reveal animation spec
- [docs/USER_FLOW.md](./docs/USER_FLOW.md) — six personas, click-by-click behavior
- [docs/SYSTEM_ARCHITECTURE.md](./docs/SYSTEM_ARCHITECTURE.md) — service boundaries, end-to-end duel sequence
- [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) — file tree, naming conventions
- [docs/plans/](./docs/plans/) — implementation plans (v2 frontend plan is the latest)

## Built By

[Ammar / amrrobb](https://github.com/amrrobb), solo, Yogyakarta, Indonesia.

## License

MIT
