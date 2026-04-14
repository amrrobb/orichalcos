# 0G APAC Hackathon — Status Summary
*Last updated: April 15, 2026*

## Two Projects Submitted

### 1. Orichalcos — TEE-Sealed Autonomous Trading Agent
**Repo:** https://github.com/amrrobb/orichalcos
**Track:** Agentic Trading Arena (Verifiable Finance)

| Component | Status | Details |
|-----------|--------|---------|
| Smart Contracts | DEPLOYED | 5 contracts on 0G Galileo, 16/16 tests |
| Agent Service | WORKING | Real TEE inference (Qwen 2.5 7B), autonomous trading loop |
| 0G Storage | WORKING | Attestation proofs stored, Merkle roots on-chain |
| INFT (ERC-7857) | WORKING | Agent minted as INFT, data hashes updated |
| Dashboard | BUILT | Next.js, vault stats, trade history, attestation viewer, INFT page |
| MEV Simulation | CODE DONE | Side-by-side runner built, not fully demo-tested |
| 0G Components | 4 | Chain + Compute/TEE + Storage + INFT |

**On-chain evidence:**
- 6 trades executed with TEE attestations
- Multiple INFTs minted
- Explorer: https://chainscan-galileo.0g.ai/address/0xdaaa0a7b450198b5111a579864504e083f92b198

### 2. 0Geass — Private Autonomous DAO Governance Agent
**Repo:** https://github.com/amrrobb/0geass
**Track:** Privacy & Sovereign Infrastructure

| Component | Status | Details |
|-----------|--------|---------|
| Smart Contracts | DEPLOYED | 2 contracts on 0G Galileo, 11/11 tests |
| Agent Service | WORKING | Real TEE inference, commit-reveal voting, auto-reveal |
| 0G Storage | WORKING | Encrypted reasoning stored with Merkle roots |
| Dashboard | NOT BUILT | No frontend — agent-only for now |
| 0G Components | 3 | Chain + Compute/TEE + Storage |

**On-chain evidence:**
- 5 proposals created
- 2 proposals voted on with TEE-verified reasoning
- Commit hashes on-chain, reasoning on 0G Storage
- Explorer: https://chainscan-galileo.0g.ai/address/0x05E8e5b32a22ACE9696d432125Bf96a4C64f699b

## Wallet
- Address: `0x77C037fbF42e85dB1487B390b08f58C00f438812`
- Balance: ~7.03 OG remaining
- 0G Compute ledger: active with provider funded

## What's Left To Do

### High Priority (before submission May 9)
- [ ] Test Orichalcos dashboard live in browser — verify data loads correctly
- [ ] Run MEV simulation end-to-end and verify PnL chart works
- [ ] Record demo video for Orichalcos (2-3 min)
- [ ] Build 0Geass dashboard (governance proposals + bribery demo)
- [ ] Record demo video for 0Geass (2-3 min)
- [ ] Verify contracts on 0G explorer (source verification)

### Medium Priority
- [ ] Switch 0Geass to MOCK_COMPUTE=false permanently (uses shared 0G Compute ledger)
- [ ] Add more proposals to 0Geass and run full commit-reveal-tally cycle
- [ ] Deploy Orichalcos dashboard to Coolify/VPS for live demo URL
- [ ] Deploy 0Geass dashboard to Coolify/VPS

### Nice To Have
- [ ] Add INFT to 0Geass (agent-as-NFT for 4th component)
- [ ] Better prompt engineering for governance reasoning
- [ ] Polish Orichalcos dashboard design
- [ ] GitHub Actions CI for both repos

## Checkpoint Submitted
- Submitted April 15 via Google Form
- Project: Orichalcos
- Status: 10-50% (honest assessment)
- Demo URL: https://github.com/amrrobb/orichalcos
