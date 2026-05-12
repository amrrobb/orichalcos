/**
 * Footer for v3 — surfaces v3 contract addresses on Galileo with chainscan links.
 * v2 addresses preserved as a tertiary "archive" group at the bottom.
 */
import Link from "next/link";
import { Mark } from "@/components/ui/Mark";
import { ADDRESSES, EXPLORER_URL, V3_ADDRESSES } from "@/lib/contracts";

const V3_CONTRACT_LINKS = [
  { label: "StrategyINFT", addr: V3_ADDRESSES.strategyINFT },
  { label: "InsurancePool", addr: V3_ADDRESSES.insurancePool },
  { label: "TradeAttestation", addr: V3_ADDRESSES.tradeAttestation },
  { label: "MockUSDC", addr: V3_ADDRESSES.mockUsdc },
];

const V2_CONTRACT_LINKS = [
  { label: "ApprenticeINFT (v2)", addr: ADDRESSES.apprenticeINFT },
  { label: "ScryingDuel (v2)", addr: ADDRESSES.scryingDuel },
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
            Strategies stay sealed. Capital stays safe. Every trade is verifiable.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="label mb-3">v3 contracts on 0G Galileo</p>
          <ul className="space-y-2">
            {V3_CONTRACT_LINKS.map(({ label, addr }) => (
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
          <details className="mt-4">
            <summary className="label cursor-pointer text-[var(--ink-faint)] hover:text-[var(--ink-dim)]" style={{ fontSize: "0.65rem" }}>
              v2 archive (Scrying Duel)
            </summary>
            <ul className="space-y-2 mt-2 opacity-60">
              {V2_CONTRACT_LINKS.map(({ label, addr }) => (
                <li key={label} className="flex items-center justify-between gap-4 max-w-md">
                  <span className="caption text-[var(--ink-faint)]" style={{ fontSize: "0.7rem" }}>{label}</span>
                  {addr ? (
                    <Link
                      href={`${EXPLORER_URL}/address/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="address-chip hover:text-[var(--brass-dim)] transition-colors"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {formatAddress(addr)}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
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
