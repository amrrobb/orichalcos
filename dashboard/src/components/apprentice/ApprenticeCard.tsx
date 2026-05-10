/**
 * Apprentice card — 5:7 ratio (300x420 base) per docs/DESIGN_SYSTEM.md §5.
 *
 * Layout regions (top to bottom):
 *   1. Top bar: Type chip (left) + W:N-L:N record (right)
 *   2. Name + thin brass rule + Title label
 *   3. Soul Orb (center hero block)
 *   4. ELO numeral-hero
 *   5. Public-tell preview (italic, last duel's tell)
 *   6. Owner address chip + Mark watermark
 *
 * Title-tier ornament density (Initiate -> Sage) is communicated by progressively
 * thicker brass rules, corner notches, and (Sage only) a small filigree top.
 *
 * Champion variant: element color takes over name underline, chip, Soul Orb tone.
 */
import Link from "next/link";
import type { ApprenticeData } from "@/hooks/useApprentice";
import type { ApprenticeType } from "@/lib/contracts";
import { TITLES } from "@/lib/contracts";
import { TYPE_META } from "@/lib/constants";
import { championByTokenId, nameOf, type ChampionMeta } from "@/lib/championRoster";
import { formatAddress, formatElo } from "@/lib/format";
import { SoulOrb } from "./SoulOrb";
import { TypeChip } from "./TypeChip";
import { Mark } from "@/components/ui/Mark";

interface ApprenticeCardProps {
  tokenId: bigint;
  data?: ApprenticeData;
  publicTellPreview?: string;
  /** Whether the viewer owns this Apprentice. Currently always false in v2 demo. */
  ownedView?: boolean;
  /** Smaller variant for grids. */
  size?: "default" | "compact";
  /** Wrap card in Link to /apprentices/[tokenId]. */
  link?: boolean;
  className?: string;
  /** Override the per-Type hover signature class. Useful when card is inside another hover-tracked element. */
  noHover?: boolean;
}

