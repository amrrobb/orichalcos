"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { RPC_URL, ADDRESSES, INFT_ABI, VAULT_ABI, EXPLORER_URL } from "@/lib/contracts";
import Link from "next/link";

interface INFTData {
  tokenId: number;
  owner: string;
  data: Array<{ description: string; hash: string }>;
}

interface AgentStats {
  tradeCount: number;
  vaultValueWETH: string;
  vaultValueUSDC: string;
}

export default function AgentPage() {
  const [inft, setInft] = useState<INFTData | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ADDRESSES.inft) return;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const inftContract = new ethers.Contract(ADDRESSES.inft, INFT_ABI, provider);
    const vault = new ethers.Contract(ADDRESSES.vault, VAULT_ABI, provider);

    async function fetch() {
      try {
        const supply = Number(await inftContract.totalSupply());
        if (supply === 0) {
          setLoading(false);
          return;
        }

        // Get the latest INFT (most recent agent)
        const tokenId = supply - 1;
        const [owner, data, tradeCount, bal0, bal1] = await Promise.all([
          inftContract.ownerOf(tokenId),
          inftContract.intelligentDataOf(tokenId),
          vault.getTradeCount(),
          vault.getBalance(ADDRESSES.weth),
          vault.getBalance(ADDRESSES.usdc),
        ]);

        setInft({
          tokenId,
          owner,
          data: data.map((d: any) => ({
            description: d.dataDescription,
            hash: d.dataHash,
          })),
        });

        setStats({
          tradeCount: Number(tradeCount),
          vaultValueWETH: Number(ethers.formatEther(bal0)).toFixed(4),
          vaultValueUSDC: Number(ethers.formatUnits(bal1, 6)).toFixed(2),
        });

        setLoading(false);
      } catch (e) {
        console.error("INFT fetch error:", e);
        setLoading(false);
      }
    }

    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white">← Back</Link>
          <h1 className="text-xl font-bold">Agent Identity</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-48 bg-gray-900 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-900 rounded-xl animate-pulse" />
          </div>
        ) : !inft ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No agent INFT minted yet</p>
            <p className="text-gray-500 text-sm mt-2">Start the agent to mint its identity</p>
          </div>
        ) : (
          <>
            {/* Agent Identity Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-amber-600/30 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-bold shrink-0">
                  O
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Orichalcos Agent</h2>
                    <span className="px-2 py-0.5 text-xs rounded bg-amber-900/50 text-amber-400 border border-amber-700">
                      ERC-7857 INFT
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">TEE-Sealed Autonomous Trading Strategy</p>
                  <p className="text-xs text-gray-500 font-mono mt-2">Token #{inft.tokenId}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Trades Executed</p>
                  <p className="text-xl font-bold text-amber-400">{stats?.tradeCount || 0}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">WETH Managed</p>
                  <p className="text-xl font-bold">{stats?.vaultValueWETH || "0"}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">USDC Managed</p>
                  <p className="text-xl font-bold">${stats?.vaultValueUSDC || "0"}</p>
                </div>
              </div>
            </div>

            {/* INFT Metadata */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm text-gray-400 mb-4">Intelligent Data (On-Chain)</h3>
              <div className="space-y-3">
                <MetaField label="Owner" value={inft.owner} mono />
                <MetaField label="Token ID" value={inft.tokenId.toString()} />
                <MetaField label="Standard" value="ERC-7857 (Intelligent NFT)" />

                <div className="pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-2">Data Hashes (0G Storage References)</p>
                  {inft.data.length === 0 ? (
                    <p className="text-gray-500 text-sm">No data attached</p>
                  ) : (
                    <div className="space-y-2">
                      {inft.data.map((d, i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-amber-400 font-medium">{d.description}</span>
                            <span className="text-xs text-gray-500">Slot {i}</span>
                          </div>
                          <p className="text-xs font-mono text-gray-300 break-all">{d.hash}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Explorer Links */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm text-gray-400 mb-3">Verify On-Chain</h3>
              <div className="space-y-2">
                <a
                  href={`${EXPLORER_URL}/address/${ADDRESSES.inft}`}
                  target="_blank"
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                >
                  <span className="text-sm text-gray-300">INFT Contract</span>
                  <span className="text-xs font-mono text-amber-400">{ADDRESSES.inft.slice(0, 6)}...{ADDRESSES.inft.slice(-4)} →</span>
                </a>
                <a
                  href={`${EXPLORER_URL}/address/${ADDRESSES.vault}`}
                  target="_blank"
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                >
                  <span className="text-sm text-gray-300">Vault Contract</span>
                  <span className="text-xs font-mono text-amber-400">{ADDRESSES.vault.slice(0, 6)}...{ADDRESSES.vault.slice(-4)} →</span>
                </a>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function MetaField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-right break-all ${mono ? "font-mono text-gray-300" : "text-gray-200"}`}>{value}</span>
    </div>
  );
}
