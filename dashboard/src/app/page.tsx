"use client";

import { useVault } from "@/hooks/useVault";
import { useTradeHistory } from "@/hooks/useTradeHistory";
import { useSimulation } from "@/hooks/useSimulation";
import { EXPLORER_URL, ADDRESSES } from "@/lib/contracts";
import { ethers } from "ethers";
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-lg">
              O
            </div>
            <div>
              <h1 className="text-xl font-bold">Orichalcos</h1>
              <p className="text-xs text-gray-400">TEE-Sealed Autonomous Trading Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 rounded-full bg-green-900/50 text-green-400 border border-green-800">
              0G Galileo Testnet
            </span>
            {ADDRESSES.vault && (
              <a
                href={`${EXPLORER_URL}/address/${ADDRESSES.vault}`}
                target="_blank"
                className="text-amber-400 hover:text-amber-300"
              >
                Vault Contract
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Vault Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Value"
            value={vault ? `$${vault.totalValueUSD.toFixed(2)}` : "—"}
            loading={vaultLoading}
          />
          <StatCard
            label="WETH Balance"
            value={vault ? `${vault.balanceWETH} WETH` : "—"}
            loading={vaultLoading}
          />
          <StatCard
            label="USDC Balance"
            value={vault ? `$${vault.balanceUSDC}` : "—"}
            loading={vaultLoading}
          />
          <StatCard
            label="Trades Executed"
            value={vault ? vault.tradeCount.toString() : "—"}
            loading={vaultLoading}
            accent
          />
        </div>

        {/* Side-by-Side PnL Comparison */}
        {sim && sim.cycle > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-1">Sealed vs Exposed Agent</h2>
            <p className="text-sm text-gray-400 mb-4">
              TEE-sealed agent is invisible to MEV bots. Exposed agent gets sandwiched.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Orichalcos (Sealed)</p>
                <p className={`text-2xl font-bold ${sim.sealed.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {sim.sealed.pnl >= 0 ? "+" : ""}{sim.sealed.pnl.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Exposed Agent</p>
                <p className={`text-2xl font-bold ${sim.exposed.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {sim.exposed.pnl >= 0 ? "+" : ""}{sim.exposed.pnl.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">MEV Bot Profit</p>
                <p className="text-2xl font-bold text-red-400">
                  ${sim.mevBot.profit.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{sim.mevBot.extractions} sandwiches</p>
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
                  <XAxis dataKey="cycle" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
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
          <h2 className="text-lg font-semibold mb-4">Trade History</h2>
          {tradesLoading ? (
            <p className="text-gray-400">Loading trades...</p>
          ) : trades.length === 0 ? (
            <p className="text-gray-400">No trades yet. Agent starting...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left py-3 px-2">#</th>
                    <th className="text-left py-3 px-2">Time</th>
                    <th className="text-left py-3 px-2">Direction</th>
                    <th className="text-right py-3 px-2">Amount In</th>
                    <th className="text-right py-3 px-2">Amount Out</th>
                    <th className="text-left py-3 px-2">TEE Attestation</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => {
                    const isWethIn = trade.tokenIn.toLowerCase() === ADDRESSES.weth.toLowerCase();
                    return (
                      <tr key={trade.tradeId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 px-2 text-gray-400">{i + 1}</td>
                        <td className="py-3 px-2">
                          {new Date(trade.timestamp * 1000).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${isWethIn ? "bg-red-900/50 text-red-400" : "bg-green-900/50 text-green-400"}`}>
                            {isWethIn ? "SELL WETH" : "BUY WETH"}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          {isWethIn
                            ? `${Number(ethers.formatEther(trade.amountIn)).toFixed(4)} WETH`
                            : `${Number(ethers.formatUnits(trade.amountIn, 6)).toFixed(2)} USDC`}
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          {isWethIn
                            ? `${Number(ethers.formatUnits(trade.amountOut, 6)).toFixed(2)} USDC`
                            : `${Number(ethers.formatEther(trade.amountOut)).toFixed(4)} WETH`}
                        </td>
                        <td className="py-3 px-2">
                          {trade.attestationRoot !== ethers.ZeroHash ? (
                            <a
                              href={`/attestation/${trade.tradeId}`}
                              className="text-amber-400 hover:text-amber-300 font-mono text-xs"
                            >
                              {trade.attestationRoot.slice(0, 10)}...
                            </a>
                          ) : (
                            <span className="text-gray-500 text-xs">Pending</span>
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

        {/* 0G Integration Badge */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">0G Integration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <IntegrationBadge name="0G Chain" desc="Smart contracts deployed" active />
            <IntegrationBadge name="0G Compute" desc="TEE-sealed inference" active />
            <IntegrationBadge name="0G Storage" desc="Attestation proofs" active />
            <IntegrationBadge name="INFT (ERC-7857)" desc="Agent-as-NFT" active />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, loading, accent }: { label: string; value: string; loading: boolean; accent?: boolean }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? "text-amber-400" : "text-white"}`}>
        {loading ? "..." : value}
      </p>
    </div>
  );
}

function IntegrationBadge({ name, desc, active }: { name: string; desc: string; active: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${active ? "border-amber-600/50 bg-amber-950/20" : "border-gray-700 bg-gray-800"}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${active ? "bg-amber-400" : "bg-gray-600"}`} />
        <span className="font-medium text-sm">{name}</span>
      </div>
      <p className="text-xs text-gray-400">{desc}</p>
    </div>
  );
}
