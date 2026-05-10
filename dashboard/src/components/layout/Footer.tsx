/**
 * Footer per docs/USER_FLOW.md §1.1.
 *
 * Contract addresses, Mark watermark, GitHub/X links. Codex register
 * (terminal feel) — JetBrains Mono for addresses.
 */
import Link from "next/link";
import { Mark } from "@/components/ui/Mark";
import { ADDRESSES, EXPLORER_URL } from "@/lib/contracts";

const CONTRACT_LINKS = [
  { label: "ApprenticeINFT", addr: ADDRESSES.apprenticeINFT },
  { label: "Codex", addr: ADDRESSES.codex },
  { label: "ScryingDuel", addr: ADDRESSES.scryingDuel },
  { label: "MockPyth", addr: ADDRESSES.mockPyth },
];

const formatAddress = (addr: string) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";

export function Footer() {
  return (
    <footer className="border-t border-[var(--rule)] mt-16">
      <div className="max-w-[1280px] mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Mark size="medium" />
            <span className="display-3" style={{ fontSize: "1.25rem" }}>
              Orichalcos
            </span>
          </div>
          <p className="caption text-[var(--ink-faint)] italic">
            Trainers, not depositors. Apprentices, not vaults.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="label mb-3">Sealed on 0G Galileo</p>
          <ul className="space-y-2">
            {CONTRACT_LINKS.map(({ label, addr }) => (
              <li key={label} className="flex items-center justify-between gap-4 max-w-md">
                <span className="caption text-[var(--ink-dim)]">{label}</span>
                {addr ? (
                  <Link
                    href={`${EXPLORER_URL}/address/${addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="address-chip hover:text-[var(--brass-bright)] hover:border-[var(--brass-dim)] transition-colors"
                  >
                    {formatAddress(addr)}
                  </Link>
                ) : (
                  <span className="address-chip">—</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <p className="label">Sources</p>
          <Link
            href="https://github.com/amrrobb/orichalcos"
            target="_blank"
            rel="noopener noreferrer"
            className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] transition-colors"
          >
            GitHub
          </Link>
          <Link
            href="https://chainscan-galileo.0g.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] transition-colors"
          >
            0G Explorer
          </Link>
        </div>
      </div>
    </footer>
  );
}
