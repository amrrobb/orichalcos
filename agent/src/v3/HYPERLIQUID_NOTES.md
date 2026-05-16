# Hyperliquid Integration Notes (v3)

Path chosen: **community SDK** `@nktkas/hyperliquid` v0.32.2 with ethers v6
wallet. Did not pull in viem (SDK accepts `ethers.Wallet` directly via its
`AbstractWallet` interface). Testnet enabled via `new HttpTransport({ isTestnet:
true })` and `new ExchangeClient({ ..., isTestnet: true })`.

## Caveats / Gotchas (read before integrating)

1. **`txHash` is the real L1 hash (v2).** Hyperliquid is its own L1; every
   fill has a 32-byte `hash` retrievable via `info.userFillsByTime`. After
   `exchange.order(...)` returns the `oid`, we poll userFillsByTime (60s
   window, 10 retries × 500ms) and grab `fill.hash`. That hash dereferences
   at `https://app.hyperliquid-testnet.xyz/explorer/tx/<hash>`.

   v2 (post-deadline): we now capture real L1 hashes via userFillsByTime.
   The legacy "oid stuffed in bytes32" encoding has been replaced. Pre-v2
   trades on chain still use the old encoding — the dashboard detects this
   (any bytes32 with top 192 bits zero is an oid) and falls back to the
   agent wallet's address page for those.

2. **Price tick rounding.** Most common silent failure. Hyperliquid rejects
   prices with `"Invalid price"` if you exceed:
   - 5 significant figures, AND
   - `(6 - szDecimals)` decimal places for perps.
   `roundPx()` in `hyperliquid.ts` handles both. `szDecimals` per asset is
   fetched once from `info.meta()` and cached.

3. **Size is in coin units, not USD.** Caller passes `sizeUsdc`; we divide by
   the current mid (from `info.allMids()`) and round to `szDecimals`.

4. **Market orders use IoC limits.** Hyperliquid has no separate market-order
   type. We send a limit at mid ± 2% with `tif: "Ioc"`. If the book is thin
   and 2% slippage isn't enough, the order partially fills or rejects — bump
   the band if you see this in production. Don't use `Gtc` for market-like
   intent — it'll rest and `fillPrice` will be undefined.

5. **`closePerp` is two RPC calls.** First `clearinghouseState` to read
   `position.szi` (signed: negative = short), then an opposite-side IoC limit
   with `r: true` (reduce-only). The `pnl` returned is the snapshot
   `unrealizedPnl` taken right before the close — close to but not exactly
   the realized PnL (final value depends on the close fill price).

6. **Asset index is fetched, not hardcoded.** `meta.universe[i].name === "BTC"`
   gives index `i`. As of May 2026, BTC=0 and ETH=1, but the mapping can
   change when new assets are listed — never assume.

7. **Funding required.** Wallet needs testnet USDC. Drip:
   `https://app.hyperliquid-testnet.xyz/drip`. Min order notional is ~$10;
   the test script uses $11 to stay above the floor. Pre-flight in
   `test-hl.ts` exits 0 (not failure) if equity < $11 so CI doesn't redball
   on an unfunded wallet.

8. **Nonce / time skew.** SDK handles nonces automatically (uses
   `Date.now()`). If the host clock drifts more than ~1 minute, signatures
   fail with `"Order has invalid timestamp"`. Run `sntp` or fix NTP if you
   see this.

9. **No retries.** SDK throws on transport errors. If you want resilience,
   wrap calls externally — keeping this module thin so the agent loop owns
   retry policy.

10. **Compilation.** Files are TypeScript ESM. `tsx src/v3/test-hl.ts` runs
    them directly. The project's `tsconfig.json` already targets ES2022 with
    `moduleResolution: "bundler"`, which the SDK is happy with.

## Fallback (if SDK breaks)

If the SDK is broken on submission day, the raw API fallback is:
- POST `https://api.hyperliquid-testnet.xyz/exchange`
- Body: `{ action, nonce, signature, vaultAddress?: null }`
- `action` is the order payload above; `signature` is EIP-712 over the
  canonicalized action. Spec:
  https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing

This module hides those details — if the SDK breaks, swap the three
function bodies, keep the public types.

## Mock mode

Not wired in this module. If you need a no-network demo path, the agent
runner should branch on `MOCK_DEX=true` upstream and skip importing this
file entirely. (Or stub the three exports in a sibling file.)
