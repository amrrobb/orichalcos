/**
 * The Quincunx Sigil — Orichalcos's mark.
 *
 * Three sizes per docs/DESIGN_SYSTEM.md §4. SVGs rendered inline so
 * `stroke="currentColor"` picks up the parent's CSS color (brass by default).
 *
 * The Mark rotates with a "breath" pause every fourth rotation when `animate`
 * is true (anti-uniformity rule §9.5.11). Class `mark-rotate` is defined in
 * globals.css and respects prefers-reduced-motion.
 */

type Size = "large" | "medium" | "small";

interface MarkProps {
  size?: Size;
  animate?: boolean;
  className?: string;
  color?: string;
}

const PIXELS: Record<Size, number> = {
  large: 96,
  medium: 32,
  small: 16,
};

export function Mark({ size = "medium", animate = false, className = "", color }: MarkProps) {
  const px = PIXELS[size];
  const wrapperClass = `inline-block ${animate ? "mark-rotate" : ""} ${className}`;
  const style = { color: color ?? "var(--brass)", width: px, height: px };

  return (
    <span className={wrapperClass} style={style} aria-hidden>
      {size === "large" && <MarkLargeSvg />}
      {size === "medium" && <MarkMediumSvg />}
      {size === "small" && <MarkSmallSvg />}
    </span>
  );
}

function MarkLargeSvg() {
  return (
    <svg viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1.5" width="100%" height="100%">
      {/* Center bound node */}
      <rect x="42" y="42" width="12" height="12" strokeWidth="2" />
      {/* Four element circles */}
      <circle cx="48" cy="14" r="14" />
      <circle cx="82" cy="48" r="14" />
      <circle cx="48" cy="82" r="14" />
      <circle cx="14" cy="48" r="14" />
      {/* Connecting lines from center */}
      <line x1="48" y1="42" x2="48" y2="28" />
      <line x1="54" y1="48" x2="68" y2="48" />
      <line x1="48" y1="54" x2="48" y2="68" />
      <line x1="42" y1="48" x2="28" y2="48" />
      {/* Element glyphs */}
      <path d="M48 7 L54 19 L42 19 Z" />
      <path d="M75 48 Q78 45 82 48 T89 48" />
      <rect x="44" y="78" width="8" height="8" transform="rotate(45 48 82)" />
      <path d="M14 48 a4 4 0 0 1 4 -4 a3 3 0 0 1 0 6 a2 2 0 0 1 -2 -2" />
    </svg>
  );
}

function MarkMediumSvg() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" width="100%" height="100%">
      <rect x="14" y="14" width="4" height="4" strokeWidth="1.25" />
      <circle cx="16" cy="5" r="4.5" />
      <circle cx="27" cy="16" r="4.5" />
      <circle cx="16" cy="27" r="4.5" />
      <circle cx="5" cy="16" r="4.5" />
      <line x1="16" y1="14" x2="16" y2="9.5" />
      <line x1="18" y1="16" x2="22.5" y2="16" />
      <line x1="16" y1="18" x2="16" y2="22.5" />
      <line x1="14" y1="16" x2="9.5" y2="16" />
      <circle cx="16" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="27" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16" cy="27" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="5" cy="16" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MarkSmallSvg() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="0.75" width="100%" height="100%">
      <circle cx="8" cy="2.5" r="2" />
      <circle cx="13.5" cy="8" r="2" />
      <circle cx="8" cy="13.5" r="2" />
      <circle cx="2.5" cy="8" r="2" />
    </svg>
  );
}
