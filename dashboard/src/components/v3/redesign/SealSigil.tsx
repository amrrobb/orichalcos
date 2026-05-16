/**
 * Wax-seal sigil — four arcs around a center dot. Used as the brand mark
 * inside the strategy-dossier medallion, the insure strip seal, and the
 * landing-hero large sigil.
 */
"use client";

import { motion } from "framer-motion";

type Size = "small" | "medium" | "large";

const DIMENSIONS: Record<Size, { disc: number; svg: number }> = {
  small: { disc: 56, svg: 28 },
  medium: { disc: 96, svg: 46 },
  large: { disc: 220, svg: 120 },
};

export function SealSigil({ size = "medium", animate = false }: { size?: Size; animate?: boolean }) {
  const d = DIMENSIONS[size];
  return (
    <div
      style={{
        width: d.disc,
        height: d.disc,
        borderRadius: "50%",
        border: "1.5px solid var(--brass-deep)",
        background:
          "radial-gradient(circle at 30% 30%, rgba(212,165,116,0.18), transparent 60%), radial-gradient(circle at 70% 70%, rgba(212,165,116,0.06), transparent 60%), var(--surface-raised)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxShadow:
          "inset 0 0 20px rgba(0,0,0,0.5), 0 1px 0 rgba(212,165,116,0.1)",
      }}
    >
      <span
        style={{
          content: '""',
          position: "absolute",
          inset: 6,
          borderRadius: "50%",
          border: "1px dashed rgba(212,165,116,0.25)",
          pointerEvents: "none",
        }}
      />
      <motion.svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="#d4a574"
        strokeWidth="1.4"
        strokeLinecap="round"
        width={d.svg}
        height={d.svg}
        animate={animate ? { rotate: 360 } : undefined}
        transition={animate ? { duration: 32, repeat: Infinity, ease: "linear" } : undefined}
      >
        <circle cx="32" cy="32" r="3.5" fill="#d4a574" stroke="none" />
        <path d="M32 12 a20 20 0 0 1 14 6" />
        <path d="M52 32 a20 20 0 0 1 -6 14" />
        <path d="M32 52 a20 20 0 0 1 -14 -6" />
        <path d="M12 32 a20 20 0 0 1 6 -14" />
        <circle cx="32" cy="32" r="22" strokeDasharray="1 3" opacity="0.5" />
      </motion.svg>
    </div>
  );
}
