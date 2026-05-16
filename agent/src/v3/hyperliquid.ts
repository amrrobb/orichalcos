/**
 * Hyperliquid testnet integration for Orichalcos v3 (0G APAC).
 *
 * Three exported functions:
 *   - placePerp(privateKey, asset, side, sizeUsdc) -> { txHash, fillPrice }
 *   - getEquity(walletAddress) -> { totalUsdc, openPositions }
 *   - closePerp(privateKey, asset) -> { txHash, pnl }
 *
 * v2 (post-deadline): Hyperliquid IS an L1 — fills carry a real 32-byte
 * `hash` retrievable via `info.userFillsByTime`. After placing an order
 * we poll userFillsByTime for the just-placed `oid` and return its real
 * L1 `hash`, which dereferences at
 * `https://app.hyperliquid-testnet.xyz/explorer/tx/{hash}`.
 * See HYPERLIQUID_NOTES.md.
 */

import { ethers } from "ethers";
import {
  ExchangeClient,
  HttpTransport,
  InfoClient,
} from "@nktkas/hyperliquid";

// ---- Types ---------------------------------------------------------------

export type Asset = "BTC" | "ETH";
export type Side = "LONG" | "SHORT";

export interface PlaceResult {
  txHash: string; // real Hyperliquid L1 tx hash (0x... 32-byte hex)
  fillPrice: number;
}

export interface EquityResult {
  totalUsdc: number;
  openPositions: any[];
}

export interface CloseResult {
  txHash: string;
  pnl: number;
}

// ---- Module-scope SDK clients (lazy init) --------------------------------

const transport = new HttpTransport({ isTestnet: true });
const info = new InfoClient({ transport });

// Cache: asset name -> { index, szDecimals }
let assetMetaCache: Record<string, { index: number; szDecimals: number }> | null =
  null;

async function getAssetMeta(
  asset: string,
): Promise<{ index: number; szDecimals: number }> {
  if (!assetMetaCache) {
    const meta = await info.meta();
    assetMetaCache = {};
    meta.universe.forEach((u: any, i: number) => {
      assetMetaCache![u.name] = { index: i, szDecimals: u.szDecimals };
    });
  }
  const m = assetMetaCache[asset];
  if (!m) throw new Error(`Unknown Hyperliquid perp asset: ${asset}`);
  return m;
}

// ---- Helpers -------------------------------------------------------------

/**
 * Round price per Hyperliquid rules:
 *   - max 5 significant figures
 *   - max (6 - szDecimals) decimal places for perps
 * Without this, the API rejects with "Invalid price".
 */
function roundPx(px: number, szDecimals: number): string {
  const maxDp = 6 - szDecimals;
  // 5 sig figs
  const sig = Number(px.toPrecision(5));
  // clamp decimals
  const dpClamped = Number(sig.toFixed(Math.max(0, maxDp)));
  return dpClamped.toString();
}

function roundSz(sz: number, szDecimals: number): string {
  return sz.toFixed(szDecimals);
}

async function getMid(asset: string): Promise<number> {
  const mids = await info.allMids();
  const px = (mids as any)[asset];
  if (!px) throw new Error(`No mid price for ${asset}`);
  return Number(px);
}

/**
 * Look up the real L1 transaction hash for a just-placed fill.
 * Polls `userFillsByTime` (60s window around now) and matches by oid.
 * Retries up to 10x with 500ms backoff to ride out the indexing race.
 */
async function getRealTxHash(
  walletAddress: string,
  oid: number,
  windowMs = 60_000,
): Promise<string> {
  const startTime = Date.now() - windowMs;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const fills = await info.userFillsByTime({
        user: walletAddress as `0x${string}`,
        startTime,
        endTime: Date.now() + windowMs,
      });
      const match = (fills as any[]).find((f) => Number(f.oid) === Number(oid));
      if (match && match.hash) return match.hash as string;
    } catch {
      // fall through to retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`getRealTxHash: no fill with oid=${oid} found after 10 retries`);
}

