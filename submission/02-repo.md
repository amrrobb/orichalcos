# 2. Code Repository

**GitHub URL:** *to be filled in by user before submission — push the working branch to a public repo first.*

> Working branch: `feat/v3-insurance-market` in the local repo at `/Users/ammar.robb/Documents/Web3/hackathons/hackquest-0g`.
> Push the branch (or main with the latest squashed history) to a public github.com/<user>/orichalcos repo. If the repo is private at submission time, share with the hackathon judges (HackQuest provides a judge handle list).

**Substantial development progress** — verified by:
- 50 / 50 Foundry tests passing across contract suites — 47 v3 + 3 MockYieldVault (`forge test --match-path contracts/test/v3/`)
- Full v3 redeploy on Galileo this submission cycle (5 contracts: MockUSDC, StrategyINFT, InsurancePool, TradeAttestation, MockYieldVault)
- Redesigned dashboard live on Vercel (`https://orichalcos.vercel.app`)
- Demo seeded with 40 real Hyperliquid testnet fills attested on chain

**Branch state at submission:**
- 8 dashboard routes implemented under `dashboard/src/app/`
- 5 v3 contracts under `contracts/src/v3/` (`MockUSDC`, `StrategyINFT`, `InsurancePool`, `TradeAttestation`, `MockYieldVault`)
- Agent runtime + seed scripts under `agent/src/v3/`
- Pitch deck at `docs/pitch-deck.html`
- Demo script at `docs/DEMO-SCRIPT.md`

**Pre-submission action:**
```bash
git push origin feat/v3-insurance-market
# or rebase + push to main if you prefer
gh repo create orichalcos --public --source=. --remote=origin --push   # if not yet on GitHub
```
