"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SealSigil } from "@/components/v3/redesign/SealSigil";
import { FaucetButton } from "@/components/v3/redesign/FaucetButton";

/**
 * Top header for Orichalcos v3 (Risk-Management Protocol).
 *
 * Mark + wordmark left. Nav center: Protocol → Strategies → (v2 archive).
 * RainbowKit ConnectButton right.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[var(--surface-base)]/80 backdrop-blur-sm">
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3 group">
          <SealSigil size="small" bare />
          <span
            className="display-3 text-[var(--ink)] tracking-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.5rem" }}
          >
            Orichalcos
          </span>
        </Link>

        <nav className="flex items-center gap-6 ml-4">
          <Link href="/protocol" className="label hover:text-[var(--brass-bright)] transition-colors">
            Protocol
          </Link>
          <Link href="/wagers/new" className="label hover:text-[var(--brass-bright)] transition-colors">
            Open a wager
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <FaucetButton variant="header" />
          <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} label="Connect" />
        </div>
      </div>
    </header>
  );
}
