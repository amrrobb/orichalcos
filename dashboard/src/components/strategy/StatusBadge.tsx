/**
 * Strategy epoch status badge. Color-coded per docs/DESIGN_SYSTEM palette:
 *   Idle      → ink-dim   (neutral)
 *   Active    → win green
 *   Breached  → loss red
 *   Settled   → ink-faint (grey)
 */
import { EPOCH_STATUSES } from "@/lib/contracts";

interface Props {
  status: number;
}

const COLOR: Record<(typeof EPOCH_STATUSES)[number], { bg: string; fg: string; border: string }> = {
  Idle:     { bg: "rgba(168,163,148,0.10)", fg: "var(--ink-dim)",      border: "var(--rule)" },
  Active:   { bg: "rgba(106,170,100,0.14)", fg: "var(--win)",          border: "rgba(106,170,100,0.35)" },
  Breached: { bg: "rgba(196, 80, 76,0.16)", fg: "var(--loss)",         border: "rgba(196,80,76,0.45)" },
  Settled:  { bg: "rgba(94, 91, 81,0.18)",  fg: "var(--ink-faint)",    border: "var(--rule)" },
};

export function StatusBadge({ status }: Props) {
  const label = EPOCH_STATUSES[status] ?? "Unknown";
  const palette = COLOR[label as keyof typeof COLOR] ?? COLOR.Idle;
  return (
    <span
      className="label inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border"
      style={{
        fontSize: "0.7rem",
        color: palette.fg,
        background: palette.bg,
        borderColor: palette.border,
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: palette.fg }}
      />
      {label.toUpperCase()}
    </span>
  );
}
