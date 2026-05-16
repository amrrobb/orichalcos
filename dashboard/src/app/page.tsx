/**
 * Landing — v3 Risk-Management Protocol.
 *
 * Redesigned per project/redesign-landing.html. Sections:
 *   1. HERO with large wax-seal sigil + dual CTA
 *   2. Trust strip (hackathon proof points)
 *   3. The dilemma (two facing cards joined by a "vs" hinge)
 *   4. Three roles (Allocator featured with brass corner ribbon)
 *   5. 90-second walkthrough → CTA to /strategies/breached (breach demo)
 *   6. Live on 0G — stats + strategy chips
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SealSigil } from "@/components/v3/redesign/SealSigil";
import {
  DossierEm,
} from "@/components/v3/redesign/DossierTitle";

export default function Home() {
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        style={{
          padding: "4.5rem 0 5rem",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="hero-grid">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "var(--brass)",
                textTransform: "uppercase",
                letterSpacing: "0.28em",
                marginBottom: "1.4rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span>Orichalcos</span>
              <span style={{ color: "var(--ink-ghost)" }}>·</span>
              <span style={{ color: "var(--ink-faint)" }}>0G APAC hackathon</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.6rem, 5.4vw, 4.4rem)",
                fontWeight: 600,
                lineHeight: 1.02,
                letterSpacing: "-0.014em",
              }}
            >
              Risk-management <DossierEm>for AI traders.</DossierEm>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                marginTop: "1.5rem",
                fontSize: "1.15rem",
                lineHeight: 1.55,
                color: "var(--ink-dim)",
                maxWidth: "52ch",
              }}
            >
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                Strategies stay sealed.
              </strong>{" "}
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                Capital stays safe.
              </strong>{" "}
              Every trade is verifiable on chain — without revealing the alpha. A
              protocol that fixes both halves of the trust problem with autonomous
              agents.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ marginTop: "2rem", display: "flex", gap: "0.85rem", flexWrap: "wrap" }}
            >
              <Link
                href="/strategies/breached"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.85rem 1.35rem",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  borderRadius: 6,
                  background: "var(--brass)",
                  color: "var(--surface-base)",
                  transition: "background 0.12s",
                }}
              >
                Try the live demo
                <span style={{ marginLeft: "0.55rem", fontFamily: "var(--font-display)" }}>→</span>
              </Link>
              <Link
                href="#how"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.85rem 1.35rem",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  borderRadius: 6,
                  background: "transparent",
                  color: "var(--brass)",
                  border: "1px solid var(--brass-deep)",
                }}
              >
                Read how it works
                <span style={{ marginLeft: "0.55rem", fontFamily: "var(--font-display)" }}>↓</span>
              </Link>
            </motion.div>
          </div>

          {/* Large wax-seal sigil */}
          <HeroSigil />
        </div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            border: "1px solid var(--rule)",
            borderRadius: 6,
            background: "linear-gradient(180deg, var(--surface-raised), var(--surface-deep))",
            marginTop: "3.5rem",
            overflow: "hidden",
          }}
        >
          {[
            { k: "Live on 0G", v: "Galileo", unit: "testnet" },
            { k: "Contracts", v: "4", unit: "deployed" },
            { k: "Test suite", v: "45 / 45", unit: "passing" },
            { k: "Real fills", v: "40+", unit: "Hyperliquid" },
            { k: "Line coverage", v: "81%", unit: "foundry" },
          ].map((c, i, arr) => (
            <div
              key={c.k}
              style={{
                flex: "1 1 0",
                minWidth: 180,
                padding: "1rem 1.25rem",
                borderRight: i === arr.length - 1 ? 0 : "1px solid var(--rule)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "var(--ink-faint)",
                  marginBottom: "0.4rem",
                }}
              >
                {c.k}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.05rem", color: "var(--brass)", fontWeight: 600, lineHeight: 1 }}>
                {c.v}{" "}
                <small style={{ fontSize: "0.65rem", fontWeight: 400, color: "var(--ink-faint)", marginLeft: "0.3rem" }}>
                  {c.unit}
                </small>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── THE DILEMMA ────────────────────────────────────────── */}
      <section id="why" style={{ padding: "5rem 0", borderBottom: "1px solid var(--rule)" }}>
        <SectionEyebrow num="§ I">Why this exists</SectionEyebrow>
        <SerifH2>
          Two problems that pull <DossierEm>in opposite directions.</DossierEm>
        </SerifH2>
        <SecLead>
          AI trading bots are everywhere and nobody can trust any of them. Every existing answer
          breaks one half of the problem to fix the other. Orichalcos is what happens when you
          refuse to pick.
        </SecLead>

        <div
          className="dilemma-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 60px 1fr",
            gap: "1rem",
            alignItems: "stretch",
            marginTop: "3rem",
          }}
        >
          <DilemmaFace
            cap="If you see it"
            title={<>The alpha <DossierEm>decays</DossierEm>.</>}
            body="Show your strategy to verify it — and it stops working the second someone else copies it. Open-source quants don't have alpha for long."
            tags={["alpha decay", "front-running", "copy-trade race"]}
            delay={0}
          />
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="dilemma-vs"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "1.6rem",
              color: "var(--brass)",
              position: "relative",
            }}
          >
            <em>vs</em>
          </motion.div>
          <DilemmaFace
            cap="If you don't"
            title={<>You can&apos;t <DossierEm>verify it</DossierEm>.</>}
            body="Trust an anon Twitter screenshot. Hand USDC to a closed vault. Hope the &ldquo;60% APR&rdquo; was real. The fraud surface here is enormous."
            tags={["rug pulls", "faked track records", "vault scams"]}
            delay={0.15}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            marginTop: "2rem",
            padding: "1rem 1.25rem",
            border: "1px solid var(--rule)",
            borderLeft: "2px solid var(--brass-deep)",
            borderRadius: 4,
            color: "var(--ink-dim)",
            fontSize: "0.9rem",
            background: "rgba(212,165,116,0.02)",
          }}
        >
          Today&apos;s industry answer to this is anonymous Twitter posters and{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--brass)" }}>
            $11.3B/year
          </span>{" "}
          in reported crypto fraud (FBI 2024).{" "}
          <strong style={{ color: "var(--ink)" }}>56%</strong> of retail traders lose money;{" "}
          <strong style={{ color: "var(--ink)" }}>69%</strong> of complaints involve some form of investment scam.
        </motion.div>
      </section>

      {/* ── ROLES ──────────────────────────────────────────────── */}
      <section id="roles" style={{ padding: "5rem 0", borderBottom: "1px solid var(--rule)" }}>
        <SectionEyebrow num="§ II">Three roles, one protocol</SectionEyebrow>
        <SerifH2>
          Pick the one <DossierEm>that&apos;s you.</DossierEm>
        </SerifH2>
        <SecLead>
          Same sealed contracts, same bonded collateral, same on-chain ledger. What changes is your
          starting move and what you walk away with.
        </SecLead>

        <div
          className="roles-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.25rem",
            marginTop: "3rem",
          }}
        >
          <RoleCard
            roman="I."
            cap="Trader"
            title={<>Prove a <DossierEm>track record</DossierEm>.</>}
            persona="I have an AI bot. I want to monetize my track record without revealing the strategy to anyone."
            desc="Bond USDC against your agent. Run sealed inside 0G's TEE. Build a verifiable history of attested trades — the operator never sees your weights and neither does anyone else."
            verbs={[
              { v: "Bond", t: "USDC collateral" },
              { v: "Seal", t: "strategy in 0G TEE" },
              { v: "Earn", t: "reputation, fee share" },
            ]}
            cta={{ label: "How to mint an agent →", href: "/protocol" }}
          />
          <RoleCard
            featured
            roman="II."
            cap="Allocator"
            title={<>Buy <DossierEm>insurance,</DossierEm> not exposure.</>}
            persona="I want AI alpha but not the rug risk. I'll pay a premium to know my downside is bonded on chain."
            desc="Pick a Strategy Agent, buy a policy up to its bond. If the strategy breaches its drawdown promise, the bond pays you out — first-come, on chain, no trader signature required."
            verbs={[
              { v: "Browse", t: "attested strategies" },
              { v: "Pay", t: "12.5% premium up-front" },
              { v: "Claim", t: "on breach, automatically" },
            ]}
            cta={{ label: "Try the demo as allocator →", href: "/strategies/breached/insure" }}
          />
          <RoleCard
            roman="III."
            cap="LP"
            title={<>Earn yield, <DossierEm>not principal risk</DossierEm>.</>}
            persona="I want passive yield. I don't want to pick agents and I don't want to lose my deposit."
            desc="Deposit USDC into the protocol pool. Earn the premium yield from every policy bought, plus residuals from slashed bonds. v3 enforces bond ≥ max claim — principal sits idle, never bet."
            verbs={[
              { v: "Deposit", t: "USDC into pool" },
              { v: "Earn", t: "12.5% × policy volume" },
              { v: "Withdraw", t: "any epoch boundary" },
            ]}
            cta={{ label: "Open the LP pool →", href: "/protocol" }}
          />
        </div>
      </section>

      {/* ── 90-SECOND WALKTHROUGH ─────────────────────────────── */}
      <section id="how" style={{ padding: "5rem 0", borderBottom: "1px solid var(--rule)" }}>
        <SectionEyebrow num="§ III">The 90-second walkthrough</SectionEyebrow>
        <SerifH2>
          How the allocator flow <DossierEm>actually runs</DossierEm>.
        </SerifH2>
        <SecLead>
          Three on-chain actions. No off-chain trust, no admin keys, no opaque vault.
        </SecLead>

        <div
          className="walk-grid"
          style={{
            marginTop: "3rem",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.25rem",
          }}
        >
          {[
            {
              n: "I.",
              lbl: "Browse",
              h: <>Inspect the <DossierEm>track record</DossierEm>.</>,
              p: <>See every strategy&apos;s equity curve — each point a TEE-attested fill on Hyperliquid. The strategy itself stays sealed; the <Code>P&amp;L</Code> proves it works.</>,
            },
            {
              n: "II.",
              lbl: "Insure",
              h: <>Buy a <DossierEm>policy</DossierEm>.</>,
              p: <>Pay a <Code>12.5%</Code> premium up-front for coverage up to the trader&apos;s bonded collateral. Two transactions: <Code>approve</Code>, then <Code>buyPolicy</Code>.</>,
            },
            {
              n: "III.",
              lbl: "Settle",
              h: <>If it <DossierEm>breaches</DossierEm>, anyone can settle.</>,
              p: <>The AI crosses its drawdown — anyone calls <Code>markBreach()</Code>. Bond pays open policies first; residual sweeps to the LP pool. Trader receives <Code>0</Code>.</>,
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                border: "1px solid var(--rule)",
                borderRadius: 8,
                background: "var(--surface-raised)",
                padding: "1.75rem 1.5rem 1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2rem",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "var(--brass)",
                    lineHeight: 1,
                  }}
                >
                  {s.n}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: "var(--ink-faint)",
                  }}
                >
                  {s.lbl}
                </span>
              </div>
              <h4
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  marginBottom: "0.6rem",
                }}
              >
                {s.h}
              </h4>
              <p style={{ color: "var(--ink-dim)", fontSize: "0.92rem", lineHeight: 1.55 }}>
                {s.p}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            marginTop: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1.1rem 1.25rem",
            border: "1px solid rgba(217,118,118,0.3)",
            background: "linear-gradient(180deg, rgba(217,118,118,0.05), rgba(217,118,118,0.01))",
            borderRadius: 6,
            flexWrap: "wrap",
          }}
        >
          <span className="breach-pulse-dot" />
          <span style={{ fontSize: "0.92rem", color: "var(--ink-dim)" }}>
            <strong style={{ color: "var(--ink)" }}>A live strategy is breach-ready right now.</strong>{" "}
            Watch the full settlement flow live on testnet.
          </span>
          <Link
            href="/strategies/breached"
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: "0.82rem",
              color: "var(--brass)",
              borderBottom: "1px dashed var(--brass-deep)",
              paddingBottom: 1,
            }}
          >
            Open strategy #4 →
          </Link>
        </motion.div>
      </section>

      {/* ── LIVE ON 0G ─────────────────────────────────────────── */}
      <section id="live" style={{ padding: "5rem 0" }}>
        <SectionEyebrow num="§ IV">Live on 0G Galileo</SectionEyebrow>
        <SerifH2>
          Four strategies, <DossierEm>fully on chain</DossierEm>.
        </SerifH2>

        <div
          className="live-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "3rem",
            alignItems: "start",
            marginTop: "3rem",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1,
              background: "var(--rule)",
              border: "1px solid var(--rule)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            {[
              { k: "Contracts deployed", v: "4", sub: "StrategyINFT · InsurancePool · TradeAttestation · MockUSDC" },
              { k: "Foundry suite", v: "45 / 45", sub: "81% line coverage" },
              { k: "Attested trades", v: "40+", sub: "all signed inside 0G TEE" },
              { k: "Demo strategies", v: "4", sub: "1 breach-ready, 3 healthy" },
            ].map((c) => (
              <div
                key={c.k}
                style={{
                  background: "linear-gradient(180deg, var(--surface-raised), var(--surface-deep))",
                  padding: "1.15rem 1.25rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    marginBottom: "0.45rem",
                  }}
                >
                  {c.k}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.4rem",
                    color: "var(--brass)",
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  {c.v}
                </div>
                <div
                  style={{
                    marginTop: "0.4rem",
                    fontSize: "0.78rem",
                    color: "var(--ink-faint)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {c.sub}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Inspect the four agents.
            </h3>
            <p style={{ color: "var(--ink-dim)", fontSize: "0.95rem", lineHeight: 1.55, marginBottom: "1.25rem" }}>
              One is in breach right now — useful if you want to watch settlement go through end-to-end.
              The others are healthy and accepting coverage.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <StratChip id={17} name="Bold" italic="momentum scalper" pnl="+13.8%" tone="ok" />
              <StratChip id={18} name="Patient" italic="mean-reversion" pnl="+5.5%" tone="ok" />
              <StratChip id={19} name="Sharp" italic="microstructure" pnl="+4.1%" tone="ok" />
              <StratChip id={20} name="Stoic" italic="range trader" pnl="−21.0%" tone="bad" />
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 4rem;
          align-items: center;
        }
        @media (max-width: 980px) {
          .hero-grid { grid-template-columns: 1fr; gap: 2.5rem; }
          .hero-sigil { order: -1; margin: 0 auto; }
          .roles-grid { grid-template-columns: 1fr !important; }
          .walk-grid { grid-template-columns: 1fr !important; }
          .live-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 820px) {
          .dilemma-grid { grid-template-columns: 1fr !important; }
          .dilemma-vs { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ──────────────────────────── helpers ─────────────────────────────

function SectionEyebrow({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.7rem",
        color: "var(--brass)",
        textTransform: "uppercase",
        letterSpacing: "0.28em",
        marginBottom: "0.85rem",
      }}
    >
      <span style={{ color: "var(--ink-faint)", marginRight: "0.6rem" }}>{num}</span>
      {children}
    </div>
  );
}

function SerifH2({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(2rem, 3.6vw, 2.8rem)",
        fontWeight: 600,
        lineHeight: 1.08,
        letterSpacing: "-0.01em",
        maxWidth: "22ch",
      }}
    >
      {children}
    </motion.h2>
  );
}

function SecLead({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        marginTop: "1rem",
        fontSize: "1.05rem",
        color: "var(--ink-dim)",
        lineHeight: 1.55,
        maxWidth: "60ch",
      }}
    >
      {children}
    </p>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.82rem",
        color: "var(--brass)",
        background: "rgba(212,165,116,0.07)",
        padding: "0.05rem 0.35rem",
        borderRadius: 3,
      }}
    >
      {children}
    </code>
  );
}

