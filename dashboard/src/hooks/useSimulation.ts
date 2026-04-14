"use client";

import { useEffect, useState } from "react";
import { SIMULATION_API } from "@/lib/contracts";

interface SimulationData {
  sealed: {
    name: string;
    pnl: number;
    trades: Array<{
      timestamp: number;
      action: string;
      amountIn: string;
      amountOut: string;
      pnlAfter: number;
      mevExtracted?: number;
    }>;
    balance0: string;
    balance1: string;
    initialValue: number;
  };
  exposed: {
    name: string;
    pnl: number;
    trades: Array<{
      timestamp: number;
      action: string;
      amountIn: string;
      amountOut: string;
      pnlAfter: number;
      mevExtracted?: number;
    }>;
    balance0: string;
    balance1: string;
    initialValue: number;
  };
  mevBot: { profit: number; extractions: number };
  cycle: number;
  running: boolean;
}

export function useSimulation() {
  const [data, setData] = useState<SimulationData | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await globalThis.fetch(`${SIMULATION_API}/api/simulation`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Simulation not running — that's ok
      }
    }

    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, []);

  return data;
}
