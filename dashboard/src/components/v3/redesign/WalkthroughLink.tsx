/**
 * Tiny client-only link that re-opens the onboarding modal.
 * Lives in the footer so judges can replay the explainer at any time.
 */
"use client";

import { openOnboarding } from "./OnboardingModal";

export function WalkthroughLink() {
  return (
    <button
      onClick={openOnboarding}
      className="caption text-[var(--ink-dim)] hover:text-[var(--brass-bright)] transition-colors"
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      Walkthrough
    </button>
  );
}
