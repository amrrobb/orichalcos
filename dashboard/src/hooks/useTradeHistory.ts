"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { RPC_URL, ADDRESSES, VAULT_ABI } from "@/lib/contracts";

export interface Trade {
  tradeId: string;
  timestamp: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  attestationRoot: string;
}

export function useTradeHistory() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ADDRESSES.vault) return;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(ADDRESSES.vault, VAULT_ABI, provider);

    async function fetch() {
      try {
        const count = Number(await vault.getTradeCount());
        const tradeList: Trade[] = [];

        for (let i = 0; i < count; i++) {
          const t = await vault.getTrade(i);
          tradeList.push({
            tradeId: t.tradeId,
            timestamp: Number(t.timestamp),
            tokenIn: t.tokenIn,
            tokenOut: t.tokenOut,
            amountIn: t.amountIn.toString(),
            amountOut: t.amountOut.toString(),
            attestationRoot: t.attestationRoot,
          });
        }

        setTrades(tradeList);
        setLoading(false);
      } catch (e) {
        console.error("Trade history error:", e);
      }
    }

    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, []);

  return { trades, loading };
}