function HeroSigil() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="hero-sigil"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        maxWidth: 380,
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(212,165,116,0.08), transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: "78%",
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          border: "1.5px solid var(--brass-deep)",
          background:
            "radial-gradient(circle at 30% 28%, rgba(232,184,133,0.18), transparent 60%), radial-gradient(circle at 72% 72%, rgba(212,165,116,0.05), transparent 60%), linear-gradient(180deg, var(--surface-raised), var(--surface-deep))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow:
            "inset 0 0 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,165,116,0.15), 0 30px 80px -30px rgba(212,165,116,0.25)",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: "7%",
            borderRadius: "50%",
            border: "1px dashed rgba(212,165,116,0.22)",
          }}
        />
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: "13%",
            borderRadius: "50%",
            border: "1px solid rgba(212,165,116,0.1)",
          }}
        />
        <motion.svg
          viewBox="0 0 100 100"
          fill="none"
          stroke="#d4a574"
          style={{ width: "62%", height: "62%", position: "relative", zIndex: 1, overflow: "visible" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        >
          {/* connector bars */}
          <g stroke="#d4a574" strokeWidth="4" strokeLinecap="butt">
            <line x1="50" y1="44" x2="50" y2="32" />
            <line x1="50" y1="56" x2="50" y2="68" />
            <line x1="44" y1="50" x2="32" y2="50" />
            <line x1="56" y1="50" x2="68" y2="50" />
          </g>
          {/* central square */}
          <rect x="44" y="44" width="12" height="12" stroke="#d4a574" strokeWidth="3" fill="none" />
          {/* four ringed nodes */}
          <circle cx="50" cy="18" r="14" stroke="#d4a574" strokeWidth="4" fill="none" />
          <circle cx="50" cy="18" r="4.5" fill="#d4a574" stroke="none" />
          <circle cx="50" cy="82" r="14" stroke="#d4a574" strokeWidth="4" fill="none" />
          <circle cx="50" cy="82" r="4.5" fill="#d4a574" stroke="none" />
          <circle cx="18" cy="50" r="14" stroke="#d4a574" strokeWidth="4" fill="none" />
          <circle cx="18" cy="50" r="4.5" fill="#d4a574" stroke="none" />
          <circle cx="82" cy="50" r="14" stroke="#d4a574" strokeWidth="4" fill="none" />
          <circle cx="82" cy="50" r="4.5" fill="#d4a574" stroke="none" />
        </motion.svg>
      </div>
      {/* Compass labels around the seal */}
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <g
          transform="translate(100,100)"
          style={{ fontFamily: "var(--font-mono)", fontSize: 9, fill: "var(--brass-dim)", letterSpacing: "0.15em" }}
        >
          <text x="0" y="-86" textAnchor="middle">SEALED</text>
          <text x="86" y="4" textAnchor="middle" transform="rotate(90 86 0)">VERIFIED</text>
          <text x="0" y="94" textAnchor="middle">ON CHAIN</text>
          <text x="-86" y="4" textAnchor="middle" transform="rotate(-90 -86 0)">BONDED</text>
        </g>
      </svg>
    </motion.div>
  );
}

