"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { RPC_URL, ADDRESSES, VAULT_ABI, PAIR_ABI } from "@/lib/contracts";

interface VaultData {
  balanceWETH: string;
  balanceUSDC: string;
  tradeCount: number;
  agent: string;
  price: number;
  totalValueUSD: number;
}

export function useVault() {
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ADDRESSES.vault) return;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(ADDRESSES.vault, VAULT_ABI, provider);
    const pair = new ethers.Contract(ADDRESSES.pair, PAIR_ABI, provider);

    async function fetch() {
      try {
        const [bal0, bal1, count, agent, reserves] = await Promise.all([
          vault.getBalance(ADDRESSES.weth),
          vault.getBalance(ADDRESSES.usdc),
          vault.getTradeCount(),
          vault.agent(),
          pair.getReserves(),
        ]);

        const wethBal = Number(ethers.formatEther(bal0));
        const usdcBal = Number(ethers.formatUnits(bal1, 6));
        const r0 = Number(ethers.formatEther(reserves[0]));
        const r1 = Number(ethers.formatUnits(reserves[1], 6));
        const price = r0 > 0 ? r1 / r0 : 3000;

        setData({
          balanceWETH: wethBal.toFixed(4),
          balanceUSDC: usdcBal.toFixed(2),
          tradeCount: Number(count),
          agent,
          price,
          totalValueUSD: wethBal * price + usdcBal,
        });
        setLoading(false);
      } catch (e) {
        console.error("Vault fetch error:", e);
      }
    }

    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading };
}