export function ApprenticeCard({
  tokenId,
  data,
  publicTellPreview,
  ownedView = false,
  size = "default",
  link = false,
  className = "",
  noHover = false,
}: ApprenticeCardProps) {
  const champion = championByTokenId(tokenId);
  const isChampion = !!champion;

  const apprenticeType = data ? mapType(data.apprenticeType) : champion?.type;
  const meta = apprenticeType ? TYPE_META[apprenticeType] : undefined;
  const elementColor = isChampion && meta ? `var(${meta.colorVar})` : undefined;

  const titleIdx = data?.currentTitle ?? 0;
  const titleLabel = TITLES[titleIdx] ?? "Initiate";

  // Frame ornament density mapped from Title tier (DESIGN_SYSTEM §5)
  const frame = FRAME_BY_TITLE[titleIdx] ?? FRAME_BY_TITLE[0];

  const dims = size === "compact" ? COMPACT_DIMS : DEFAULT_DIMS;

  const cardInner = (
    <div
      className={`apprentice-card relative bg-[var(--surface-raised)] flex flex-col text-[var(--ink)] ${
        noHover ? "" : meta?.hoverClass ?? ""
      } ${className}`}
      data-type={apprenticeType ?? "Unknown"}
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: "var(--radius-card)",
        borderTop: frame.borderTop,
        borderRight: frame.borderRight,
        borderBottom: frame.borderBottom,
        borderLeft: frame.borderLeft,
        // Champion subtle background tint
        backgroundImage: isChampion && elementColor
          ? `linear-gradient(180deg, ${elementColor}14 0%, transparent 100%)`
          : undefined,
        boxShadow: "var(--shadow-card)",
        padding: dims.padding,
      }}
    >
      {/* Sage filigree (top-center) */}
      {frame.filigreeTop && <FiligreeOrnament position="top" />}

      {/* Top bar — Type chip + W/L */}
      <div className="flex items-center justify-between mb-3">
        <TypeChip type={apprenticeType ?? "Bold"} isChampion={isChampion} size={size === "compact" ? "sm" : "md"} />
        <span className="mono text-xs text-[var(--ink-dim)]">
          W:{data?.wins ?? 0} · L:{data?.losses ?? 0}
        </span>
      </div>

      {/* Name + rule + Title */}
      <div className="text-center mb-3">
        <h3
          className="display-3 leading-none"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: isChampion ? 700 : 600,
            fontSize: size === "compact" ? "1.25rem" : "1.5rem",
            color: "var(--ink)",
            letterSpacing: "0.02em",
          }}
        >
          {nameOf(tokenId, "Apprentice")}
        </h3>
        <div
          className="mt-2 mx-auto"
          style={{
            width: "60%",
            height: 1,
            background: isChampion && elementColor ? elementColor : "var(--brass-dim)",
            opacity: 0.6,
          }}
        />
        <p
          className="label mt-2"
          style={{ fontSize: size === "compact" ? "0.55rem" : "0.65rem" }}
        >
          {titleLabel.toUpperCase()}
          {data?.championBeaten && titleIdx >= 3 && (
            <span className="ml-1 text-[var(--brass-bright)]">★</span>
          )}
        </p>
      </div>

      {/* Soul Orb */}
      <div className="flex-1 flex items-center justify-center">
        <SoulOrb
          tokenId={tokenId}
          ownedView={ownedView}
          elementColor={isChampion && meta ? cssVarToHex(meta.colorVar) : undefined}
          size={size === "compact" ? 80 : 120}
        />
      </div>

      {/* ELO */}
      <div className="text-center mt-3">
        <p className="label" style={{ fontSize: "0.6rem", marginBottom: 2 }}>ELO</p>
        <p
          className="numeral mono"
          style={{
            fontSize: size === "compact" ? "1.75rem" : "2.5rem",
            color: "var(--brass-bright)",
            lineHeight: 1,
          }}
        >
          {formatElo(data?.elo)}
        </p>
      </div>

      {/* Public tell preview */}
      {publicTellPreview && size === "default" && (
        <p
          className="body-sm italic mt-3 mx-1 text-[var(--ink-dim)] line-clamp-2"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          “{publicTellPreview}”
        </p>
      )}

      {/* Footer: address + Mark */}
      {size === "default" && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--rule)]">
          <span className="address-chip" style={{ fontSize: "0.7rem" }}>
            {formatAddress(data?.mintedBy)}
          </span>
          <span className="opacity-30">
            <Mark size="small" />
          </span>
        </div>
      )}

      {/* Sage filigree (bottom-center) */}
      {frame.filigreeBottom && <FiligreeOrnament position="bottom" />}
    </div>
  );

  if (link) {
    return (
      <Link
        href={`/apprentices/${tokenId}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass-bright)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--surface-base)] rounded-[var(--radius-card)]"
      >
        {cardInner}
      </Link>
    );
  }
  return cardInner;
}

// ── Helpers ─────────────────────────────────────────────────────────

function mapType(idx: number | undefined): ApprenticeType {
  const arr: ApprenticeType[] = ["Bold", "Patient", "Sharp", "Stoic"];
  return arr[idx ?? 0] ?? "Bold";
}

const DEFAULT_DIMS = { w: 300, h: 420, padding: "16px" };
const COMPACT_DIMS = { w: 220, h: 308, padding: "12px" };

interface FrameSpec {
  borderTop: string;
  borderRight: string;
  borderBottom: string;
  borderLeft: string;
  filigreeTop: boolean;
  filigreeBottom: boolean;
}

const FRAME_BY_TITLE: Record<number, FrameSpec> = {
  // Initiate — plain hairline 1px
  0: {
    borderTop: "1px solid var(--brass-dim)",
    borderRight: "1px solid var(--brass-dim)",
    borderBottom: "1px solid var(--brass-dim)",
    borderLeft: "1px solid var(--brass-dim)",
    filigreeTop: false,
    filigreeBottom: false,
  },
  // Apprentice — slightly thicker, hint of inner shadow handled by box-shadow
  1: {
    borderTop: "1.5px solid var(--brass-dim)",
    borderRight: "1.5px solid var(--brass-dim)",
    borderBottom: "1.5px solid var(--brass-dim)",
    borderLeft: "1.5px solid var(--brass-dim)",
    filigreeTop: false,
    filigreeBottom: false,
  },
  // Adept — hairline + corner notches (rendered in CSS via ::before / ::after on card)
  // For now, thicker brass and slight glow. Corner notches added via FiligreeOrnament if needed later.
  2: {
    borderTop: "1.5px solid var(--brass)",
    borderRight: "1.5px solid var(--brass)",
    borderBottom: "1.5px solid var(--brass)",
    borderLeft: "1.5px solid var(--brass)",
    filigreeTop: false,
    filigreeBottom: false,
  },
  // Master — double rule via outline + filigree top
  3: {
    borderTop: "2px double var(--brass)",
    borderRight: "2px double var(--brass)",
    borderBottom: "2px double var(--brass)",
    borderLeft: "2px double var(--brass)",
    filigreeTop: true,
    filigreeBottom: false,
  },
  // Sage — double + filigree top + bottom
  4: {
    borderTop: "2.5px double var(--brass-bright)",
    borderRight: "2.5px double var(--brass-bright)",
    borderBottom: "2.5px double var(--brass-bright)",
    borderLeft: "2.5px double var(--brass-bright)",
    filigreeTop: true,
    filigreeBottom: true,
  },
};

function FiligreeOrnament({ position }: { position: "top" | "bottom" }) {
  const top = position === "top" ? "-8px" : undefined;
  const bottom = position === "bottom" ? "-8px" : undefined;
  return (
    <span
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top, bottom, color: "var(--brass-bright)" }}
      aria-hidden
    >
      <svg width="40" height="14" viewBox="0 0 40 14" fill="none" stroke="currentColor" strokeWidth="0.8">
        <path d="M2 7 Q10 1 20 7 Q30 13 38 7" />
        <circle cx="20" cy="7" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="6" cy="7" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="34" cy="7" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

/** Resolve a CSS variable name like '--agni' to its hex literal at build time
 *  for use in inline gradients (CSS vars don't work everywhere in box-shadow). */
function cssVarToHex(varName: string): string {
  const map: Record<string, string> = {
    "--agni": "#e85a3c",
    "--tirta": "#3aa0d3",
    "--bayu": "#cdd6dd",
    "--pertiwi": "#8a6a3a",
  };
  return map[varName] ?? "#c9a961";
}

/** Champion-aware export — accepts a ChampionMeta and synthesizes the data shape. */
export function ChampionCardFromMeta({
  champion,
  data,
  publicTellPreview,
  link = true,
}: {
  champion: ChampionMeta;
  data?: ApprenticeData;
  publicTellPreview?: string;
  link?: boolean;
}) {
  return (
    <ApprenticeCard
      tokenId={champion.tokenId}
      data={data}
      publicTellPreview={publicTellPreview}
      link={link}
    />
  );
}
