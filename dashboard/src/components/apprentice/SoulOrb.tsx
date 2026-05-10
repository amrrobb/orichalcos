/**
 * Soul Orb — center hero block of the Apprentice card.
 *
 * SEALED state (visitor view): solid surface-locked disc with faint scrambled
 * hex characters slowly drifting and a subtle brass-dim glow.
 *
 * OWNED state (Trainer view): brass-bright glow, gradient seeded from tokenId
 * for per-Apprentice variety (anti-uniformity rule §9.5.4 — minus the
 * feTurbulence; cut for time).
 *
 * CHAMPION variant: element-color tone takes the place of brass.
 *
 * Per docs/DESIGN_SYSTEM.md §5 'Soul Orb (center hero block)'.
 */
"use client";

import { useMemo } from "react";

interface SoulOrbProps {
  tokenId?: bigint;
  /** When the viewer is the owner, the orb shows the Mark instead of cipher. */
  ownedView?: boolean;
  /** Champion variant uses element color instead of brass. */
  elementColor?: string;
  /** Brass-bright "ping" applied on first render — used after a victory. */
  ping?: boolean;
  size?: number;
}

const CIPHER_CHARS = "0123456789abcdefABCDEFअईऊऋएएॐ𓂀𓂁𓂂".split("");

export function SoulOrb({
  tokenId,
  ownedView = false,
  elementColor,
  ping = false,
  size = 120,
}: SoulOrbProps) {
  // Deterministic per-tokenId gradient angle (no feTurbulence, no random draws).
  const seed = tokenId !== undefined ? Number(tokenId % 17n) : 0;
  const gradientAngle = (seed * 21) % 360;
  const accent = elementColor ?? "var(--brass)";
  const accentDim = elementColor ? `${elementColor}55` : "var(--brass-dim)";

  // 12 cipher chars at deterministic positions for a "drift" feel without random.
  const cipher = useMemo(() => {
    const out: { char: string; x: number; y: number; delay: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const idx = (seed * 7 + i * 13) % CIPHER_CHARS.length;
      out.push({
        char: CIPHER_CHARS[idx],
        x: 15 + ((i * 37) % 70), // 15..85%
        y: 15 + ((i * 53) % 70),
        delay: i * 0.4,
      });
    }
    return out;
  }, [seed]);

  return (
    <div
      className={`soul-orb relative rounded-full overflow-hidden ${ping ? "soul-orb-ping" : ""}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at ${30 + (seed % 40)}% ${30 + (seed * 3) % 40}%,
                     ${accentDim} 0%, var(--surface-locked) 60%, var(--surface-base) 100%)`,
        boxShadow: ownedView
          ? `0 0 32px ${accent}33, inset 0 0 16px ${accentDim}`
          : `0 0 12px var(--brass-dim)33, inset 0 0 16px rgba(0,0,0,0.5)`,
        transform: `rotate(${gradientAngle}deg)`,
      }}
      aria-hidden
    >
      {/* Cipher cascade — sealed state */}
      {!ownedView &&
        cipher.map((c, i) => (
          <span
            key={i}
            className="absolute select-none pointer-events-none"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: accent,
              opacity: 0.35,
              transform: `skew(-3deg) translateY(0)`,
              animation: `soul-drift 6s ease-in-out ${c.delay}s infinite`,
            }}
          >
            {c.char}
          </span>
        ))}

      {/* Owned state — small Mark sigil */}
      {ownedView && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: accent, transform: `rotate(-${gradientAngle}deg)` }}
        >
          <span className="opacity-70">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" width="60%" height="60%">
              <rect x="14" y="14" width="4" height="4" />
              <circle cx="16" cy="5" r="4.5" />
              <circle cx="27" cy="16" r="4.5" />
              <circle cx="16" cy="27" r="4.5" />
              <circle cx="5" cy="16" r="4.5" />
            </svg>
          </span>
        </span>
      )}

      <style jsx>{`
        @keyframes soul-drift {
          0%, 100% { transform: skew(-3deg) translateY(0); opacity: 0.2; }
          50% { transform: skew(-3deg) translateY(-3px); opacity: 0.5; }
        }
        .soul-orb-ping::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 9999px;
          box-shadow: 0 0 0 2px var(--brass-bright);
          opacity: 0;
          animation: orb-ping 1.4s ease-out 1;
        }
        @keyframes orb-ping {
          0% { opacity: 0.8; transform: scale(0.95); }
          100% { opacity: 0; transform: scale(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          .soul-orb span { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
