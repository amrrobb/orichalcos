"use client";

import { useVault } from "@/hooks/useVault";
import { useTradeHistory } from "@/hooks/useTradeHistory";
import { useSimulation } from "@/hooks/useSimulation";
import { EXPLORER_URL, ADDRESSES } from "@/lib/contracts";
import { ethers } from "ethers";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

export default function Home() {
  const { data: vault, loading: vaultLoading } = useVault();
  const { trades, loading: tradesLoading } = useTradeHistory();
  const sim = useSimulation();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-amber-500/20">
              O
            </div>
            <div>
              <h1 className="text-xl font-bold">Orichalcos</h1>
              <p className="text-xs text-gray-400">TEE-Sealed Autonomous Trading Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/agent" className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-gray-300 hover:text-white">
              Agent INFT
            </Link>
            <span className="px-3 py-1 rounded-full bg-green-900/50 text-green-400 border border-green-800 text-xs">
              0G Galileo Testnet
            </span>
            {ADDRESSES.vault && (
              <a
                href={`${EXPLORER_URL}/address/${ADDRESSES.vault}`}
                target="_blank"
                className="text-amber-400 hover:text-amber-300 text-xs"
              >
                Explorer →
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Vault Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Value" value={vault ? `$${vault.totalValueUSD.toFixed(2)}` : null} loading={vaultLoading} />
          <StatCard label="WETH Balance" value={vault ? `${vault.balanceWETH} WETH` : null} loading={vaultLoading} />
          <StatCard label="USDC Balance" value={vault ? `$${vault.balanceUSDC}` : null} loading={vaultLoading} />
          <StatCard label="Trades Executed" value={vault ? vault.tradeCount.toString() : null} loading={vaultLoading} accent />
        </div>

        {/* Side-by-Side PnL Comparison */}
        {sim && sim.cycle > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">Sealed vs Exposed Agent</h2>
              <span className="text-xs text-gray-500">Cycle {sim.cycle}</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              TEE-sealed agent is invisible to MEV bots. Exposed agent gets sandwiched.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Orichalcos (Sealed)</p>
                <p className={`text-2xl font-bold ${sim.sealed.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {sim.sealed.pnl >= 0 ? "+" : ""}{sim.sealed.pnl.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{sim.sealed.trades.length} trades</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Exposed Agent</p>
                <p className={`text-2xl font-bold ${sim.exposed.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {sim.exposed.pnl >= 0 ? "+" : ""}{sim.exposed.pnl.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{sim.exposed.trades.length} trades</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-red-900/30">
                <p className="text-xs text-gray-400 mb-1">MEV Bot Extracted</p>
                <p className="text-2xl font-bold text-red-400">
                  ${sim.mevBot.profit.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{sim.mevBot.extractions} sandwich attacks</p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sim.sealed.trades.map((t, i) => ({
                    cycle: i + 1,
                    sealed: t.pnlAfter,
                    exposed: sim.exposed.trades[i]?.pnlAfter ?? 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="cycle" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                    labelStyle={{ color: "#9CA3AF" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sealed" stroke="#F59E0B" name="Orichalcos (Sealed)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="exposed" stroke="#EF4444" name="Exposed Agent" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trade History */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Trade History</h2>
            {!tradesLoading && trades.length > 0 && (
              <span className="text-xs text-gray-500">{trades.length} trades</span>
            )}
          </div>
          {tradesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-gray-400">No trades yet</p>
              <p className="text-gray-500 text-sm mt-1">Start the agent to begin trading</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left py-3 px-2">#</th>
                    <th className="text-left py-3 px-2">Time</th>
                    <th className="text-left py-3 px-2">Direction</th>
                    <th className="text-right py-3 px-2">In</th>
                    <th className="text-right py-3 px-2">Out</th>
                    <th className="text-left py-3 px-2">TEE Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => {
                    const isWethIn = trade.tokenIn.toLowerCase() === ADDRESSES.weth.toLowerCase();
                    const hasAttestation = trade.attestationRoot !== ethers.ZeroHash;
                    return (
                      <tr key={trade.tradeId} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                        <td className="py-3 px-2 text-gray-500">{i + 1}</td>
                        <td className="py-3 px-2 text-gray-300">
                          {new Date(trade.timestamp * 1000).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${isWethIn ? "bg-red-900/50 text-red-400 border border-red-800/50" : "bg-green-900/50 text-green-400 border border-green-800/50"}`}>
                            {isWethIn ? "SELL" : "BUY"}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-gray-300">
                          {isWethIn
                            ? `${Number(ethers.formatEther(trade.amountIn)).toFixed(4)} WETH`
                            : `${Number(ethers.formatUnits(trade.amountIn, 6)).toFixed(2)} USDC`}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-gray-300">
                          {isWethIn
                            ? `${Number(ethers.formatUnits(trade.amountOut, 6)).toFixed(2)} USDC`
                            : `${Number(ethers.formatEther(trade.amountOut)).toFixed(4)} WETH`}
                        </td>
                        <td className="py-3 px-2">
                          {hasAttestation ? (
                            <Link
                              href={`/attestation/${trade.tradeId}`}
                              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-mono text-xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                              {trade.attestationRoot.slice(0, 8)}...
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 0G Integration */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">0G Integration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <IntegrationBadge name="0G Chain" desc="Smart contracts deployed" detail="Galileo Testnet (16602)" active />
            <IntegrationBadge name="0G Compute" desc="TEE-sealed inference" detail="Qwen 2.5 7B via TeeML" active />
            <IntegrationBadge name="0G Storage" desc="Attestation proofs" detail="Merkle roots on-chain" active />
            <IntegrationBadge name="INFT (ERC-7857)" desc="Agent-as-NFT" detail="Tokenized identity" active />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <span>Orichalcos — 0G APAC Hackathon 2026</span>
          <a href="https://github.com/amrrobb/orichalcos" target="_blank" className="hover:text-gray-300">
            GitHub →
          </a>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, loading, accent }: { label: string; value: string | null; loading: boolean; accent?: boolean }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {loading || !value ? (
        <div className="h-8 w-24 bg-gray-800 rounded animate-pulse mt-1" />
      ) : (
        <p className={`text-2xl font-bold ${accent ? "text-amber-400" : "text-white"}`}>{value}</p>
      )}
    </div>
  );
}

function IntegrationBadge({ name, desc, detail, active }: { name: string; desc: string; detail: string; active: boolean }) {
  return (
    <div className={`rounded-lg p-3 border transition ${active ? "border-amber-600/30 bg-amber-950/10 hover:bg-amber-950/20" : "border-gray-700 bg-gray-800"}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${active ? "bg-amber-400 shadow-sm shadow-amber-400/50" : "bg-gray-600"}`} />
        <span className="font-medium text-sm">{name}</span>
      </div>
      <p className="text-xs text-gray-400">{desc}</p>
      <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
    </div>
  );
}
