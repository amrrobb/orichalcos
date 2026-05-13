# What to upload to claude.ai

When you start the chat, drag these 8 files into the message box (paperclip icon
in claude.ai works too). Order doesn't matter.

## Required uploads (8 files)

```
[1] WIREFRAMES.md                       ← structural intent
[2] current-styles.css                  ← brand tokens (so Claude matches your aesthetic)
[3] current-landing.html                ← my landing mockup (visual baseline)
[4] current-strategy-detail.html        ← my strategy detail mockup (the page being redesigned)
[5] current-insure.html                 ← my insure mockup
[6] screenshots/1-strategy-detail-breach.png   ← LIVE app, the broken page
[7] screenshots/2-strategy-detail-healthy.png  ← LIVE app, healthy strategy for context
[8] screenshots/3-insure-flow.png              ← LIVE app, the insure flow
```

## Files NOT to upload

- `README.md`        ← internal kit doc, not for Claude
- `PROMPT.md`        ← you paste this AS the message, don't upload as file

## Why these 8 and not more

I deliberately limited this. Claude.ai has context limits and "more files" usually means
"less attention per file." 8 files gives Claude:
- 1 markdown spec (intent)
- 1 CSS file (brand tokens)
- 3 HTML mockups (visual baseline + comparison points)
- 3 screenshots (current live state — proves what's confusing)

Anything more dilutes focus. Anything less leaves Claude guessing.

## If you want to be even tighter (5 files instead of 8)

Drop these from the upload — they're optional context:
- `current-landing.html` (Claude can match style from `current-strategy-detail.html` alone)
- `screenshots/2-strategy-detail-healthy.png` (the breach one is the broken case)
- `current-insure.html` (focus the first conversation on strategy detail only)

## Step-by-step

1. Open https://claude.ai (logged in)
2. Click "New chat" (or just start typing in the main box)
3. In the chat input, click the **📎 paperclip icon** (bottom-left of the input box)
4. Drag-select the 8 files from this folder + screenshots subfolder
5. Wait ~10s for uploads to finish (you'll see thumbnails appear)
6. Open `PROMPT.md` from this folder
7. Copy the text between the `═════` lines (NOT the surrounding instructions)
8. Paste into the chat input
9. Hit Send

Claude responds in 30-60 seconds with an artifact in the side panel.
