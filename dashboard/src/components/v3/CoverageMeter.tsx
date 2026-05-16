/**
 * Bond utilization bar — shows allocated coverage / bondAmount.
 *
 * Used in the strategy card and the buy-policy form. The "headroom" portion
 * is what an allocator can still buy.
 */
import { formatUsdc } from "@/lib/v3format";

interface Props {
  bondAmount: bigint;
  allocated: bigint;
  /** Optional preview overlay (e.g. while typing into the buy form). */
  pending?: bigint;
}

export function CoverageMeter({ bondAmount, allocated, pending = 0n }: Props) {
  const total = bondAmount === 0n ? 1n : bondAmount;
  const allocatedPct = Number((allocated * 10000n) / total) / 100;
  const pendingPct =
    Number(((allocated + pending) * 10000n) / total) / 100 - allocatedPct;
  const headroom = bondAmount - allocated - pending;
  const overflow = headroom < 0n;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="label">Coverage sold</span>
        <span className="mono text-xs text-[var(--ink-dim)]">
          {formatUsdc(allocated + pending)} / {formatUsdc(bondAmount)}
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden border border-[var(--rule)] flex"
        style={{ background: "var(--surface-locked)" }}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${Math.min(100, allocatedPct)}%`,
            background: "var(--brass)",
          }}
        />
        {pending > 0n && (
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.max(0, Math.min(100 - allocatedPct, pendingPct))}%`,
              background: overflow ? "var(--loss)" : "var(--brass-bright)",
              opacity: 0.55,
            }}
          />
        )}
      </div>
      <p className="caption text-[var(--ink-faint)] mt-1.5 mono">
        {overflow ? (
          <span style={{ color: "var(--loss)" }}>
            Exceeds bond by {formatUsdc(-headroom)} USDC
          </span>
        ) : (
          <>
            <span className="text-[var(--ink-dim)]">Available to claim:</span>{" "}
            {formatUsdc(headroom)} USDC
          </>
        )}
      </p>
    </div>
  );
}
