/**
 * Spec strip — monospace passport row that collapses 6 stat cards into a
 * single ledger row. Used at the top of every strategy-dossier page.
 */
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface SpecCell {
  k: string;
  v: ReactNode;
  unit?: string;
  sub?: string;
  tone?: "default" | "warn" | "win" | "brass";
}

export function SpecStrip({ cells }: { cells: SpecCell[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      style={{
        display: "flex",
        flexWrap: "wrap",
        border: "1px solid var(--rule)",
        borderRadius: 6,
        background:
          "linear-gradient(180deg, var(--surface-raised), var(--surface-deep))",
        marginBottom: "2.25rem",
        overflow: "hidden",
      }}
    >
      {cells.map((c, i) => {
        const last = i === cells.length - 1;
        const toneColor =
          c.tone === "warn"
            ? "var(--loss)"
            : c.tone === "win"
              ? "var(--win)"
              : c.tone === "brass"
                ? "var(--brass)"
                : "var(--ink)";
        return (
          <div
            key={i}
            style={{
              flex: "1 1 0",
              minWidth: 140,
              padding: "0.85rem 1.1rem",
              borderRight: last ? 0 : "1px solid var(--rule)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "var(--ink-faint)",
                marginBottom: "0.4rem",
              }}
            >
              {c.k}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.05rem",
                color: toneColor,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {c.v}
              {c.unit && (
                <small
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 400,
                    color: "var(--ink-faint)",
                    marginLeft: "0.25rem",
                    letterSpacing: 0,
                  }}
                >
                  {c.unit}
                </small>
              )}
            </div>
            {c.sub && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--ink-faint)",
                  marginTop: "0.3rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {c.sub}
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