function makeExchangeClient(privateKey: string): ExchangeClient {
  const pk = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const wallet = new ethers.Wallet(pk);
  // SDK accepts ethers v6 Wallet via AbstractWallet
  return new ExchangeClient({
    transport,
    wallet: wallet as any,
    isTestnet: true,
  });
}

// ---- Public API ----------------------------------------------------------

export async function placePerp(
  privateKey: string,
  asset: Asset,
  side: Side,
  sizeUsdc: number,
): Promise<PlaceResult> {
  const meta = await getAssetMeta(asset);
  const mid = await getMid(asset);
  const isBuy = side === "LONG";

  // Slippage band: 2% above mid for buys, 2% below for sells (IoC market-like).
  const slipped = isBuy ? mid * 1.02 : mid * 0.98;
  const px = roundPx(slipped, meta.szDecimals);
  const sz = roundSz(sizeUsdc / mid, meta.szDecimals);

  const exchange = makeExchangeClient(privateKey);
  const wallet = new ethers.Wallet(
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
  );
  const result = await exchange.order({
    orders: [
      {
        a: meta.index,
        b: isBuy,
        p: px,
        s: sz,
        r: false,
        t: { limit: { tif: "Ioc" } },
      },
    ],
    grouping: "na",
  });

  const status = (result as any).response.data.statuses[0];
  if (status.error) {
    throw new Error(`Hyperliquid order rejected: ${status.error}`);
  }
  if (status.filled) {
    const realHash = await getRealTxHash(wallet.address, Number(status.filled.oid));
    return {
      txHash: realHash,
      fillPrice: Number(status.filled.avgPx),
    };
  }
  if (status.resting) {
    // IoC should not rest, but handle gracefully — resting orders have no fill hash yet.
    return { txHash: String(status.resting.oid), fillPrice: mid };
  }
  throw new Error(`Unexpected order status: ${JSON.stringify(status)}`);
}

export async function getEquity(walletAddress: string): Promise<EquityResult> {
  const state = await info.clearinghouseState({
    user: walletAddress as `0x${string}`,
  });
  return {
    totalUsdc: Number(state.marginSummary.accountValue),
    openPositions: state.assetPositions.map((p) => p.position),
  };
}

export async function closePerp(
  privateKey: string,
  asset: string,
): Promise<CloseResult> {
  const wallet = new ethers.Wallet(
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
  );
  const meta = await getAssetMeta(asset);

  const state = await info.clearinghouseState({
    user: wallet.address as `0x${string}`,
  });
  const position = state.assetPositions.find(
    (p) => p.position.coin === asset,
  )?.position;
  if (!position || Number(position.szi) === 0) {
    throw new Error(`No open ${asset} position to close`);
  }

  const szi = Number(position.szi);
  const isLong = szi > 0;
  // Snapshot pnl before close (the close fill itself realizes it)
  const pnl = Number(position.unrealizedPnl);

  const mid = await getMid(asset);
  // Opposite side IoC, reduce-only
  const slipped = isLong ? mid * 0.98 : mid * 1.02;
  const px = roundPx(slipped, meta.szDecimals);
  const sz = roundSz(Math.abs(szi), meta.szDecimals);

  const exchange = makeExchangeClient(privateKey);
  const result = await exchange.order({
    orders: [
      {
        a: meta.index,
        b: !isLong, // opposite of current position
        p: px,
        s: sz,
        r: true, // reduce-only
        t: { limit: { tif: "Ioc" } },
      },
    ],
    grouping: "na",
  });

  const status = (result as any).response.data.statuses[0];
  if (status.error) {
    throw new Error(`Hyperliquid close rejected: ${status.error}`);
  }
  const oid = status.filled?.oid ?? status.resting?.oid;
  if (oid == null) {
    throw new Error(`Unexpected close status: ${JSON.stringify(status)}`);
  }
  // If we got a fill, resolve the real tx hash; if it rested (rare), keep oid as fallback.
  if (status.filled) {
    const realHash = await getRealTxHash(wallet.address, Number(oid));
    return { txHash: realHash, pnl };
  }
  return { txHash: String(oid), pnl };
}
