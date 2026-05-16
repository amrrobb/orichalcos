/**
 * Orichalcos brand mark — four ringed nodes arranged in a cross around a
 * central square, all in brass. Used as the brand mark inside the strategy-
 * dossier medallion, the insure strip seal, the landing-hero large sigil,
 * and the onboarding modal.
 *
 * The mark is intrinsically square (the cross is axis-aligned), so the
 * disc wrapper around it is decorative — same visual chrome as before to
 * keep the dossier aesthetic intact.
 */
"use client";

import { motion } from "framer-motion";

type Size = "small" | "medium" | "large";

const DIMENSIONS: Record<Size, { disc: number; svg: number }> = {
  small: { disc: 56, svg: 32 },
  medium: { disc: 96, svg: 56 },
  large: { disc: 220, svg: 140 },
};

export function SealSigil({
  size = "medium",
  animate = false,
  /** When true, drops the disc wrapper and just renders the mark — useful
   *  for header/footer brand-mark spots that want a raw glyph. */
  bare = false,
}: {
  size?: Size;
  animate?: boolean;
  bare?: boolean;
}) {
  const d = DIMENSIONS[size];

  const mark = (
    <motion.svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="#d4a574"
      width={d.svg}
      height={d.svg}
      animate={animate ? { rotate: 360 } : undefined}
      transition={animate ? { duration: 40, repeat: Infinity, ease: "linear" } : undefined}
      style={{ overflow: "visible" }}
    >
      {/* connector bars from the central square out to each ring.
          Geometry: center square is 12px wide, centered at (50,50).
          Rings sit at cy/cx = 18 and 82, radius 14, ring stroke 4.
          Bars extend from edge of square (44 / 56) to edge of ring (32 / 68). */}
      <g stroke="#d4a574" strokeWidth="4" strokeLinecap="butt">
        <line x1="50" y1="44" x2="50" y2="32" /> {/* top */}
        <line x1="50" y1="56" x2="50" y2="68" /> {/* bottom */}
        <line x1="44" y1="50" x2="32" y2="50" /> {/* left */}
        <line x1="56" y1="50" x2="68" y2="50" /> {/* right */}
      </g>

      {/* central square — outlined frame, transparent interior */}
      <rect x="44" y="44" width="12" height="12" stroke="#d4a574" strokeWidth="3" fill="none" />

      {/* four ringed nodes — outlined circles + filled pupils */}
      {/* top */}
      <circle cx="50" cy="18" r="14" stroke="#d4a574" strokeWidth="4" fill="none" />
      <circle cx="50" cy="18" r="4.5" fill="#d4a574" stroke="none" />
      {/* bottom */}
      <circle cx="50" cy="82" r="14" stroke="#d4a574" strokeWidth="4" fill="none" />
      <circle cx="50" cy="82" r="4.5" fill="#d4a574" stroke="none" />
      {/* left */}
      <circle cx="18" cy="50" r="14" stroke="#d4a574" strokeWidth="4" fill="none" />
      <circle cx="18" cy="50" r="4.5" fill="#d4a574" stroke="none" />
      {/* right */}
      <circle cx="82" cy="50" r="14" stroke="#d4a574" strokeWidth="4" fill="none" />
      <circle cx="82" cy="50" r="4.5" fill="#d4a574" stroke="none" />
    </motion.svg>
  );

  if (bare) return mark;

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
          position: "absolute",
          inset: 6,
          borderRadius: "50%",
          border: "1px dashed rgba(212,165,116,0.25)",
          pointerEvents: "none",
        }}
      />
      {mark}
    </div>
  );
}
