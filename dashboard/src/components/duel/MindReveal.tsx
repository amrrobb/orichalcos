/**
 * Mind Reveal — the hero animation. Per docs/DESIGN_SYSTEM.md §6.
 *
 * 5-frame sequence over 5 seconds:
 *   0.0-0.5s  Frame 1 — Hush: arena fades, MIND REVEAL label appears
 *   0.5-2.0s  Frame 2 — Cipher cascade: orbs spew chars, three seals slam down
 *   2.0-3.5s  Frame 3 — Decryption resolve: cipher resolves to public tell text,
 *                       cipher-amber glow appears (the ONLY use of this color)
 *   3.5-4.5s  Frame 4 — Verdict: oblique slash, ELO deltas, winner outlined
 *   4.5-5.0s  Frame 5 — Settle: seals lock in, glow fades, normal state
 *
 * Triggered by 'Replay Mind Reveal' button on settled duels. While playing,
 * sets body[data-mind-reveal=true] which disables the vellum overlay so the
 * cryptographic moment feels purely digital (per §9.5.6).
 *
 * Respects prefers-reduced-motion: skips cipher cascade, type-up is instant.
 */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { WaxSeal } from "./WaxSeal";

export interface MindRevealParticipant {
  name: string;
  archetype: string;
  direction: "LONG" | "SHORT";
  publicTell: string;
  isWinner: boolean;
  eloDelta: number;
  titleUp?: string;
  /** Optional element color for Champions */
  elementColor?: string;
}

interface MindRevealProps {
  open: boolean;
  onComplete: () => void;
  challenger: MindRevealParticipant;
  defender: MindRevealParticipant;
}

// Per docs/DESIGN_SYSTEM.md §6 — total 5s + a 'hold' buffer at the end so the
// judge can read the verdict before the modal dismisses. Net total ~7s; user
// can hit 'Skip' on the top-right to bail early.
const DURATIONS = {
  hush: 600,
  cipher: 1800,
  decrypt: 1800,
  verdict: 1200,
  settle: 600,
};
const TOTAL_MS =
  DURATIONS.hush + DURATIONS.cipher + DURATIONS.decrypt + DURATIONS.verdict + DURATIONS.settle;
const HOLD_MS = 2000;

