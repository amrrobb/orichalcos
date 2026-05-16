# 4. Demo Video

**Status:** *To be recorded by user. Full shot-by-shot script: `docs/DEMO-SCRIPT.md`. Pre-record checklist: `docs/PRE-RECORD-CHECKLIST.md`.*

**Constraint:** ≤ 3 minutes. Must show the product's **core functionality**, **user flow**, and **how 0G components are actually used**. Slide-only / concept-only videos disqualify.

## What the recording must include (per hackathon rules)

1. **Core functionality.** The live web app at `orichalcos.vercel.app`. Real on-chain interactions:
   - Browse strategies on `/protocol`
   - Inspect a healthy strategy dossier at `/strategies/settled`
   - Inspect the breach demo at `/strategies/breached`
   - Click a trade row → see TEE chatId, 0G Storage root, Hyperliquid tx hash
   - Buy a coverage policy at `/strategies/breached/insure` (real on-chain tx)
   - (Bonus) MockYieldVault deposit on `/protocol` LP panel

2. **User flow.** Two-step approve → buyPolicy from a fresh allocator wallet. Show the two MetaMask popups, two confirmations, and the resulting UI feedback.

3. **0G component usage** — narrated explicitly:
   - "Strategy weights run sealed inside 0G's TEE — operator can't read them." (point at the sealed-sigil medallion + TradeModal chatId)
   - "Reasoning bundles are pinned to 0G Storage; the on-chain attestation carries only the merkle root." (point at TradeModal storage-root field)
   - "All settlement happens on 0G Chain. Permissionless. No oracle, no admin." (point at the breach-rule + Settle Epoch button)

## Target output

- Format: MP4, H.264, 1920×1080 @ 60fps, ~10 Mbps
- File size: < 150 MB
- Length: 2:55–3:00 (just under the 3-minute hard cap)
- Audio: clean voiceover, no background music (judges hate it)

## Upload destination

Public URL — YouTube **unlisted** is the safest pick:
```
1. Upload to YouTube → set Visibility = Unlisted
2. Copy the share URL
3. Paste into HackQuest submission form's "Demo Video" field
```

Avoid: Google Drive / Dropbox / iCloud links — judges may not be able to authenticate.

## Quick post-record review

- [ ] Camera-roll clean (no random tabs, no notifications popping)
- [ ] Every URL on screen reads `orichalcos.vercel.app/...`
- [ ] At least one moment shows a Hyperliquid testnet explorer page rendering real data
- [ ] At least one on-chain tx hash visible in a 0G chainscan link
- [ ] The phrase "promise-keeping market" said aloud once
- [ ] Track 2 vocabulary appears: "AI-driven perpetual strategy agents," "Sealed Inference," "front-running"
