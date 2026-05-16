# X / Twitter post drafts — Orichalcos

Pick one. Required by hackathon rules: must include project name, demo screenshot or short clip, hashtags `#0GHackathon #BuildOn0G`, tags `@0G_labs @0g_CN @0g_Eco @HackQuest_`.

**Attach a screenshot:** `localhost:3000/protocol` (live mainnet grid) or `chainscan.0g.ai/address/0x443e…56db` showing the deployed StrategyINFT contract.

---

## Draft C — RECOMMENDED for free-tier X (no premium needed)

253 chars (27 headroom under 280). All 4 required tags. Both hashtags. Project name + mainnet evidence + URL. Post now, paste URL into HackQuest, reply with the video demo when ready.

```
Orichalcos — a promise-kept market for AI traders. Live on 0G mainnet.

Trader bonds a promise sealed in 0G TEE. Challenger stakes against it. Permissionless settlement.

orichalcos.vercel.app

#0GHackathon #BuildOn0G @0G_labs @0g_CN @0g_Eco @HackQuest_
```

**Attach:** screenshot of `localhost:3000/protocol` showing the live mainnet wager grid (or let X auto-render the link preview from the `orichalcos.vercel.app` URL — that also satisfies the screenshot rule).

### Follow-up reply (paste under your post once video is uploaded)

```
Full 3-min demo of the trader mint → challenger stake → on-chain settle flow on 0G mainnet:

[YouTube URL]
```

### Why this works

- HackQuest "Project X Post Link" gets the URL of the **original** post (the one with all tags). That URL stays stable.
- Video is reachable via the thread reply — no edit needed.
- All mandatory elements (project name, screenshot, tags, hashtags) are present in the original post.
- No premium account needed.

---

## Draft A — long version (X premium, 480-char cap)

~430 chars. Use if you have X premium and want to lead with proof bullets.

```
Built Orichalcos on @0G_labs — a promise-kept market for AI trading agents.

Live on 0G mainnet today:
✓ Trader bonds against a free-text drawdown promise
✓ Promise sealed inside 0G Compute TEE (Qwen 2.5 VL 72B)
✓ Challenger stakes; bond pays on breach, splits 60/40 on kept promise
✓ Settlement permissionless on chain

4 of 5 0G components, end-to-end on Aristotle (chainId 16661).

orichalcos.vercel.app

#0GHackathon #BuildOn0G @0g_CN @0g_Eco @HackQuest_
```

---

## Draft B — alternative short version

~290 chars (slightly over 280; trim the "4 of 5 components" line if X rejects).

```
Built Orichalcos on @0G_labs — a promise-kept market for AI traders.

Live on 0G mainnet: traders bond a promise sealed in 0G Compute TEE, challengers stake against it, settlement is permissionless on chain.

4 of 5 0G components wired.

orichalcos.vercel.app

#0GHackathon #BuildOn0G @0g_CN @0g_Eco @HackQuest_
```

---

## Draft D — narrative thread (3 tweets, use if you want depth)

**Tweet 1 of 3 — the problem**

```
The AI-trading-agent economy has one structural problem: reveal the strategy, alpha decays. Hide it, nobody can verify the track record.

Meet Orichalcos — built on @0G_labs mainnet to fix both halves.

#0GHackathon #BuildOn0G
```

**Tweet 2 of 3 — what we built**

```
A trader bonds USDC against a free-text drawdown promise. The promise is sealed inside 0G Compute TEE (Qwen 2.5 VL 72B, Intel TDX + H100), encrypted onto 0G Storage, committed to an ERC-7857 INFT on 0G Chain.

Trades fill on Hyperliquid; every fill is attested on chain.

@0G_labs
```

**Tweet 3 of 3 — the wager**

```
Challengers stake against the promise. Trader keeps it → stake splits 60/40 to trader and LP. Trader breaks it → bond pays the challenger. Settlement is permissionless: any wallet, any time.

Live on 0G mainnet → orichalcos.vercel.app

@0g_CN @0g_Eco @HackQuest_
```

---

## Optional standalone reply (after main post, before video is ready)

```
StrategyINFT contract on 0G Aristotle mainnet (chainId 16661):
chainscan.0g.ai/address/0x443eC2B98d9F95Ac3991c4C731c5F4372c5556db

Every wager carries a real 0G Compute TEE chatId and a real 0G Storage merkle root, both queryable on chain. 4 of 5 0G components, end-to-end.
```

## Optional reply (after submission video is up)

```
Full walkthrough — 3-min demo of the mint → stake → settle flow on 0G mainnet:

[YouTube URL]

Includes the trader-mint UI, the dual-outcome stake screen, and the on-chain settle proof.
```

---

## Recording the clip (if you go video instead of screenshot)

10-second loop showing:
1. Open `localhost:3000/protocol` (mainnet grid of wagers)
2. Click "Open a wager" in the header → `/wagers/new`
3. Highlight the free-text promise textarea
4. Cut to `chainscan.0g.ai` showing the StrategyINFT contract page

Export as MP4 H.264, < 5 MB so Twitter's video pipeline accepts it cleanly.

## Post-submission

After posting, paste the X URL into the HackQuest submission form's "Project X Post Link" field.
