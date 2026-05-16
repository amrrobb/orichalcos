/**
 * Hero equity-curve chart for the dossier page. Renders a real polyline from
 * a Trade[] with the slash threshold as a dashed line, an emphasized
 * breach/peak marker, and inline annotations on the curve.
 *
 * SVG hand-laid in a 880×420 viewBox to match the redesign mockup.
 */
"use client";

import { motion } from "framer-motion";
import { formatUnits } from "viem";
import { USDC_DECIMALS } from "@/lib/contracts";
import type { Trade } from "@/hooks/v3/useTradesForStrategy";

interface Props {
  trades: readonly Trade[];
  threshold: bigint;
  startingBond: bigint;
  breached: boolean;
}

const VIEW_W = 880;
const VIEW_H = 420;
const PAD_L = 60;
const PAD_R = 80;
const PAD_T = 40;
const PAD_B = 60;

export function AnnotatedEquityChart({
  trades,
  threshold,
  startingBond,
  breached,
}: Props) {
  // Convert to numbers in USDC units.
  const startUsdc = num(startingBond);
  const thresholdUsdc = num(threshold);

  // Points: index 0 is bond-opened, then each trade.
  const equityPoints = [
    startUsdc,
    ...trades.map((t) => num(t.equityAfter)),
  ];

  const minVal = Math.min(thresholdUsdc - 50, ...equityPoints);
  const maxVal = Math.max(startUsdc + 50, ...equityPoints) + 50;

  const xFor = (i: number) => {
    if (equityPoints.length <= 1) return PAD_L;
    return PAD_L + ((VIEW_W - PAD_L - PAD_R) * i) / (equityPoints.length - 1);
  };
  const yFor = (v: number) => {
    const ratio = (v - minVal) / Math.max(maxVal - minVal, 1);
    return VIEW_H - PAD_B - ratio * (VIEW_H - PAD_T - PAD_B);
  };

  const polyPoints = equityPoints.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
  const fillPoints =
    `${polyPoints} ${xFor(equityPoints.length - 1)},${VIEW_H - PAD_B} ${xFor(0)},${VIEW_H - PAD_B}`;

  // Find the breach or peak marker.
  let markerIdx = -1;
  if (breached) {
    for (let i = 1; i < equityPoints.length; i++) {
      if (equityPoints[i] <= thresholdUsdc) { markerIdx = i; break; }
    }
  } else {
    let bestIdx = 0;
    for (let i = 1; i < equityPoints.length; i++) {
      if (equityPoints[i] > equityPoints[bestIdx]) bestIdx = i;
    }
    if (bestIdx > 0) markerIdx = bestIdx;
  }

  const thresholdY = yFor(thresholdUsdc);
  const lineColor = breached ? "#d4a574" : "url(#equityGrad)";

  const yTicks = ticksFor(minVal, maxVal);

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={breached ? "#d4a574" : "#88c870"} stopOpacity={breached ? 0.18 : 0.12} />
          <stop offset="100%" stopColor={breached ? "#d4a574" : "#88c870"} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="breachFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d97676" stopOpacity={0} />
          <stop offset="100%" stopColor="#d97676" stopOpacity={0.08} />
        </linearGradient>
        <linearGradient id="equityGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d4a574" />
          <stop offset="100%" stopColor="#88c870" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
        {yTicks.map((t) => (
          <line key={t} x1={PAD_L} y1={yFor(t)} x2={VIEW_W - PAD_R + 20} y2={yFor(t)} />
        ))}
      </g>

      {/* y axis labels */}
      {yTicks.map((t) => (
        <text
          key={t}
          x={PAD_L - 10}
          y={yFor(t) + 4}
          textAnchor="end"
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
          fontSize="10"
        >
          ${Math.round(t)}
        </text>
      ))}

      {/* Breach band */}
      {breached && (
        <rect
          x={PAD_L}
          y={thresholdY}
          width={VIEW_W - PAD_L - PAD_R + 20}
          height={VIEW_H - PAD_B - thresholdY}
          fill="url(#breachFill)"
        />
      )}

      {/* Threshold dashed line */}
      <line
        x1={PAD_L}
        y1={thresholdY}
        x2={VIEW_W - PAD_R + 20}
        y2={thresholdY}
        stroke="#d97676"
        strokeWidth="1.25"
        strokeDasharray="5,5"
        opacity={breached ? 0.75 : 0.45}
      />
      <text
        x={PAD_L + 12}
        y={thresholdY + 17}
        fill="#d97676"
        fontFamily="var(--font-mono)"
        fontSize="10"
      >
        breach ≤ ${Math.round(thresholdUsdc)} · slash threshold
      </text>

      {/* Area fill */}
      <motion.polyline
        fill="url(#equityFill)"
        stroke="none"
        points={fillPoints}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />

      {/* Main equity line */}
      <motion.polyline
        fill="none"
        stroke={lineColor}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyPoints}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Trade dots */}
      {equityPoints.map((v, i) => {
        const isMarker = i === markerIdx;
        const isStart = i === 0;
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.04 }}
          >
            {isMarker ? (
              <>
                <circle
                  cx={xFor(i)}
                  cy={yFor(v)}
                  r="6"
                  fill={breached ? "#d97676" : "#88c870"}
                />
                <circle
                  cx={xFor(i)}
                  cy={yFor(v)}
                  r="11"
                  fill="none"
                  stroke={breached ? "#d97676" : "#88c870"}
                  strokeOpacity={breached ? 0.6 : 0.5}
                />
                <circle
                  cx={xFor(i)}
                  cy={yFor(v)}
                  r="16"
                  fill="none"
                  stroke={breached ? "#d97676" : "#88c870"}
                  strokeOpacity={breached ? 0.25 : 0.2}
                />
              </>
            ) : isStart ? (
              <>
                <circle cx={xFor(i)} cy={yFor(v)} r="4" fill="#d4a574" />
                <circle
                  cx={xFor(i)}
                  cy={yFor(v)}
                  r="9"
                  fill="none"
                  stroke="#d4a574"
                  strokeOpacity={0.3}
                />
              </>
            ) : (
              <circle cx={xFor(i)} cy={yFor(v)} r="3.5" fill="#d4a574" />
            )}
          </motion.g>
        );
      })}

      {/* Annotation: bond opened */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <line
          x1={xFor(0)}
          y1={yFor(startUsdc) - 20}
          x2={xFor(0)}
          y2={yFor(startUsdc) - 44}
          stroke="rgba(212,165,116,0.45)"
          strokeWidth="1"
        />
        <text
          x={xFor(0) - 4}
          y={yFor(startUsdc) - 52}
          fill="#d4a574"
          fontFamily="var(--font-mono)"
          fontSize="10"
        >
          Bond opened
        </text>
        <text
          x={xFor(0) - 4}
          y={yFor(startUsdc) - 40}
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
          fontSize="10"
        >
          {fmt(startUsdc)} USDC
        </text>
      </motion.g>

      {/* Marker annotation */}
      {markerIdx > 0 && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.6 }}
        >
          {breached ? (
            <>
              <line
                x1={xFor(markerIdx)}
                y1={yFor(equityPoints[markerIdx]) + 16}
                x2={xFor(markerIdx)}
                y2={yFor(equityPoints[markerIdx]) + 70}
                stroke="rgba(217,118,118,0.5)"
                strokeWidth="1"
              />
              <text
                x={xFor(markerIdx)}
                y={yFor(equityPoints[markerIdx]) + 86}
                textAnchor="middle"
                fill="#d97676"
                fontFamily="var(--font-mono)"
                fontSize="10"
              >
                ⚠ Threshold crossed · trade #{markerIdx}
              </text>
              <text
                x={xFor(markerIdx)}
                y={yFor(equityPoints[markerIdx]) + 100}
                textAnchor="middle"
                fill="var(--ink-faint)"
                fontFamily="var(--font-mono)"
                fontSize="10"
              >
                equity {fmt(equityPoints[markerIdx])} · claim becomes available
              </text>
            </>
          ) : (
            <>
              <line
                x1={xFor(markerIdx)}
                y1={yFor(equityPoints[markerIdx]) - 16}
                x2={xFor(markerIdx)}
                y2={yFor(equityPoints[markerIdx]) - 48}
                stroke="rgba(136,200,112,0.5)"
                strokeWidth="1"
              />
              <text
                x={xFor(markerIdx)}
                y={yFor(equityPoints[markerIdx]) - 56}
                textAnchor="middle"
                fill="#88c870"
                fontFamily="var(--font-mono)"
                fontSize="10"
              >
                ▲ Local peak · trade #{markerIdx}
              </text>
              <text
                x={xFor(markerIdx)}
                y={yFor(equityPoints[markerIdx]) - 44}
                textAnchor="middle"
                fill="var(--ink-faint)"
                fontFamily="var(--font-mono)"
                fontSize="10"
              >
                equity {fmt(equityPoints[markerIdx])}
              </text>
            </>
          )}
        </motion.g>
      )}

      {/* X-axis ticks */}
      <g>
        {equityPoints.map((_, i) => (
          <text
            key={i}
            x={xFor(i)}
            y={VIEW_H - 16}
            textAnchor="middle"
            fill="var(--ink-faint)"
            fontFamily="var(--font-mono)"
            fontSize="10"
          >
            {i === 0 ? "open" : `#${i}`}
          </text>
        ))}
      </g>
    </svg>
  );
}

function num(v: bigint): number {
  return Number(formatUnits(v, USDC_DECIMALS));
}

function fmt(v: number): string {
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function ticksFor(min: number, max: number): number[] {
  const range = max - min;
  const step = niceStep(range / 4);
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max; v += step) ticks.push(v);
  return ticks;
}

function niceStep(raw: number): number {
  const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow10;
  let nice;
  if (norm < 1.5) nice = 1;
  else if (norm < 3) nice = 2;
  else if (norm < 7) nice = 5;
  else nice = 10;
  return nice * pow10;
}
