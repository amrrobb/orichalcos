/**
 * Apprentice detail — `/apprentices/[tokenId]`.
 *
 * Per docs/USER_FLOW.md Flow 3.1 (adapted for v2 demo scope):
 *   Top: hero card 1.5x scale, stats panel right (ELO, W/L, Title progression).
 *   Middle: Recent Trials horizontal scroll.
 *   Bottom: action bar (Begin a Trial — disabled in v2, mint flow cut).
 */
"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { ApprenticeCard } from "@/components/apprentice/ApprenticeCard";
import { TitleProgress } from "@/components/apprentice/TitleProgress";
import { useApprentice } from "@/hooks/useApprentice";
import { useDuelEvents } from "@/hooks/useDuelEvents";
import { championByTokenId, nameOf } from "@/lib/championRoster";
import { TYPE_META } from "@/lib/constants";
import { formatAddress, formatElo, titleLabel, typeLabel } from "@/lib/format";
import { DuelFeedItem } from "@/components/duel/DuelFeedItem";
import { Mark } from "@/components/ui/Mark";

export default function ApprenticeDetail() {
  const params = useParams<{ tokenId: string }>();
  const idStr = params.tokenId;
  const tokenId = idStr ? safeBigInt(idStr) : undefined;

  if (idStr && tokenId === undefined) {
    notFound();
  }

  const { data, isLoading, isError } = useApprentice(tokenId);
  const { duels } = useDuelEvents();
  const champion = tokenId !== undefined ? championByTokenId(tokenId) : undefined;
  const isChampion = !!champion;

  // Filter recent duels involving this Apprentice
  const recentTrials = tokenId
    ? duels.filter(
        (d) => d.data.challengerTokenId === tokenId || d.data.defenderTokenId === tokenId
      )
    : [];

  if (tokenId === undefined) return null; // safe guard, notFound triggered above

  // Special-case: token 0 is the genesis burner per Codex docs
  const isGenesis = tokenId === 0n;

  if (isError) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
        <h1 className="display-2 mb-3" style={{ fontFamily: "var(--font-display)" }}>
          This binding is not yet woven.
        </h1>
        <p className="caption text-[var(--ink-faint)] mb-8">
          Apprentice #{tokenId.toString()} does not exist on chain.
        </p>
        <Link
          href="/trials/champions"
          className="caption text-[var(--brass-bright)] hover:underline underline-offset-4"
        >
          Witness the Champions →
        </Link>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center text-[var(--ink-faint)]">
        <Mark size="medium" animate />
        <p className="caption mt-4">Decrypting…</p>
      </div>
    );
  }

  const apprenticeTypeStr = typeLabel(data.apprenticeType);
  const meta = apprenticeTypeStr in TYPE_META ? TYPE_META[apprenticeTypeStr as keyof typeof TYPE_META] : undefined;
  const winRate =
    data.wins + data.losses > 0
      ? Math.round((data.wins / (data.wins + data.losses)) * 100)
      : 0;

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <Link
        href="/trials/champions"
        className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] transition-colors mb-6 inline-block"
      >
        ← The Champions
      </Link>

      {isGenesis && (
        <div className="mb-8 px-4 py-3 rounded-md border border-[var(--rule)] bg-[var(--surface-locked)]">
          <p className="caption text-[var(--ink-dim)]">
            <span className="label mr-2">Genesis Burner</span>
            This Apprentice was minted to consume tokenId 0 reserved by the Codex protocol. It
            never enters the arena.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-12 items-start mb-16">
        {/* Hero card at 1.5x */}
        <div className="flex justify-center" style={{ transform: "scale(1.05)", transformOrigin: "top center" }}>
          <ApprenticeCard tokenId={tokenId} data={data} />
        </div>

        {/* Stats panel */}
        <div className="space-y-8">
          <div>
            <p className="label mb-2">{isChampion ? "Champion of " + apprenticeTypeStr : apprenticeTypeStr + " Apprentice"}</p>
            <h1
              className="leading-[1.05] mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: isChampion ? 700 : 600,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                letterSpacing: "0.01em",
              }}
            >
              {nameOf(tokenId)}
            </h1>
            {meta && (
              <p className="body-sm text-[var(--ink-dim)] max-w-md italic" style={{ fontFamily: "var(--font-display)" }}>
                {meta.shortDescription}
              </p>
            )}
            {champion && (
              <p className="caption text-[var(--ink-faint)] mt-2 italic">
                Sanskrit/Indonesian element: {champion.elementMeaning}
              </p>
            )}
          </div>

          {/* Title progression */}
          <div>
            <p className="label mb-3">Title</p>
            <TitleProgress currentTitle={data.currentTitle} />
            <p className="caption text-[var(--ink-faint)] mt-3">
              Currently <span className="text-[var(--brass-bright)] mono">{titleLabel(data.currentTitle).toUpperCase()}</span>
              {data.championBeaten && data.currentTitle >= 3 && (
                <span className="ml-2 text-[var(--brass-bright)]">★ Champion-beaten</span>
              )}
            </p>
          </div>

          {/* ELO + record */}
          <div className="grid grid-cols-3 gap-6">
            <Stat label="ELO" value={formatElo(data.elo)} accent />
            <Stat label="Wins" value={data.wins.toString()} />
            <Stat label="Losses" value={data.losses.toString()} />
          </div>

          {/* Win rate bar */}
          {data.wins + data.losses > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="label">Win rate</p>
                <p className="mono caption text-[var(--brass-bright)]">{winRate}%</p>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface-locked)] overflow-hidden border border-[var(--rule)]">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${winRate}%`,
                    background:
                      winRate >= 60
                        ? "var(--win)"
                        : winRate >= 40
                        ? "var(--brass)"
                        : "var(--loss)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Sealed soul evidence */}
          <div className="border border-[var(--rule)] rounded-md p-4 bg-[var(--surface-raised)]">
            <p className="label mb-2">Sealed soul</p>
            <p className="caption text-[var(--ink-dim)] mb-2">
              Encrypted with AES-256-GCM. Stored on 0G. Decrypted only inside a hardware
              enclave. The owner cannot read it.
            </p>
            <p className="mono text-xs text-[var(--brass-dim)] break-all">
              {data.sealedSoulRoot}
            </p>
          </div>

          {/* Owner */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--rule)]">
            <p className="caption text-[var(--ink-faint)]">Owned by</p>
            <span className="address-chip">{formatAddress(data.mintedBy)}</span>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-3 pt-4">
            <button
              disabled
              className="px-5 py-2.5 rounded-md font-medium opacity-40 cursor-not-allowed"
              style={{
                background: "var(--brass-dim)",
                color: "var(--surface-base)",
                fontFamily: "var(--font-sans)",
              }}
              title="Available after sealed mint flow ships"
            >
              Begin a Trial
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] transition-colors"
            >
              See recent Trials →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Trials */}
      {recentTrials.length > 0 && (
        <div className="border-t border-[var(--rule)] pt-12">
          <h2
            className="display-3 mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Recent Trials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTrials.slice(0, 6).map((d) => (
              <DuelFeedItem
                key={d.duelId.toString()}
                duelId={d.duelId}
                data={d.data}
                observedAt={d.observedAt}
              />
            ))}
          </div>
        </div>
      )}

      {recentTrials.length === 0 && !isGenesis && (
        <div className="border-t border-[var(--rule)] pt-12 text-center">
          <p className="display-3 mb-2" style={{ fontFamily: "var(--font-display)" }}>
            This Apprentice has not yet faced a Trial.
          </p>
          <p className="caption text-[var(--ink-faint)]">Check the live feed on the landing page.</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <p
        className="mono numeral"
        style={{
          fontSize: accent ? "2.25rem" : "1.5rem",
          color: accent ? "var(--brass-bright)" : "var(--ink)",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function safeBigInt(s: string): bigint | undefined {
  if (!/^\d+$/.test(s)) return undefined;
  try {
    return BigInt(s);
  } catch {
    return undefined;
  }
}
