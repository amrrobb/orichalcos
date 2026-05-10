/**
 * Pipeline status — shows the 7 steps a Scrying Duel passes through.
 *
 * For settled duels (the common case in v2), all steps are 'done'. For
 * Open/Committed duels (rare in v2 demo, but defensive) the bar shows
 * progress accurately.
 *
 * Per docs/USER_FLOW.md §3.3 'Below cards: status bar showing pipeline progress'.
 */
"use client";

import type { DuelData } from "@/hooks/useDuel";

interface PipelineStatusProps {
  data: DuelData;
}

const STEPS = [
  "Sealed souls fetched",
  "TEE inference (challenger)",
  "TEE inference (defender)",
  "Direction commits on-chain",
  "Settlement window",
  "Pyth oracle reading",
  "Outcome on-chain",
];

export function PipelineStatus({ data }: PipelineStatusProps) {
  const status = Number(data.status);
  const challengerCommitted = data.challengerCommitted;
  const defenderCommitted = data.defenderCommitted;
  const settled = status === 2;

  const stepStates: ("done" | "active" | "pending")[] = [
    // Steps 1-3 are off-chain agent work; we don't see them as on-chain state.
    // For any duel that has at least one commit, treat the first 3 as done.
    challengerCommitted || defenderCommitted ? "done" : "active",
    challengerCommitted ? "done" : "pending",
    defenderCommitted ? "done" : "pending",
    challengerCommitted && defenderCommitted ? "done" : "pending",
    settled ? "done" : challengerCommitted && defenderCommitted ? "active" : "pending",
    settled ? "done" : "pending",
    settled ? "done" : "pending",
  ];

  return (
    <ol className="grid grid-cols-1 md:grid-cols-7 gap-2 text-center">
      {STEPS.map((step, i) => {
        const state = stepStates[i];
        return (
          <li key={step} className="flex md:flex-col items-center gap-3 md:gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                background:
                  state === "done"
                    ? "var(--brass-bright)"
                    : state === "active"
                    ? "var(--brass)"
                    : "transparent",
                border: state === "pending" ? "1px solid var(--brass-dim)" : "none",
                boxShadow: state === "active" ? "0 0 8px var(--brass)" : "none",
              }}
            />
            <span
              className="caption md:text-center"
              style={{
                fontSize: "0.65rem",
                color:
                  state === "done"
                    ? "var(--ink-dim)"
                    : state === "active"
                    ? "var(--brass-bright)"
                    : "var(--ink-faint)",
              }}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
