# Orichalcos — Claude Design Kit

Self-contained folder for getting a UX redesign pass from claude.ai.

## How to use this in 5 steps

1. **Take 3 screenshots** of the live app (see `screenshots/README.txt` for URLs + filenames)
2. **Read `WHAT-TO-UPLOAD.md`** — tells you which 8 files to drag into claude.ai
3. **Open https://claude.ai** in your browser, start a new chat
4. **Drag the 8 files** into the chat (paperclip icon)
5. **Open `PROMPT.md`**, copy the prompt between the `═════` lines, paste, send

That's it. After Claude's first response, iterate on what you like.

## Files in this kit

```
claude-design-kit/
├── README.md                      ← you are here
├── PROMPT.md                      ← the verbatim prompt to paste
├── WHAT-TO-UPLOAD.md              ← which files to drag in
├── WIREFRAMES.md                  ← structural intent for 4 pages
├── current-landing.html           ← my mockup of the landing page
├── current-strategy-detail.html   ← my mockup of /strategies/[id]
├── current-insure.html            ← my mockup of /insure
├── current-styles.css             ← brand tokens
└── screenshots/
    ├── README.txt                 ← what to capture and where to save
    └── (you put 3 PNGs here)
```

## When you're done

If Claude produces HTML you love:
- Save it as `~/Downloads/claude-redesign.html` (or anywhere you'll remember)
- Tell me the file path + which page it covers
- I port it into the actual React app — usually 30-60 min

If Claude's output isn't better than what I built:
- Don't sink more time into iteration
- We just polish what's already in `docs/mockups/`
- Total time spent on this experiment: ~30 min, no harm done

## Time budget

- Screenshots: 2 min
- File upload + prompt paste: 3 min
- Read first artifact + react: 5 min
- 2-3 iterations: 15-20 min
- **Total: ~30 min cap**

If after 30 min you don't have something noticeably better, ship the existing mockups.
