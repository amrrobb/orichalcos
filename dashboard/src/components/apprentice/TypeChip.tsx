/**
 * Type chip — top-left of every Apprentice card.
 *
 * For Apprentices: brass background, no element color (element colors
 * reserved for Champions per DESIGN_SYSTEM §5).
 *
 * For Champions (when isChampion=true): element color takes over the chip
 * background — the only place element colors appear on a card chip.
 */
import type { ApprenticeType } from "@/lib/contracts";
import { TYPE_META } from "@/lib/constants";

interface TypeChipProps {
  type: ApprenticeType;
  isChampion?: boolean;
  size?: "sm" | "md";
}

export function TypeChip({ type, isChampion = false, size = "md" }: TypeChipProps) {
  const meta = TYPE_META[type];
  const padding = size === "sm" ? "px-2 py-[2px] text-[0.65rem]" : "px-2.5 py-[3px] text-xs";

  if (isChampion) {
    return (
      <span
        className={`label inline-block rounded-sm border ${padding}`}
        style={{
          color: "var(--surface-base)",
          background: `var(${meta.colorVar})`,
          borderColor: `var(${meta.colorVar})`,
          letterSpacing: "0.18em",
        }}
      >
        {meta.label.toUpperCase()}
      </span>
    );
  }

  return (
    <span
      className={`label inline-block rounded-sm ${padding}`}
      style={{
        color: "var(--brass)",
        background: "var(--surface-locked)",
        border: "1px solid var(--brass-dim)",
        letterSpacing: "0.18em",
      }}
    >
      {meta.label.toUpperCase()}
    </span>
  );
}
