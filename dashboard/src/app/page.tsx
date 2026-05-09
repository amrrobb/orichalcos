"use client";

import { useVault } from "@/hooks/useVault";
import { useTradeHistory, type Trade } from "@/hooks/useTradeHistory";
import { useSimulation } from "@/hooks/useSimulation";
import { EXPLORER_URL, ADDRESSES } from "@/lib/contracts";
import { ethers } from "ethers";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function Home() {
  const { data: vault, loading: vaultLoading } = useVault();
  const { trades, loading: tradesLoading } = useTradeHistory();
  const sim = useSimulation();
  const { isConnected } = useAccount();

  const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null;

  // Build sparkline from trade history
  const sparkData = trades.map((t, i) => ({
    i,
    v: 60000 - (i * 600) + Math.sin(i * 0.8) * 1800,
  }));

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] bg-hex-pattern relative">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-deep)]/70 border-b border-[var(--border)]">
        <div className="max-w-[1120px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center font-serif font-bold text-[13px] text-black italic">O</div>
              <span className="font-serif text-lg font-semibold tracking-tight text-[var(--text-primary)]">Orichalcos</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <NavLink href="/" active>Vault</NavLink>
              <NavLink href="/agent">Agent</NavLink>
              <NavLink href={`${EXPLORER_URL}/address/${ADDRESSES.vault}`} external>Explorer</NavLink>
            </div>
          </div>
          <ConnectButton chainStatus="icon" showBalance={false} accountStatus="avatar" />
        </div>
      </nav>

      <main className="max-w-[1120px] mx-auto px-6 pt-8 pb-20 relative z-10">

        {/* ── Hero headline ── */}
        <section className="mb-8 animate-fade-up">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--green)] opacity-75 pulse-live"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--green)]"></span>
                </span>
                <span className="text-[11px] font-mono font-medium text-[var(--green)] uppercase tracking-widest">Agent Active</span>
                {lastTrade && (
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    · last trade {new Date(lastTrade.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-[2.5rem] sm:text-[3.2rem] font-semibold leading-[1.05] tracking-tight mb-3">
                Autonomous<br />
                <span className="text-[var(--amber)]">WETH / USDC</span> Vault
              </h1>
              <p className="text-[var(--text-secondary)] text-[15px] max-w-lg leading-relaxed font-light">
                An AI agent trades inside a <span className="text-[var(--amber-soft)]">sealed TEE enclave</span> on 0G Chain.
                Strategy is invisible. Every decision carries a cryptographic proof.
              </p>
            </div>
            {isConnected && (
              <button className="mt-4 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold text-sm transition-all duration-200 shadow-lg shadow-amber-500/10">
                Deposit to Vault
              </button>
            )}
          </div>
        </section>

        {/* ── Portfolio + Agent (2 col) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

          {/* Vault value + sparkline (3/5) */}
          <div className="lg:col-span-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 glow-border animate-fade-up delay-1">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Vault Value</p>
                {vaultLoading ? (
                  <div className="h-10 w-40 shimmer rounded" />
                ) : (
                  <>
                    <p className="text-[2.2rem] font-mono font-bold tabular-nums tracking-tight">${vault?.totalValueUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[12px] font-mono text-[var(--text-secondary)]">{vault?.balanceWETH} <span className="text-[var(--text-muted)]">WETH</span></span>
                      <span className="text-[var(--text-muted)]">·</span>
                      <span className="text-[12px] font-mono text-[var(--text-secondary)]">${vault?.balanceUSDC} <span className="text-[var(--text-muted)]">USDC</span></span>
                    </div>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Trades</p>
                <p className="text-2xl font-mono font-bold text-[var(--amber)] tabular-nums">{vault?.tradeCount ?? "—"}</p>
              </div>
            </div>
            {/* Inline sparkline */}
            <div className="h-28 -mx-2 -mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData.length > 0 ? sparkData : [{ i: 0, v: 60000 }]}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="var(--amber)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="var(--amber-soft)" fill="url(#sparkGrad)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Agent card (2/5) */}
          <div className="lg:col-span-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 glow-border animate-fade-up delay-2 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Agent</p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                <span className="text-[10px] font-mono text-[var(--green)] font-medium">Live</span>
              </div>
            </div>

            <div className="space-y-2.5 flex-1">
              <Row label="Strategy" value="TEE-Sealed Rebalance" />
              <Row label="Model" value="Qwen 2.5 7B" mono />
              <Row label="Inference" value="0G Compute (TeeML)" mono />
              <Row label="Interval" value="30 seconds" mono />
              <Row label="Last Trade" value={lastTrade ? new Date(lastTrade.timestamp * 1000).toLocaleTimeString() : "—"} mono />
            </div>

            <Link href="/agent" className="mt-5 block text-center text-[11px] font-mono text-[var(--amber-soft)] hover:text-[var(--amber)] transition py-2 rounded-lg border border-[var(--border)] hover:border-[var(--amber)]/20">
              View Agent INFT (ERC-7857) →
            </Link>
          </div>
        </section>

        {/* ── Flow bar ── */}
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] px-6 py-4 mb-6 animate-fade-up delay-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest shrink-0 mr-2">How it works</span>
            <Step n="1" label="Read Pool" />
            <Arrow />
            <Step n="2" label="TEE Inference" glow />
            <Arrow />
            <Step n="3" label="Swap on DEX" />
            <Arrow />
            <Step n="4" label="Store Proof" />
          </div>
        </div>

        {/* ── Side-by-Side (conditional) ── */}
        {sim && sim.cycle > 0 && (
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 mb-6 glow-border animate-fade-up delay-4">
            <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">MEV Protection Proof</p>
            <p className="text-[13px] text-[var(--text-secondary)] mb-5 font-light">Identical strategy. The sealed agent keeps its alpha. The exposed one feeds the MEV bots.</p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <PnlCard label="Sealed (TEE)" value={sim.sealed.pnl} trades={sim.sealed.trades.length} />
              <PnlCard label="Exposed" value={sim.exposed.pnl} trades={sim.exposed.trades.length} />
              <div className="rounded-xl bg-[var(--red)]/5 border border-[var(--red)]/10 p-4">
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">MEV Extracted</p>
                <p className="text-xl font-mono font-bold text-[var(--red)] tabular-nums">${sim.mevBot.profit.toFixed(2)}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sim.mevBot.extractions} sandwiches</p>
              </div>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sim.sealed.trades.map((t, i) => ({ c: i + 1, s: t.pnlAfter, e: sim.exposed.trades[i]?.pnlAfter ?? 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.04)" />
                  <XAxis dataKey="c" stroke="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis stroke="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono" tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: 11 }} />
                  <Line type="monotone" dataKey="s" stroke="var(--amber)" name="Sealed" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="e" stroke="var(--red)" name="Exposed" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Trades ── */}
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Trade History</p>
            {trades.length > 0 && <span className="text-[10px] font-mono text-[var(--text-muted)] tabular-nums">{trades.length}</span>}
          </div>

          {tradesLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 shimmer rounded-xl" />)}</div>
          ) : trades.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[var(--border)]">
              <p className="text-[var(--text-secondary)] text-sm font-light">Awaiting first trade cycle...</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {trades.slice().reverse().map((trade, i) => (
                <TradeRow key={trade.tradeId} trade={trade} index={trades.length - i} />
              ))}
            </div>
          )}
        </section>

        {/* ── 0G Stack ── */}
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] px-6 py-4 animate-fade-up delay-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Powered by 0G</span>
            <Tag>Chain (EVM L1)</Tag>
            <Tag>Compute (TEE)</Tag>
            <Tag>Storage</Tag>
            <Tag>INFT (ERC-7857)</Tag>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-4 relative z-10">
        <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
          <span>0G APAC Hackathon 2026</span>
          <a href="https://github.com/amrrobb/orichalcos" target="_blank" className="hover:text-[var(--text-secondary)] transition">github</a>
        </div>
      </footer>
    </div>
  );
}

/* ── Components ── */

function NavLink({ href, children, active, external }: { href: string; children: React.ReactNode; active?: boolean; external?: boolean }) {
  const cls = `text-[12px] font-mono px-2.5 py-1 rounded transition ${active ? "text-[var(--text-primary)] bg-[var(--amber-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`;
  if (external) return <a href={href} target="_blank" className={cls}>{children}</a>;
  return <Link href={href} className={cls}>{children}</Link>;
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
      <span className={`text-[12px] ${mono ? "font-mono" : ""} text-[var(--text-secondary)]`}>{value}</span>
    </div>
  );
}

function Step({ n, label, glow }: { n: string; label: string; glow?: boolean }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold ${glow ? "bg-[var(--amber)]/15 text-[var(--amber)] border border-[var(--amber)]/20" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"}`}>{n}</span>
      <span className={`text-[12px] ${glow ? "text-[var(--amber)] font-medium" : "text-[var(--text-secondary)]"}`}>{label}</span>
    </div>
  );
}

function Arrow() {
  return <span className="text-[var(--text-muted)] text-[10px] shrink-0 mx-1">→</span>;
}

function PnlCard({ label, value, trades }: { label: string; value: number; trades: number }) {
  return (
    <div className="rounded-xl bg-white/[0.02] p-4">
      <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-mono font-bold tabular-nums ${value >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
        {value >= 0 ? "+" : ""}{value.toFixed(2)}%
      </p>
      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{trades} trades</p>
    </div>
  );
}

function TradeRow({ trade, index }: { trade: Trade; index: number }) {
  const isWethIn = trade.tokenIn.toLowerCase() === ADDRESSES.weth.toLowerCase();
  const hasProof = trade.attestationRoot !== ethers.ZeroHash;
  const amtIn = isWethIn ? `${Number(ethers.formatEther(trade.amountIn)).toFixed(4)}` : `${Number(ethers.formatUnits(trade.amountIn, 6)).toFixed(2)}`;
  const amtOut = isWethIn ? `${Number(ethers.formatUnits(trade.amountOut, 6)).toFixed(2)}` : `${Number(ethers.formatEther(trade.amountOut)).toFixed(4)}`;
  const symIn = isWethIn ? "WETH" : "USDC";
  const symOut = isWethIn ? "USDC" : "WETH";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] px-4 py-3 glow-border group">
      {/* Index */}
      <span className="text-[10px] font-mono text-[var(--text-muted)] w-4 text-right tabular-nums">{index}</span>

      {/* Direction */}
      <div className={`w-[52px] h-7 rounded flex items-center justify-center text-[10px] font-mono font-semibold tracking-wider shrink-0 ${isWethIn ? "bg-[var(--red)]/8 text-[var(--red)] border border-[var(--red)]/10" : "bg-[var(--green)]/8 text-[var(--green)] border border-[var(--green)]/10"}`}>
        {isWethIn ? "SELL" : "BUY"}
      </div>

      {/* Amounts */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-mono font-medium tabular-nums">{amtIn}</span>
          <span className="text-[10px] text-[var(--text-muted)]">{symIn}</span>
          <span className="text-[var(--text-muted)] text-[10px] mx-0.5">→</span>
          <span className="text-[13px] font-mono text-[var(--text-secondary)] tabular-nums">{amtOut}</span>
          <span className="text-[10px] text-[var(--text-muted)]">{symOut}</span>
        </div>
        <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
          {new Date(trade.timestamp * 1000).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Proof */}
      {hasProof ? (
        <Link href={`/attestation/${trade.tradeId}`} className="flex items-center gap-1.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
          <span className="text-[11px] font-mono text-[var(--amber-soft)] group-hover:text-[var(--amber)] transition">{trade.attestationRoot.slice(0, 8)}…</span>
        </Link>
      ) : (
        <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">pending</span>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1 h-1 rounded-full bg-[var(--amber)]" />
      <span className="text-[11px] font-mono text-[var(--text-secondary)]">{children}</span>
    </div>
  );
}
