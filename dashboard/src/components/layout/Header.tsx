"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Mark } from "@/components/ui/Mark";

/**
 * Top header per docs/USER_FLOW.md §1.1.
 *
 * Mark + wordmark on the left (always together — the brand lockup).
 * Slim nav center.
 * RainbowKit ConnectButton right (relabeled "Bind Trainer" via accountStatus tweak isn't supported,
 * but we render a custom button when not connected per DESIGN_SYSTEM.md §9.5.10 microcopy).
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[var(--surface-base)]/80 backdrop-blur-sm">
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3 group">
          <Mark size="medium" animate />
          <span
            className="display-3 text-[var(--ink)] tracking-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.5rem" }}
          >
            Orichalcos
          </span>
        </Link>

        <nav className="flex items-center gap-6 ml-4">
          <Link href="/trials/champions" className="label hover:text-[var(--brass-bright)] transition-colors">
            Champions
          </Link>
          <Link href="/" className="label hover:text-[var(--brass-bright)] transition-colors">
            Trials
          </Link>
        </nav>

        <div className="ml-auto">
          <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} label="Bind Trainer" />
        </div>
      </div>
    </header>
  );
}
