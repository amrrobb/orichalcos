/**
 * Wax seal — clickable hexagonal stamp for TEE / 0G / Pyth attestation.
 *
 * Inline SVG so currentColor cascades from button color (brass).
 * Click opens VerifyModal with the underlying evidence + chainscan link.
 *
 * Per docs/DESIGN_SYSTEM.md §6.
 */
"use client";

import { useState } from "react";

type SealKind = "tee" | "0g" | "pyth";

interface WaxSealProps {
  kind: SealKind;
  size?: number;
  /** When true, this seal renders mid-stamp with glow — used during Mind Reveal. */
  stamping?: boolean;
  onClick?: () => void;
  className?: string;
}

const LABELS: Record<SealKind, string> = {
  tee: "TEE attestation",
  "0g": "0G Storage",
  pyth: "Pyth oracle",
};

export function WaxSeal({ kind, size = 56, stamping = false, onClick, className = "" }: WaxSealProps) {
  const [hover, setHover] = useState(false);

  // The TEE seal is rendered slightly larger per the optional advisor anti-uniformity
  // quirk #4 (mismatched seal). Skipped for now — uniform seal widths look cleaner.
  // const sizeMultiplier = kind === "tee" ? 1.0 : 1.0;

  const filterStyle = hover || stamping
    ? "drop-shadow(0 0 12px rgba(230, 201, 135, 0.55))"
    : "drop-shadow(0 0 4px rgba(0, 0, 0, 0.6))";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`relative inline-flex items-center justify-center rounded-md transition-transform ${onClick ? "cursor-pointer" : "cursor-default"} ${className}`}
      style={{
        width: size,
        height: size,
        color: "var(--brass)",
        filter: filterStyle,
        transform: stamping ? "scale(1)" : hover ? "scale(1.05)" : "scale(1)",
        transition: "transform 200ms var(--ease-out), filter 200ms var(--ease-out)",
      }}
      aria-label={LABELS[kind]}
      title={LABELS[kind]}
    >
      <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}>
        <polygon points="40,8 72,24 72,56 40,72 8,56 8,24" />
        {kind === "tee" && (
          <>
            <path d="M40 24v32M28 36h24M28 48h24" strokeWidth="1.5" />
            <text x="40" y="44" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="9" textAnchor="middle" fill="currentColor" stroke="none" letterSpacing="0.1em">TEE</text>
          </>
        )}
        {kind === "0g" && (
          <>
            <circle cx="40" cy="40" r="14" strokeWidth="1.5" />
            <text x="40" y="44" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="9" textAnchor="middle" fill="currentColor" stroke="none" letterSpacing="0.1em">0G</text>
          </>
        )}
        {kind === "pyth" && (
          <>
            <path d="M28 50 L40 26 L52 50 Z" strokeWidth="1.5" />
            <text x="40" y="62" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="8" textAnchor="middle" fill="currentColor" stroke="none" letterSpacing="0.1em">PYTH</text>
          </>
        )}
      </svg>
    </button>
  );
}
