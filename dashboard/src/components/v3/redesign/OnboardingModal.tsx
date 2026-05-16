/**
 * Three-step onboarding modal — Steampunk-inflected welcome dossier.
 *
 * Mounts from the root layout. Shows once per browser (localStorage key
 * `orichalcos_onboarded`). The Footer "Walkthrough" link re-opens it by
 * clearing the key and forcing a remount via an internal custom event.
 *
 * Esc + backdrop click dismiss. Framer-motion backdrop fade + panel
 * scale-in entrance.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SealSigil } from "./SealSigil";
import { DossierEm } from "./DossierTitle";

const STORAGE_KEY = "orichalcos_onboarded";
const REOPEN_EVENT = "orichalcos:onboarding:open";

interface Step {
  title: string;
  body: React.ReactNode;
  cta: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: "Inspect a sealed agent.",
    body: (
      <>
        Every Strategy Agent runs inside 0G&apos;s TEE — its weights are encrypted, its
        trades are signed. You can verify the track record on{" "}
        <DossierEm>Hyperliquid testnet</DossierEm> without ever seeing the alpha.
      </>
    ),
    cta: <em style={{ color: "var(--ink-faint)" }}>Click any strategy on the home page to read its dossier.</em>,
  },
  {
    title: "Bond, insure, or underwrite.",
    body: (
      <>
        Three roles, one protocol.{" "}
        <strong style={{ color: "var(--brass)" }}>Traders</strong> post a USDC bond against a
        drawdown promise.{" "}
        <strong style={{ color: "var(--brass)" }}>Challengers</strong> stake against the promise — if it breaks,
        the bond pays them.{" "}
        <strong style={{ color: "var(--brass)" }}>LPs</strong> deposit into the pool and earn
        premium yield. Pick yours.
      </>
    ),
    cta: null,
  },
  {
    title: "Watch a real settlement.",
    body: (
      <>
        A <DossierEm>live strategy</DossierEm> is in breach right now on Galileo testnet.
        Open it to see the slim breach-rule, the marker on the equity curve at the breach
        trade, and the open settlement that any wallet can call.
      </>
    ),
    cta: null,
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // First-visit gate — open if no flag set. Run only in browser.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const flag = window.localStorage.getItem(STORAGE_KEY);
      if (!flag) setOpen(true);
    } catch {
      // localStorage blocked — fail open.
      setOpen(true);
    }

    const reopen = () => setOpen(true);
    window.addEventListener(REOPEN_EVENT, reopen);
    return () => window.removeEventListener(REOPEN_EVENT, reopen);
  }, []);

  // Esc to dismiss.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const enter = () => {
    dismiss();
    router.push("/strategies/breached");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="onboarding-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={dismiss}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 620,
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid var(--brass-deep)",
              borderRadius: 10,
              background:
                "linear-gradient(180deg, rgba(212,165,116,0.04), rgba(212,165,116,0) 40%), var(--surface-raised)",
              boxShadow:
                "0 0 0 1px rgba(212,165,116,0.08), 0 32px 80px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,165,116,0.08)",
              padding: "2rem 2rem 1.75rem",
              position: "relative",
            }}
          >
            <button
              onClick={dismiss}
              aria-label="Close walkthrough"
              style={{
                position: "absolute",
                top: 14,
                right: 18,
                background: "transparent",
                border: "none",
                color: "var(--ink-faint)",
                fontSize: "1.5rem",
                lineHeight: 1,
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
              }}
            >
              ×
            </button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.4rem" }}>
              <SealSigil size="medium" />
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.28em",
                  color: "var(--brass)",
                  marginTop: "0.85rem",
                }}
              >
                Welcome to the Protocol
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.85rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginTop: "0.4rem",
                  textAlign: "center",
                  letterSpacing: "-0.005em",
                }}
              >
                Three ways to read <DossierEm>Orichalcos.</DossierEm>
              </h2>
            </div>

            <ol
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
                listStyle: "none",
                padding: 0,
                margin: "0 0 1.6rem",
              }}
            >
              {STEPS.map((step, i) => (
                <li
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "42px 1fr",
                    gap: "1rem",
                    alignItems: "start",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "1px solid var(--brass-deep)",
                      background: "rgba(212,165,116,0.08)",
                      color: "var(--brass)",
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 500,
                      fontSize: "1.05rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        color: "var(--ink)",
                        marginBottom: "0.3rem",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.92rem",
                        lineHeight: 1.55,
                        color: "var(--ink-dim)",
                      }}
                    >
                      {step.body}
                    </p>
                    {step.cta && (
                      <p
                        style={{
                          marginTop: "0.4rem",
                          fontSize: "0.82rem",
                          color: "var(--ink-faint)",
                        }}
                      >
                        {step.cta}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "1.1rem",
                borderTop: "1px solid var(--rule)",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={dismiss}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--ink-faint)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  cursor: "pointer",
                  padding: "0.3rem 0",
                }}
              >
                Skip for now
              </button>
              <button
                onClick={enter}
                style={{
                  background: "var(--brass)",
                  color: "var(--surface-base)",
                  border: "none",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  padding: "0.75rem 1.4rem",
                  borderRadius: 6,
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}
              >
                Enter the Protocol →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Imperative reopen — called by the Footer "Walkthrough" link. Resets the
 * persistence flag so the modal re-opens cleanly.
 */
export function openOnboarding() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(REOPEN_EVENT));
}
