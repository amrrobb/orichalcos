/**
 * Slim ochre breach-rule strip — pinned under the header on pages that
 * inspect a breach-state strategy. State-as-information, not state-as-popup.
 */
"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

export function BreachRule({
  visible,
  label,
  message,
  jumpHref,
  jumpLabel,
}: {
  visible: boolean;
  label: string;
  message: ReactNode;
  jumpHref?: string;
  jumpLabel?: string;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background:
              "linear-gradient(180deg, rgba(217,118,118,0.07), rgba(217,118,118,0.02))",
            borderBottom: "1px solid rgba(217,118,118,0.35)",
            borderTop: "1px solid rgba(217,118,118,0.18)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              padding: "0.65rem 2rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              fontSize: "0.82rem",
              flexWrap: "wrap",
            }}
          >
            <span className="breach-pulse-dot" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "var(--loss)",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              {label}
            </span>
            <span style={{ color: "var(--ink-dim)" }}>{message}</span>
            {jumpHref && jumpLabel && (
              <Link
                href={jumpHref}
                style={{
                  marginLeft: "auto",
                  color: "var(--loss)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  borderBottom: "1px dashed rgba(217,118,118,0.4)",
                  paddingBottom: 1,
                }}
              >
                {jumpLabel}
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
