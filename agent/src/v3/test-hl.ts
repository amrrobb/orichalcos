/**
 * End-to-end Hyperliquid testnet smoke test.
 *
 * Run with:
 *   HL_TEST_PRIVATE_KEY=0x... npx tsx src/v3/test-hl.ts
 *
 * Requires a funded testnet wallet (drip USDC at
 * https://app.hyperliquid-testnet.xyz/drip).
 *
 * Flow:
 *   1. Open a small BTC long (~$11 notional — above HL's $10 min).
 *   2. Query equity / positions.
 *   3. Close the position.
 *   4. Print the three returned ids.
 */

import { ethers } from "ethers";
import { closePerp, getEquity, placePerp } from "./hyperliquid.js";

const PK = process.env.HL_TEST_PRIVATE_KEY;
if (!PK) {
  console.error("Set HL_TEST_PRIVATE_KEY (0x-prefixed) to run this test.");
  process.exit(1);
}

const ADDR = new ethers.Wallet(PK.startsWith("0x") ? PK : `0x${PK}`).address;

async function main() {
  console.log(`[hl-test] wallet: ${ADDR}`);

  // 0. Pre-flight equity check — fail fast with a friendly hint.
  const pre = await getEquity(ADDR);
  console.log(`[hl-test] pre-trade equity: $${pre.totalUsdc.toFixed(4)}`);
  if (pre.totalUsdc < 11) {
    console.warn(
      "[hl-test] Equity < $11. Drip testnet USDC at " +
        "https://app.hyperliquid-testnet.xyz/drip and retry.",
    );
    process.exit(0); // not a real failure for CI
  }

  // 1. Open BTC long
  console.log("[hl-test] placing BTC long (~$11 notional)...");
  const open = await placePerp(PK!, "BTC", "LONG", 11);
  console.log(`[hl-test] open  oid=${open.txHash} fillPx=${open.fillPrice}`);

  // 2. Equity / positions
  const mid = await getEquity(ADDR);
  console.log(`[hl-test] mid equity: $${mid.totalUsdc.toFixed(4)}`);
  console.log(
    `[hl-test] positions: ${mid.openPositions
      .map((p: any) => `${p.coin}=${p.szi}`)
      .join(", ") || "none"}`,
  );

  // 3. Close
  console.log("[hl-test] closing BTC position...");
  const close = await closePerp(PK!, "BTC");
  console.log(
    `[hl-test] close oid=${close.txHash} snapshotPnL=${close.pnl}`,
  );

  // 4. Final equity
  const post = await getEquity(ADDR);
  console.log(`[hl-test] post-trade equity: $${post.totalUsdc.toFixed(4)}`);

  console.log("\n[hl-test] OK — three ids:");
  console.log(`  open : ${open.txHash}`);
  console.log(`  close: ${close.txHash}`);
}

main().catch((err) => {
  console.error("[hl-test] FAILED:", err?.message ?? err);
  process.exit(1);
});
