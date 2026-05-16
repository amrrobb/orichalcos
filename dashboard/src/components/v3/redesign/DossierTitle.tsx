/**
 * Page-level dossier header: brass-mono eyebrow + serif italic title.
 * Shared across strategy detail, insure, and (in a stripped form) landing.
 */
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function DossierEyebrow({ items }: { items: ReactNode[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.7rem",
        color: "var(--brass)",
        textTransform: "uppercase",
        letterSpacing: "0.28em",
        marginBottom: "0.85rem",
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        flexWrap: "wrap",
      }}
    >
      {items.map((item, i) => (
        <span key={i} style={i % 2 === 1 ? { color: "var(--ink-ghost)" } : undefined}>
          {item}
        </span>
      ))}
    </motion.div>
  );
}

export function DossierTitle({ children }: { children: ReactNode }) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(2.4rem, 4.6vw, 3.6rem)",
        fontWeight: 600,
        lineHeight: 1.02,
        letterSpacing: "-0.012em",
        color: "var(--ink)",
      }}
    >
      {children}
    </motion.h1>
  );
}

export function DossierEm({ children }: { children: ReactNode }) {
  return (
    <em
      style={{
        fontStyle: "italic",
        fontWeight: 400,
        color: "var(--brass)",
      }}
    >
      {children}
    </em>
  );
}
