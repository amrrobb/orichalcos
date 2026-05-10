/**
 * /debug — Unit 2 verification page. Reads live on-chain state via the new hooks
 * and renders raw JSON. Not in the demo path; stays in dev for diagnostics.
 */
"use client";
import { useChampions } from "@/hooks/useChampions";
import { useNextDuelId, useDuel, usePublicTell } from "@/hooks/useDuel";
import { useDuelEvents } from "@/hooks/useDuelEvents";
import { ApprenticeCard } from "@/components/apprentice/ApprenticeCard";
import { CHAMPIONS } from "@/lib/championRoster";

function safeStringify(v: unknown) {
  return JSON.stringify(v, (_, val) => (typeof val === "bigint" ? val.toString() + "n" : val), 2);
}

export default function DebugPage() {
  const { champions, isLoading: champLoading, isError: champError } = useChampions();
  const { data: nextDuelId } = useNextDuelId();
  const { duels, isLive, isLoading: feedLoading } = useDuelEvents();
  const sampleDuel = useDuel(3);
  const sampleTell = usePublicTell(sampleDuel.data?.challengerTellHash);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12 space-y-10">
      <h1 className="display-2" style={{ fontFamily: "var(--font-display)" }}>
        /debug — Unit 2 hooks
      </h1>

      <section>
        <h2 className="display-3 mb-3">useChampions() — visual</h2>
        <p className="caption text-[var(--ink-faint)] mb-4">
          loading={String(champLoading)} error={String(champError)}
        </p>
        <div className="flex flex-wrap gap-6 mb-4">
          {CHAMPIONS.map((champ, i) => {
            const data = champions[i]?.data;
            return <ApprenticeCard key={champ.name} tokenId={champ.tokenId} data={data} link />;
          })}
        </div>
        <details className="mt-4">
          <summary className="caption text-[var(--ink-faint)] cursor-pointer">raw JSON</summary>
          <pre className="mono text-xs bg-[var(--surface-raised)] p-4 rounded-md overflow-auto max-h-96 text-[var(--ink-dim)] mt-2">
            {safeStringify(champions)}
          </pre>
        </details>
      </section>

      <section>
        <h2 className="display-3 mb-3">useNextDuelId() = {String(nextDuelId)}</h2>
      </section>

      <section>
        <h2 className="display-3 mb-3">useDuelEvents() — live={String(isLive)} loading={String(feedLoading)}</h2>
        <p className="caption text-[var(--ink-faint)] mb-2">
          {duels.length} settled duels in feed
        </p>
        <pre className="mono text-xs bg-[var(--surface-raised)] p-4 rounded-md overflow-auto max-h-96 text-[var(--ink-dim)]">
          {safeStringify(
            duels.map((d) => ({
              duelId: d.duelId,
              challenger: d.data.challengerTokenId,
              defender: d.data.defenderTokenId,
              status: d.data.status,
              priceAtCommit: d.data.priceAtCommit,
            }))
          )}
        </pre>
      </section>

      <section>
        <h2 className="display-3 mb-3">useDuel(3)</h2>
        <pre className="mono text-xs bg-[var(--surface-raised)] p-4 rounded-md overflow-auto max-h-96 text-[var(--ink-dim)]">
          {safeStringify({ statusLabel: sampleDuel.statusLabel, data: sampleDuel.data })}
        </pre>
      </section>

      <section>
        <h2 className="display-3 mb-3">usePublicTell(duel.3.challengerTellHash)</h2>
        <p className="caption text-[var(--ink-faint)] mb-2">
          loading={String(sampleTell.loading)} error={sampleTell.error ?? "—"}
        </p>
        <pre className="mono text-xs bg-[var(--surface-raised)] p-4 rounded-md overflow-auto max-h-96 text-[var(--ink-dim)]">
          {safeStringify(sampleTell.data)}
        </pre>
      </section>
    </div>
  );
}