function DilemmaFace({
  cap,
  title,
  body,
  tags,
  delay,
}: {
  cap: string;
  title: React.ReactNode;
  body: string;
  tags: string[];
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        border: "1px solid var(--rule)",
        borderRadius: 8,
        background: "linear-gradient(180deg, var(--surface-raised), var(--surface-deep))",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          color: "var(--brass)",
        }}
      >
        {cap}
      </span>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 600, lineHeight: 1.15, color: "var(--ink)" }}>
        {title}
      </h3>
      <div style={{ color: "var(--ink-dim)", fontSize: "0.95rem", lineHeight: 1.55 }}>{body}</div>
      <ul
        style={{
          listStyle: "none",
          marginTop: "auto",
          paddingTop: "1rem",
          borderTop: "1px solid var(--rule)",
        }}
      >
        {tags.map((t) => (
          <li
            key={t}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.45rem 0",
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
              color: "var(--ink-dim)",
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ color: "var(--brass-dim)", marginRight: "0.7rem" }}>—</span>
            {t}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

function RoleCard({
  featured,
  roman,
  cap,
  title,
  persona,
  desc,
  verbs,
  cta,
}: {
  featured?: boolean;
  roman: string;
  cap: string;
  title: React.ReactNode;
  persona: string;
  desc: string;
  verbs: { v: string; t: string }[];
  cta: { label: string; href: string };
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      style={{
        border: `1px solid ${featured ? "var(--brass-deep)" : "var(--rule)"}`,
        borderRadius: 8,
        background: featured
          ? "linear-gradient(180deg, rgba(212,165,116,0.06), rgba(212,165,116,0.01)), var(--surface-raised)"
          : "var(--surface-raised)",
        padding: "1.75rem 1.5rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        boxShadow: featured
          ? "0 0 0 1px rgba(212,165,116,0.05), 0 30px 60px -30px rgba(212,165,116,0.18)"
          : "none",
      }}
    >
      {featured && (
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "var(--brass)",
            color: "var(--surface-base)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            padding: "0.4rem 0.85rem",
            borderRadius: "0 8px 0 6px",
          }}
        >
          ★ START HERE
        </span>
      )}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.6rem",
          fontStyle: "italic",
          fontWeight: 400,
          color: "var(--brass)",
          lineHeight: 1,
          marginBottom: "1rem",
        }}
      >
        {roman}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          color: "var(--brass)",
          marginBottom: "0.85rem",
        }}
      >
        {cap}
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.5rem",
          fontWeight: 600,
          lineHeight: 1.15,
          color: "var(--ink)",
          marginBottom: "0.75rem",
        }}
      >
        {title}
      </h3>
      <div
        style={{
          color: "var(--ink)",
          fontSize: "0.97rem",
          lineHeight: 1.5,
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          paddingLeft: "0.85rem",
          borderLeft: "1px solid var(--brass-deep)",
          marginBottom: "1rem",
        }}
      >
        &ldquo;{persona}&rdquo;
      </div>
      <div style={{ color: "var(--ink-dim)", fontSize: "0.88rem", lineHeight: 1.55, marginBottom: "1.25rem" }}>
        {desc}
      </div>
      <ul style={{ listStyle: "none", marginBottom: "1.5rem" }}>
        {verbs.map((v, i) => (
          <li
            key={v.v}
            style={{
              display: "flex",
              alignItems: "baseline",
              padding: "0.35rem 0",
              fontSize: "0.82rem",
              color: "var(--ink-dim)",
              borderTop: i === 0 ? 0 : "1px dashed var(--rule)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span style={{ color: "var(--brass)", marginRight: "0.5rem", minWidth: 60 }}>{v.v}</span>
            <span>{v.t}</span>
          </li>
        ))}
      </ul>
      <Link
        href={cta.href}
        style={{
          marginTop: "auto",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.7rem 1rem",
          background: featured ? "var(--brass)" : "transparent",
          color: featured ? "var(--surface-base)" : "var(--brass)",
          border: `1px solid ${featured ? "var(--brass)" : "var(--brass-deep)"}`,
          borderRadius: 6,
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: "0.85rem",
          transition: "all 0.12s",
        }}
      >
        {cta.label}
      </Link>
    </motion.article>
  );
}

function StratChip({
  id,
  name,
  italic,
  pnl,
  tone,
}: {
  id: number;
  name: string;
  italic: string;
  pnl: string;
  tone: "ok" | "bad";
}) {
  return (
    <Link
      href={`/strategies/${id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        padding: "0.85rem 1rem",
        border: "1px solid var(--rule)",
        borderRadius: 6,
        background: "var(--surface-raised)",
        color: "var(--ink)",
        fontSize: "0.88rem",
        transition: "border-color 0.15s",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: tone === "ok" ? "var(--win)" : "var(--loss)",
          boxShadow: tone === "ok" ? "0 0 6px var(--win)" : "0 0 6px var(--loss)",
          flexShrink: 0,
        }}
      />
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-faint)", fontSize: "0.78rem", width: 38 }}>
        #{id}
      </span>
      <span style={{ flex: 1 }}>
        {name}{" "}
        <em style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--brass)", fontWeight: 400 }}>
          {italic}
        </em>
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.85rem",
          color: tone === "ok" ? "var(--win)" : "var(--loss)",
        }}
      >
        {pnl}
      </span>
      <span style={{ color: "var(--brass-dim)", fontFamily: "var(--font-display)" }}>→</span>
    </Link>
  );
}
