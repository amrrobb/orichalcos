/**
 * Brass section eyebrow with optional numeral marker. Used to introduce
 * narrative sections (§ I, § II …) on landing & insure.
 */
"use client";

import type { ReactNode } from "react";

export function SectionEyebrow({
  numeral,
  children,
}: {
  numeral?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.7rem",
        color: "var(--brass)",
        textTransform: "uppercase",
        letterSpacing: "0.28em",
        marginBottom: "0.85rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      {numeral && <span style={{ color: "var(--ink-faint)" }}>{numeral}</span>}
      <span>{children}</span>
    </div>
  );
}

export function SerifHeading({
  children,
  size = "h2",
}: {
  children: ReactNode;
  size?: "h2" | "h3";
}) {
  const Tag = size;
  const fontSize = size === "h2" ? "clamp(2rem, 3.6vw, 2.8rem)" : "1.75rem";
  return (
    <Tag
      style={{
        fontFamily: "var(--font-display)",
        fontSize,
        fontWeight: 600,
        lineHeight: size === "h2" ? 1.08 : 1.1,
        letterSpacing: "-0.01em",
        color: "var(--ink)",
      }}
    >
      {children}
    </Tag>
  );
}
