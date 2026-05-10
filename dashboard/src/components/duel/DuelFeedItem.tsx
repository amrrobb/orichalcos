/**
 * Compact duel card for the landing-page live feed.
 *
 * Shows: two Apprentice mini portraits (name + Type chip), asset chip,
 * outcome badge, three small wax seals (TEE / 0G / Pyth).
 *
 * Per docs/USER_FLOW.md §1.1 'Lower-page (live feed)'.
 */
import Link from "next/link";
import { TypeChip } from "@/components/apprentice/TypeChip";
import { Mark } from "@/components/ui/Mark";
import type { DuelData } from "@/hooks/useDuel";
import { championByTokenId, nameOf } from "@/lib/championRoster";
import { pythFeedLabel } from "@/lib/constants";
import { directionLabel, formatPythPrice, relativeTime } from "@/lib/format";

interface DuelFeedItemProps {
  duelId: bigint;
  data: DuelData;
  observedAt: number;
}

const STATUS_LABELS = ["Open", "Committed", "Settled", "Cancelled"] as const;

export function DuelFeedItem({ duelId, data, observedAt }: DuelFeedItemProps) {
  const challenger = championByTokenId(data.challengerTokenId);
  const defender = championByTokenId(data.defenderTokenId);
  const challengerName = nameOf(data.challengerTokenId);
  const defenderName = nameOf(data.defenderTokenId);

  // Compute winner: priceAtSettle vs priceAtCommit. We don't store priceAtSettle
  // in the contract, so derive winner from the settled state — challenger won if
  // their direction matched the price move, OR if both called same direction
  // (challenger tie-break).
  // Simpler: read from the contract status — winner determined by ELO movement,
  // but we don't have pre/post here. Pull from data: who committed correctly.
  // For now: use the priceAtCommit + the calls. The actual settle price isn't
  // stored. Best UI signal: just show both calls and the asset; let the duel
  // detail page reveal who won.

  const challengerCallLabel = directionLabel(data.challengerCall);
  const defenderCallLabel = directionLabel(data.defenderCall);

  const status = STATUS_LABELS[Number(data.status)] ?? "—";

  return (
    <Link
      href={`/trials/${duelId}`}
      className="block bg-[var(--surface-raised)] rounded-[var(--radius-lg)] border border-[var(--rule)] hover:border-[var(--brass-dim)] transition-colors p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass-bright)]"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="label" style={{ fontSize: "0.6rem" }}>
          Trial #{duelId.toString()}
        </span>
        <span className="caption text-[var(--ink-faint)]">{relativeTime(observedAt)}</span>
      </div>

      {/* Two mini portraits */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4">
        <ChampionMini
          name={challengerName}
          type={challenger?.type}
          isChampion={!!challenger}
          call={challengerCallLabel}
        />
        <span className="label text-[var(--brass-dim)]" style={{ fontSize: "0.65rem" }}>vs</span>
        <ChampionMini
          name={defenderName}
          type={defender?.type}
          isChampion={!!defender}
          call={defenderCallLabel}
          align="right"
        />
      </div>

      {/* Asset + status row */}
      <div className="flex items-center justify-between text-[var(--ink-dim)] mb-3">
        <span
          className="mono caption px-2 py-1 rounded-sm bg-[var(--surface-locked)] border border-[var(--rule)]"
          style={{ fontSize: "0.7rem" }}
        >
          {pythFeedLabel(data.priceFeedId)}
        </span>
        <span className="caption">
          ${formatPythPrice(data.priceAtCommit)} →
        </span>
        <span
          className="label px-2 py-0.5"
          style={{
            fontSize: "0.6rem",
            color: status === "Settled" ? "var(--brass-bright)" : "var(--brass-dim)",
          }}
        >
          {status.toUpperCase()}
        </span>
      </div>

      {/* Three small wax seals + Mark watermark */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--rule)]">
        <div className="flex items-center gap-1.5 text-[var(--brass-dim)]">
          <SealStamp label="TEE" />
          <SealStamp label="0G" />
          <SealStamp label="Pyth" />
        </div>
        <span className="opacity-30">
          <Mark size="small" />
        </span>
      </div>
    </Link>
  );
}

function ChampionMini({
  name,
  type,
  isChampion,
  call,
  align = "left",
}: {
  name: string;
  type?: "Bold" | "Patient" | "Sharp" | "Stoic";
  isChampion: boolean;
  call: string;
  align?: "left" | "right";
}) {
  return (
    <div className={`flex flex-col gap-1 ${align === "right" ? "items-end text-right" : "items-start"}`}>
      <span
        className="display-3"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: isChampion ? 700 : 600,
          fontSize: "0.95rem",
          color: "var(--ink)",
        }}
      >
        {name}
      </span>
      <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {type && <TypeChip type={type} isChampion={isChampion} size="sm" />}
        <span
          className="mono caption"
          style={{
            color: call === "LONG" ? "var(--win)" : call === "SHORT" ? "var(--loss)" : "var(--ink-faint)",
            fontSize: "0.7rem",
          }}
        >
          {call}
        </span>
      </div>
    </div>
  );
}

function SealStamp({ label }: { label: string }) {
  return (
    <span
      className="mono caption inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-[var(--rule)]"
      style={{ fontSize: "0.6rem", color: "var(--brass-dim)" }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor">
        <polygon points="4,1 7,2.5 7,5.5 4,7 1,5.5 1,2.5" />
      </svg>
      {label}
    </span>
  );
}