export function MindReveal({ open, onComplete, challenger, defender }: MindRevealProps) {
  const [phase, setPhase] = useState<"hush" | "cipher" | "decrypt" | "verdict" | "settle" | "done">("hush");
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const reduced = useReducedMotion();

  // Stable onComplete reference — parent passes a new closure each render
  // which would otherwise reset the effect timers mid-animation.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!open) return;
    document.body.dataset.mindReveal = "true";
    const localTimers: NodeJS.Timeout[] = [];

    if (reduced) {
      setPhase("decrypt");
      localTimers.push(
        setTimeout(() => {
          setPhase("done");
          onCompleteRef.current();
          delete document.body.dataset.mindReveal;
        }, 1500)
      );
    } else {
      setPhase("hush");
      localTimers.push(setTimeout(() => setPhase("cipher"), DURATIONS.hush));
      localTimers.push(
        setTimeout(() => setPhase("decrypt"), DURATIONS.hush + DURATIONS.cipher)
      );
      localTimers.push(
        setTimeout(
          () => setPhase("verdict"),
          DURATIONS.hush + DURATIONS.cipher + DURATIONS.decrypt
        )
      );
      localTimers.push(
        setTimeout(
          () => setPhase("settle"),
          DURATIONS.hush + DURATIONS.cipher + DURATIONS.decrypt + DURATIONS.verdict
        )
      );
      // Final phase holds for an extra 1.8s so judges can read the verdict
      // before the modal dismisses.
      localTimers.push(
        setTimeout(() => {
          setPhase("done");
          onCompleteRef.current();
          delete document.body.dataset.mindReveal;
        }, TOTAL_MS + HOLD_MS)
      );
    }
    timersRef.current = localTimers;

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      delete document.body.dataset.mindReveal;
    };
    // Intentionally exclude onComplete — we use the ref to avoid resetting the timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reduced]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background:
              phase === "hush"
                ? "rgba(10,22,40,0.85)"
                : "rgba(0,0,0,0.92)",
            backdropFilter: "blur(8px)",
            transition: "background 500ms",
          }}
        >
          {/* Frame 1: MIND REVEAL label appears */}
          <motion.h2
            className="absolute top-[12%] left-1/2 -translate-x-1/2 italic"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "2.25rem",
              color: phase === "decrypt" || phase === "verdict" ? "var(--cipher-amber)" : "var(--brass)",
              letterSpacing: "0.04em",
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Mind Reveal
          </motion.h2>

          {/* Two participants face off — challenger right, defender left per §9.5.8 */}
          <div className="grid grid-cols-2 gap-12 max-w-5xl w-full px-8 mt-16">
            <ParticipantPane
              participant={defender}
              phase={phase}
              side="left"
              reduced={reduced}
            />
            <ParticipantPane
              participant={challenger}
              phase={phase}
              side="right"
              reduced={reduced}
            />
          </div>

          {/* Verdict slash — Frame 4 */}
          {phase === "verdict" && !reduced && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background:
                  "linear-gradient(115deg, transparent 30%, var(--brass-bright) 47%, var(--cipher-amber) 50%, var(--brass-bright) 53%, transparent 70%)",
                opacity: 0.6,
                mixBlendMode: "screen",
                transform: "skewX(-15deg)",
                transformOrigin: "center",
              }}
            />
          )}

          {/* Three wax seals — slam down during cipher, settle during settle */}
          <div className="absolute bottom-[12%] flex items-center justify-center gap-6">
            <SealStamp kind="tee" phase={phase} delay={0} reduced={reduced} />
            <SealStamp kind="0g" phase={phase} delay={400} reduced={reduced} />
            <SealStamp kind="pyth" phase={phase} delay={800} reduced={reduced} />
          </div>

          {/* Click outside to dismiss */}
          <button
            type="button"
            onClick={onComplete}
            className="absolute top-6 right-6 text-[var(--ink-dim)] hover:text-[var(--brass-bright)] caption"
            aria-label="Skip Mind Reveal"
          >
            Skip ›
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ParticipantPane({
  participant,
  phase,
  side,
  reduced,
}: {
  participant: MindRevealParticipant;
  phase: "hush" | "cipher" | "decrypt" | "verdict" | "settle" | "done";
  side: "left" | "right";
  reduced: boolean;
}) {
  const showTell = phase === "decrypt" || phase === "verdict" || phase === "settle";
  const showVerdict = phase === "verdict" || phase === "settle";
  const showCipher = phase === "cipher";

  const accent = participant.elementColor ?? "var(--brass)";
  const isWinner = participant.isWinner;

  return (
    <div
      className="relative flex flex-col items-center text-center transition-all duration-500"
      style={{
        opacity: showVerdict && !isWinner ? 0.55 : 1,
        filter: showVerdict && !isWinner ? "saturate(0.4)" : "none",
        boxShadow: showVerdict && isWinner ? "0 0 48px rgba(230, 201, 135, 0.35)" : "none",
        padding: "24px 16px",
        borderRadius: "var(--radius-card)",
        border: showVerdict && isWinner ? "1px solid var(--brass-bright)" : "1px solid transparent",
        transition: "border-color 500ms, opacity 500ms, filter 500ms",
      }}
    >
      <p
        className="label mb-2"
        style={{ color: showVerdict && isWinner ? "var(--brass-bright)" : "var(--brass-dim)", fontSize: "0.65rem" }}
      >
        {side === "left" ? "Defender" : "Challenger"}
      </p>
      <h3
        className="display-2 mb-2"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          color: "var(--ink)",
          fontSize: "2rem",
        }}
      >
        {participant.name}
      </h3>
      <span
        className="label"
        style={{
          fontSize: "0.6rem",
          color: accent,
          marginBottom: 16,
        }}
      >
        {participant.archetype.toUpperCase()} · {participant.direction}
      </span>

      {/* Cipher cascade frame — visible during 'cipher' phase only */}
      {showCipher && !reduced && (
        <CipherCascade accent={accent} />
      )}

      {/* Decrypted public tell — type-up effect during 'decrypt' phase */}
      {showTell && (
        <motion.p
          className="italic mt-4 max-w-md text-[var(--ink)] leading-relaxed"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "1.0625rem",
            textShadow:
              phase === "decrypt"
                ? "0 0 18px rgba(255, 181, 71, 0.35)"
                : phase === "verdict"
                ? "0 0 12px rgba(230, 201, 135, 0.2)"
                : "none",
            transition: "text-shadow 500ms",
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.2 : 1.0, ease: [0.22, 1, 0.36, 1] }}
        >
          “{participant.publicTell}”
        </motion.p>
      )}

      {/* ELO delta + Title-up — Frame 4 */}
      {showVerdict && (
        <motion.div
          className="mt-6 flex flex-col items-center gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <span
            className="mono numeral"
            style={{
              fontSize: "2.25rem",
              color: isWinner ? "var(--brass-bright)" : "var(--loss)",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {participant.eloDelta >= 0 ? "+" : ""}
            {participant.eloDelta} ELO
          </span>
          {participant.titleUp && isWinner && (
            <span
              className="px-3 py-1 rounded-sm border"
              style={{
                borderColor: "var(--brass-bright)",
                color: "var(--brass-bright)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.18em",
              }}
            >
              ✦ {participant.titleUp.toUpperCase()}
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}

function CipherCascade({ accent }: { accent: string }) {
  const chars = "0123456789abcdefABCDEFअईऊऋए𓂀𓂁𓂂".split("");
  return (
    <div className="relative h-32 w-full overflow-hidden flex items-center justify-center">
      {Array.from({ length: 24 }).map((_, i) => {
        const ch = chars[(i * 7) % chars.length];
        const left = (i * 13) % 100;
        const delay = (i * 0.05) % 0.8;
        return (
          <span
            key={i}
            className="absolute mono"
            style={{
              left: `${left}%`,
              fontSize: "0.85rem",
              color: accent,
              opacity: 0.45,
              animation: `cipher-fall 1.4s ease-in-out ${delay}s forwards`,
              top: 0,
            }}
          >
            {ch}
          </span>
        );
      })}
      <style jsx>{`
        @keyframes cipher-fall {
          0%   { transform: translateY(0) skewX(-3deg);   opacity: 0; }
          20%  { opacity: 0.6; }
          100% { transform: translateY(120px) skewX(-3deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function SealStamp({
  kind,
  phase,
  delay,
  reduced,
}: {
  kind: "tee" | "0g" | "pyth";
  phase: "hush" | "cipher" | "decrypt" | "verdict" | "settle" | "done";
  delay: number;
  reduced: boolean;
}) {
  const visible = phase === "cipher" || phase === "decrypt" || phase === "verdict" || phase === "settle";
  const stamping = phase === "cipher";

  if (!visible) return null;

  return (
    <motion.div
      initial={{ scale: 1.4, y: -40, opacity: 0, rotate: -8 }}
      animate={{
        scale: 1,
        y: 0,
        opacity: 1,
        rotate: 0,
      }}
      transition={{
        duration: reduced ? 0.2 : 0.4,
        delay: reduced ? 0 : delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <WaxSeal kind={kind} size={64} stamping={stamping} />
    </motion.div>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return reduced;
}
