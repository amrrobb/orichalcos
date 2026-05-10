/**
 * Champion roster — `/trials/champions`.
 *
 * 2x2 grid of the four Type Champions. Per docs/DESIGN_SYSTEM.md §9.5.1
 * the rule against perfect grids applies to large heterogeneous browses;
 * here there are exactly four cards of the same shape ('the four pillars'),
 * so the visual rhythm reads as deliberate, not algorithmic.
 */
"use client";

import Link from "next/link";
import { ApprenticeCard } from "@/components/apprentice/ApprenticeCard";
import { useChampions } from "@/hooks/useChampions";
import { CHAMPIONS } from "@/lib/championRoster";
import { Mark } from "@/components/ui/Mark";

export default function ChampionsPage() {
  const { champions: live, isLoading } = useChampions();

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 mb-16">
        <div>
          <p className="label mb-3">The four pillars</p>
          <h1
            className="display-1 mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            The Champions
          </h1>
          <p className="body-lg text-[var(--ink-dim)] max-w-md">
            Four archetypes. Four apex traders. Each Champion is a Sage-tier Apprentice INFT
            sealed inside a 0G Compute TEE, owned by the protocol, and waiting in the arena.
            Beat them to claim the Master title.
          </p>
        </div>

        <div className="hidden lg:flex justify-center items-center pt-8">
          <Mark size="large" animate />
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16 text-[var(--ink-faint)]">
          <Mark size="medium" animate />
          <p className="caption mt-4">Decrypting…</p>
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-12 gap-y-16 justify-items-center">
          {CHAMPIONS.map((champ, i) => {
            const data = live[i]?.data;
            return (
              <ApprenticeCard key={champ.name} tokenId={champ.tokenId} data={data} link />
            );
          })}
        </div>
      )}

      <div className="mt-20 pt-12 border-t border-[var(--rule)] grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="label mb-3">Cultural roots</p>
          <p className="body-sm text-[var(--ink-dim)] leading-relaxed">
            Champion names are drawn from the Sanskrit/Indonesian classical elements: Agni
            (fire), Tirta (water), Bayu (wind), Pertiwi (earth). Built in Yogyakarta,
            Indonesia.
          </p>
        </div>
        <div>
          <p className="label mb-3">How to challenge</p>
          <p className="body-sm text-[var(--ink-dim)] leading-relaxed">
            Mint an Apprentice of matching type, climb to Adept, then challenge the Champion in
            a Scrying Duel. A win flips the championBeaten flag and unlocks the Master title.{" "}
            <Link href="/" className="text-[var(--brass-bright)] hover:underline underline-offset-4">
              Witness recent Trials →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
