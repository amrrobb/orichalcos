# X / Twitter post drafts — Orichalcos

Pick one. Required by hackathon rules: must include project name, demo screenshot or short clip, hashtags `#0GHackathon #BuildOn0G`, tags `@0G_labs @0g_CN @0g_Eco @HackQuest_`.

**Attach a screenshot:** `localhost:3000/protocol` (live mainnet grid) or a `chainscan.0g.ai/address/0x443e…56db` page showing the deployed StrategyINFT contract.

---

## Draft A — recommended (single post, mainnet-first, proof-anchored)

> Built Orichalcos on @0G_labs — a promise-kept market for AI trading agents.
>
> Live on 0G mainnet today:
> ✓ Trader bonds against a free-text drawdown promise
> ✓ Promise sealed inside 0G Compute TEE (Qwen 2.5 VL 72B)
> ✓ Challenger stakes; bond pays on breach, splits 60/40 on kept promise
> ✓ Settlement permissionless on chain
>
> 4 of 5 0G components, end-to-end on Aristotle (chainId 16661).
>
> orichalcos.vercel.app
>
> #0GHackathon #BuildOn0G @0g_CN @0g_Eco @HackQuest_

Length: ~430 chars (fits inside 480 cap for X premium). For a strict 280-char limit, drop the last two bullets.

---

## Draft B — short version (280-char compatible)

> Built Orichalcos on @0G_labs — a promise-kept market for AI traders.
>
> Live on 0G mainnet: traders bond a promise sealed in 0G Compute TEE, challengers stake against it, settlement is permissionless on chain.
>
> 4 of 5 0G components wired.
>
> orichalcos.vercel.app
>
> #0GHackathon #BuildOn0G @0g_CN @0g_Eco @HackQuest_

Length: ~290 chars.

---

## Draft C — narrative thread (3 tweets, recommended if you want depth)

**Tweet 1 of 3 — the problem**
> The AI-trading-agent economy has one structural problem: reveal the strategy, alpha decays. Hide it, nobody can verify the track record.
>
> Meet Orichalcos — built on @0G_labs mainnet to fix both halves.
>
> #0GHackathon #BuildOn0G

**Tweet 2 of 3 — what we built**
> A trader bonds USDC against a free-text drawdown promise. The promise is sealed inside 0G Compute TEE (Qwen 2.5 VL 72B, Intel TDX + H100), encrypted onto 0G Storage, committed to an ERC-7857 INFT on 0G Chain.
>
> Trades fill on Hyperliquid; every fill is attested on chain.
>
> @0G_labs

**Tweet 3 of 3 — the wager**
> Challengers stake against the promise. Trader keeps it → stake splits 60/40 to trader and LP. Trader breaks it → bond pays the challenger. Settlement is permissionless: any wallet, any time.
>
> Live on 0G mainnet → orichalcos.vercel.app
>
> @0g_CN @0g_Eco @HackQuest_

---

## Optional follow-up reply (after posting the main draft, before submission video is ready)

> StrategyINFT contract on 0G Aristotle mainnet (chainId 16661):
> chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db
>
> Every wager carries a real 0G Compute TEE chatId and a real 0G Storage merkle root, both queryable on chain. 4 of 5 0G components, end-to-end.

## Optional follow-up reply (after submission video is up)

> Full walkthrough — 3-min demo of the mint → stake → settle flow on 0G mainnet:
> [YouTube URL]
>
> Includes the trader-mint UI, the dual-outcome stake screen, and the on-chain settle proof.

---

## Recording the clip (if you go video instead of screenshot)

10-second loop showing:
1. Open `localhost:3000/protocol` (mainnet grid of wagers)
2. Click "Open a wager" in the header → `/wagers/new`
3. Highlight the free-text promise textarea
4. Cut to chainscan.0g.ai showing the StrategyINFT contract page

Export as MP4 H.264, < 5 MB so Twitter's video pipeline accepts it cleanly.

## Post-submission

After posting, paste the X URL into the HackQuest submission form's "Project X Post Link" field.
