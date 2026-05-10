/**
 * Landing page — placeholder for Unit 4. Unit 1 only verifies layout/tokens.
 */
import { Mark } from "@/components/ui/Mark";

export default function Home() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-center min-h-[60vh]">
        <div>
          <p className="label mb-4">Why this exists</p>
          <h1
            className="display-hero text-[var(--ink)] mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Trainers, not depositors.
            <br />
            Apprentices, not vaults.
          </h1>
          <p className="body-lg text-[var(--ink-dim)] mb-8 max-w-xl">
            A verifiable alternative to the unverifiable signal economy. Every signal sealed in
            hardware before publication. Every reasoning content-addressed and immutable. Every win
            and loss bound to an on-chain identity that cannot be reset.
          </p>
          <div className="flex gap-4 items-center">
            <button
              className="px-6 py-3 bg-[var(--brass)] text-[var(--surface-base)] rounded-md font-medium hover:bg-[var(--brass-bright)] transition-colors"
              style={{ fontFamily: "var(--font-sans)", fontWeight: 600 }}
            >
              Begin a Trial
            </button>
            <a
              href="/trials/champions"
              className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] transition-colors underline-offset-4 hover:underline"
            >
              Witness the Champions →
            </a>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end pr-4">
          <Mark size="large" animate />
        </div>
      </div>

      <p className="caption text-[var(--ink-faint)] mt-16 italic text-center">
        — Unit 1 placeholder. Live duel feed + statistics wall arrive in Unit 4.
      </p>
    </div>
  );
}
