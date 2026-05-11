/**
 * Equity sparkline for a Strategy Agent.
 *
 * Plots `equityAfter` over time. The breach threshold is shown as a dashed
 * horizontal rule so a glance answers "how close are we to a slash?". A
 * synthetic origin point is prepended at (epochStartTs, startingBond) so the
 * line starts at the bond rather than at the first trade — keeps the threshold
 * visually anchored even when the first trade was already profitable.
 */
"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUnits } from "viem";
import { USDC_DECIMALS } from "@/lib/contracts";
import type { Trade } from "@/hooks/v3/useTradesForStrategy";

interface Props {
  trades: readonly Trade[];
  threshold: bigint;       // USDC 6dp
  startingBond: bigint;    // USDC 6dp
  epochStartTs?: bigint;
}

function toUsdc(v: bigint): number {
  // Number() is fine here — USDC values in demo are well within MAX_SAFE_INTEGER.
  return Number(formatUnits(v, USDC_DECIMALS));
}

export function PnlSparkline({ trades, threshold, startingBond, epochStartTs }: Props) {
  const thresholdNum = toUsdc(threshold);
  const startBondNum = toUsdc(startingBond);

  // Build chart series. Prepend synthetic origin so the line is anchored at
  // the bond at epoch start (otherwise the threshold dashed line dangles).
  const origin = {
    idx: 0,
    label: "start",
    equity: startBondNum,
    timestamp: epochStartTs ? Number(epochStartTs) : 0,
  };
  const points = trades.map((t, i) => ({
    idx: i + 1,
    label: `#${i + 1}`,
    equity: toUsdc(t.equityAfter),
    timestamp: Number(t.timestamp),
  }));
  const data = [origin, ...points];

  // Y domain: pad ~5% above max and below min(threshold, min equity).
  const equities = data.map((d) => d.equity);
  const yMin = Math.min(thresholdNum, ...equities);
  const yMax = Math.max(...equities);
  const padding = Math.max(20, (yMax - yMin) * 0.1);
  const domain: [number, number] = [yMin - padding, yMax + padding];

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--rule)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--ink-faint)"
            tick={{ fill: "var(--ink-faint)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--rule)" }}
          />
          <YAxis
            stroke="var(--ink-faint)"
            tick={{ fill: "var(--ink-faint)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--rule)" }}
            domain={domain}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-raised)",
              border: "1px solid var(--rule)",
              borderRadius: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--ink)",
            }}
            labelStyle={{ color: "var(--ink-dim)", fontSize: 11 }}
            formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, "equity"]}
          />
          <ReferenceLine
            y={thresholdNum}
            stroke="var(--loss)"
            strokeDasharray="5 4"
            strokeOpacity={0.7}
            label={{
              value: `breach ≤ $${thresholdNum.toFixed(0)}`,
              position: "insideBottomRight",
              fill: "var(--loss)",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
            }}
          />
          <Line
            type="monotone"
            dataKey="equity"
            stroke="var(--brass-bright)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--brass-bright)", stroke: "var(--surface-base)" }}
            activeDot={{ r: 5, fill: "var(--brass-bright)" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
