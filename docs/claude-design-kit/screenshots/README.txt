SCREENSHOT INSTRUCTIONS
═══════════════════════

Take 3 PNG screenshots of the LIVE app and save them in this folder.
These show Claude what the current UX looks like (the "before" state).

Make sure the dev server is running first:
  cd /Users/ammar.robb/Documents/Web3/hackathons/hackquest-0g/dashboard
  npm run dev

Then capture each URL with cmd+shift+4 (Mac screenshot tool):

  1. http://localhost:3000/strategies/20
     → save as: 1-strategy-detail-breach.png
     (the breach-state strategy detail page — the most confusing one)

  2. http://localhost:3000/strategies/17
     → save as: 2-strategy-detail-healthy.png
     (a healthy strategy with positive equity curve — for comparison)

  3. http://localhost:3000/strategies/20/insure
     → save as: 3-insure-flow.png
     (the buy-coverage page with sidebar)

Optional 4th if you want:
  4. http://localhost:3000/protocol
     → save as: 4-protocol-grid.png
     (the active strategies grid page)

Width target: ~1400-2000px wide is fine. Don't crop the browser chrome —
Claude reads the full viewport.

When done, this folder should have at least 3 PNG files in it.
