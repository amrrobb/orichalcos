# 9. Fundraising Status

> Optional submission section. Discloses funding state for transparency with judges and accelerator-track evaluators.

## Current status

**Bootstrapped. Pre-seed. No external funding.**

- **Team size:** solo builder (single founder / developer)
- **Funding raised to date:** $0 — no angel, no VC, no grant
- **Treasury:** none beyond personal runway
- **Token / equity round:** none planned at submission time
- **Revenue:** none — protocol is testnet-only at submission

## Resources used during the hackathon

- Compute, design, and engineering time — personally absorbed
- 0G Galileo testnet — public testnet, no cost
- Hyperliquid testnet — free testnet faucet for trading capital
- Vercel — free Hobby tier hosting at `orichalcos.vercel.app`
- GitHub — public free tier (`github.com/amrrobb/orichalcos`)
- Foundry, ethers v6, viem, wagmi, framer-motion — all OSS

## What I would do with funding (if asked)

The protocol is a **market design**, not a SaaS to scale. If it advances post-hackathon, the priority order is:

1. **Audit** — InsurancePool and StrategyINFT touch real capital flows. Before any mainnet deployment with real USDC, a third-party security audit is non-negotiable. Estimated cost: $25–50K for the scope (5 contracts, ~1,500 lines).
2. **Liquidity bootstrap** — LPs need capital in the pool before allocators can buy meaningful policies. A small protocol-owned float ($50–250K) seeded as v0 LP would catalyze the market without bridging external token capital.
3. **AI-agent trader partnerships** — Track 2's "AI-driven perpetual strategy agents" thesis only matures when real AI traders bond capital. Outreach + integration support with 2–3 quant-AI teams running on 0G Compute would prove the market-maker side of the design.
4. **Auditor for the agent runtime** — the off-chain TEE attestation flow has its own attack surface (chatId forgery, storage availability). Worth a dedicated review pass.

Nothing in this list is contingent on raising. If post-hackathon momentum justifies it, I'd consider an angel/seed round in the $250K–$750K range. Until then, the protocol stays bootstrapped and open-source.

## Why I'm disclosing this

Some submission forms ask explicitly. Hackathon judges sometimes weigh "could this team execute past the demo?" When the answer is "solo founder, no external money," I'd rather state it clearly than have a judge assume otherwise.

The integration-smoke artifact (`agent/src/v3/integration-smoke.ts`) is the strongest signal that this isn't a one-shot prototype — it's a re-runnable mainnet validation harness. The contract is shippable; the question is just whether the market-design thesis attracts trader and allocator volume in the wild.
