# Orichalcos — Pre-Record Checklist

**Use this 30 minutes before you turn on the camera.** Each section confirms one moment of the demo will actually work.

## Hardware / environment

- [ ] Mac on AC power, not battery (no thermal throttling mid-record)
- [ ] Display set to 1920×1080 logical resolution (System Settings → Displays)
- [ ] Browser zoom = 100% (`⌘0` in Chrome / Brave)
- [ ] Notifications muted (Do Not Disturb on, Slack/Discord quit)
- [ ] Bookmarks bar hidden (`⌘⇧B` to toggle)
- [ ] Other browser tabs closed — only the demo tabs
- [ ] Mic level checked on a 5-second test clip; clipping ruled out

## Wallet (Galileo testnet)

- [ ] Wallet (MetaMask / Rabby / etc.) showing the demo allocator address (one with no preconceptions about Orichalcos)
- [ ] Galileo testnet selected (chain ID `16602`, RPC `https://evmrpc-testnet.0g.ai`)
- [ ] Wallet has > 0.5 0G for gas (~5 txs worth)
- [ ] Wallet has > 1000 USDC for the buy-coverage flow → if not, **click the "Get test USDC" button in the header** after connect

## Live URL pre-warm

Open each tab in order, leave them queued behind tab 1:

1. `https://orichalcos.vercel.app/`
2. `https://orichalcos.vercel.app/strategies/settled`
3. `https://orichalcos.vercel.app/strategies/breached`
4. `https://orichalcos.vercel.app/strategies/breached/insure`
5. `https://orichalcos.vercel.app/protocol`
6. `https://app.hyperliquid-testnet.xyz/explorer/address/0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d` *(or the per-trade hash URL once the real-hash worker lands)*

For each: wait until fully rendered (animations played, equity curve drawn, hydration done), then leave in place. **No fresh hydration during the record** — judges shouldn't see loading states.

## Content checks before record

- [ ] Onboarding modal: visible on the very first `/` load (clear `localStorage.orichalcos_onboarded` if you've already dismissed it: DevTools → Application → Local Storage → delete key)
- [ ] `/strategies/settled` resolves to a strategy with the equity curve climbing (Bold momentum scalper or similar)
- [ ] `/strategies/breached` shows the slim ochre breach-rule strip at the top
- [ ] `/strategies/breached` chart: red marker on the trade where equity crossed the dashed threshold
- [ ] `/strategies/breached/insure` slider works, dual-outcome cards update, premium pill flashes brass
- [ ] Click any trade row on `/strategies/breached` — TradeModal opens, contains 0G TEE chatId, 0G Storage merkle root, Hyperliquid link
- [ ] Hyperliquid link from TradeModal — clicking it opens Hyperliquid testnet explorer and **shows fills** (not a blank table)
- [ ] `/protocol` strategy cards read **"Won't drop more than 20% over the next …"** (promise-first framing) with the **"Buy claim on breach →"** CTA — no "Get Protected Exposure" copy anywhere
- [ ] `/protocol` LP panel does **not** show an "Idle Yield (Demo)" section — that was hidden; the panel ends at the Approve & Deposit row
- [ ] Live A/B/C scenarios still resolvable on chainscan: paste `0x037c19ac6c14591ba61885dfd59b584565a31344682dbe084660f71a5a001d0a` (Scenario A settle, 60/40 split) and `0x1eb35bfe372bcd23ca131ad0bad0d29c9faa7dcbe7fa8211d6a9777fcb6df67f` (Scenario B breach payout) into chainscan-galileo.0g.ai — both should show status: Success with the corresponding events decoded

## Last-mile fixes

If any item above fails:

- **Onboarding modal doesn't appear** — clear localStorage as above
- **Breach state doesn't show** — strategy may not be marked breached; call `markBreach(tokenId)` via cast: `cast send 0x782CBD5313E3b99d9C94e4f5197B81a432cdE621 "markBreach(uint256)" <id> --rpc-url https://evmrpc-testnet.0g.ai --private-key $PK`
- **Hyperliquid explorer empty** — check the URL targets the wallet `0x438FD476…2d5d` (the agent's HL wallet), not the 0G TradeAttestation contract `0x892872…6eeda`
- **Wallet has no USDC** — header faucet button calls `MockUSDC.mint(addr, 10000e6)` directly; if button missing or broken, run `cast send 0x1E68D8D7aE5EcF59Ba2960111Dd67F0900c876a7 "mint(address,uint256)" <yourAddr> 10000000000 --rpc-url https://evmrpc-testnet.0g.ai --private-key $PK`

## Recording software

- [ ] OBS / QuickTime / loom set to 1080p60
- [ ] Audio source = system mic, not internal (avoid system sound bleed)
- [ ] Output container = MP4, codec H.264, bitrate ~10 Mbps
- [ ] Target file size < 150 MB (3 min at 10 Mbps = ~225 MB; tune down to 8 Mbps if budget tight, or shorten record passes)

## Demo flow reference

The full shot-by-shot script with timings + narration is in `docs/DEMO-SCRIPT.md`. Print or open it on a second screen.

## After record

- [ ] Cut any dead air > 0.5 seconds
- [ ] Add a 1-second brass-on-black title card: "Orichalcos / 0G APAC / Track 2"
- [ ] Add a 1-second end card: repo URL + live URL + 0G chain id 16602
- [ ] Upload to YouTube as **unlisted**
- [ ] Paste video URL into 0G hackathon submission form
- [ ] Submit before deadline (May 16 23:59 local — check the official timezone)
