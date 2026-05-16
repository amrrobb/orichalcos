/**
 * Route — /wagers/new
 *
 * Trader-side mint form. Posts to /api/mint-wager which runs the full Path C
 * flow server-side (soul encrypt → 0G Storage upload → 0G Compute TEE inference
 * → on-chain mint + startEpoch). Returns the tokenId, real sealedSoulRoot, and
 * verified TEE chatId.
 *
 * Honest scope shown in the success panel: trade execution in v3 still uses the
 * operator's HL account; per-strategy HL keys derived inside TEE are v3.5.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { EXPLORER_URL } from "@/lib/contracts";

type Archetype = "Bold" | "Patient" | "Sharp" | "Stoic";

type MintResult = {
  tokenId: string;
  sealedSoulRoot: string;
  chatId: string;
  teeValid: boolean;
  mintTx: string;
  epochTx: string | null;
  trader: string;
  archetype: Archetype;
  promise: string;
  note: string;
};

const DEFAULT_PROMISE =
  "I will keep BTC perp drawdown under 20% across this 24-hour epoch. I trade microstructure scalps only, no overnight positions, no leverage above 5x. If I underdeliver, my 1000 USDC bond pays the challengers — that is the wager.";

export default function NewWagerPage() {
  const { address, isConnected } = useAccount();
  const [archetype, setArchetype] = useState<Archetype>("Bold");
  const [promise, setPromise] = useState(DEFAULT_PROMISE);
  const [bond, setBond] = useState("1000");
  const [drawdownPct, setDrawdownPct] = useState("20");
  const [epochHours, setEpochHours] = useState("24");
  const [traderInput, setTraderInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MintResult | null>(null);

  const effectiveTrader = traderInput || address || "";

  async function submit() {
    setError(null);
    setResult(null);
    if (!effectiveTrader) {
      setError("Connect a wallet or paste a trader address.");
      return;
    }
    setLoading(true);
    setStage("Encrypting soul + uploading to 0G Storage + running TEE inference… (~30–60s)");
    try {
      const r = await fetch("/api/mint-wager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trader: effectiveTrader,
          archetype,
          promise,
          bond: Number(bond),
          drawdownBps: Math.round(Number(drawdownPct) * 100),
          epochSecs: Math.round(Number(epochHours) * 3600),
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || `HTTP ${r.status}`);
      } else {
        setResult(data as MintResult);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setStage("");
    }
  }

  return (
    <div className="max-w-[920px] mx-auto px-6 py-12">
      <p className="label mb-3">Trader · open a new wager</p>
      <h1
        className="display-2 mb-3"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600, lineHeight: 1.1 }}
      >
        Bond against your promise.
      </h1>
      <p className="body text-[var(--ink-dim)] mb-8 max-w-xl">
        Write your bonded promise in your own words. We seal it inside 0G Compute TEE, upload the encrypted soul to 0G Storage,
        and mint an ERC-7857 wager INFT on 0G mainnet — all in one request. Real TEE attestation, no template.
      </p>

      <div
        style={{
          border: "1px solid var(--rule)",
          borderRadius: 10,
          background: "var(--surface-raised)",
          padding: "1.5rem",
          display: "grid",
          gap: "1.2rem",
        }}
      >
        {/* Trader address */}
        <Field label="Trader (INFT owner)">
          <input
            type="text"
            value={traderInput}
            onChange={(e) => setTraderInput(e.target.value)}
            placeholder={isConnected && address ? `Connected wallet (${shortAddr(address)})` : "0x… (paste an address)"}
            style={inputStyle}
          />
          <Hint>
            {isConnected && address && !traderInput
              ? `Will mint to your connected wallet: ${shortAddr(address)}`
              : "INFT will be owned by this address. The operator pays gas."}
          </Hint>
        </Field>

        {/* Archetype */}
        <Field label="Archetype · decorative">
          <select
            value={archetype}
            onChange={(e) => setArchetype(e.target.value as Archetype)}
            style={inputStyle}
          >
            <option value="Bold">Bold · momentum scalper</option>
            <option value="Patient">Patient · mean-reversion</option>
            <option value="Sharp">Sharp · microstructure</option>
            <option value="Stoic">Stoic · grid / range</option>
          </select>
          <Hint>Stored on chain as a uint8 enum. The contract doesn&apos;t enforce trading style — your promise below is what&apos;s enforced.</Hint>
        </Field>

        {/* The promise — main field */}
        <Field label="Your bonded promise · free text, sealed inside TEE">
          <textarea
            value={promise}
            onChange={(e) => setPromise(e.target.value)}
            rows={5}
            maxLength={500}
            style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: "0.85rem", lineHeight: 1.5, resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Hint>Your verbatim words become the system prompt for the TEE inference. Sealed in 0G Compute, attested via chatId.</Hint>
            <span className="mono caption text-[var(--ink-faint)]" style={{ fontSize: "0.65rem" }}>
              {promise.length} / 500
            </span>
          </div>
        </Field>

        {/* Bond / drawdown / epoch */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem" }}>
          <Field label="Bond (USDC)">
            <input type="number" min={10} max={10000} value={bond} onChange={(e) => setBond(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Drawdown cap (%)">
            <input type="number" min={1} max={99} value={drawdownPct} onChange={(e) => setDrawdownPct(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Epoch duration (h)">
            <input type="number" min={0.02} max={168} step={0.5} value={epochHours} onChange={(e) => setEpochHours(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <button
          onClick={submit}
          disabled={loading || !effectiveTrader || promise.length < 10}
          style={{
            background: loading ? "var(--surface-locked)" : "var(--brass)",
            color: "var(--surface-base)",
            border: 0,
            borderRadius: 8,
            padding: "0.85rem 1.3rem",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: loading || !effectiveTrader ? "not-allowed" : "pointer",
            opacity: loading || !effectiveTrader ? 0.6 : 1,
          }}
        >
          {loading ? "Sealing + minting…" : "Seal in TEE + mint wager"}
        </button>

        {stage && (
          <p className="caption mono text-[var(--ink-dim)]" style={{ fontSize: "0.78rem" }}>
            {stage}
          </p>
        )}
        {error && (
          <p
            className="caption mono"
            style={{ color: "var(--loss)", fontSize: "0.78rem", border: "1px solid var(--loss)", padding: "0.6rem 0.8rem", borderRadius: 6 }}
          >
            ⚠ {error}
          </p>
        )}
      </div>

      {result && (
        <div
          style={{
            marginTop: "1.5rem",
            border: "1px solid var(--brass-dim)",
            borderRadius: 10,
            background: "var(--surface-raised)",
            padding: "1.5rem",
          }}
        >
          <p className="label mb-1" style={{ color: "var(--win)" }}>✓ Wager minted on 0G Chain</p>
          <h2 className="display-3 mb-3" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            Wager #{result.tokenId} sealed in TEE.
          </h2>

          <div style={{ display: "grid", gap: "0.55rem", fontFamily: "var(--font-mono)", fontSize: "0.78rem", lineHeight: 1.5 }}>
            <Row k="tokenId" v={`#${result.tokenId}`} />
            <Row k="owner (trader)" v={shortAddr(result.trader)} />
            <Row k="archetype" v={result.archetype} />
            <Row k="sealed soul (0G Storage)" v={`${result.sealedSoulRoot.slice(0, 18)}…`} />
            <Row k="TEE chatId (0G Compute)" v={result.chatId} valid={result.teeValid} />
            <Row k="mint tx" v={
              <a href={`${EXPLORER_URL}/tx/${result.mintTx}`} target="_blank" rel="noreferrer" style={{ color: "var(--brass)", textDecoration: "underline" }}>
                {result.mintTx.slice(0, 14)}…
              </a>
            } />
            {result.epochTx && (
              <Row k="startEpoch tx" v={
                <a href={`${EXPLORER_URL}/tx/${result.epochTx}`} target="_blank" rel="noreferrer" style={{ color: "var(--brass)", textDecoration: "underline" }}>
                  {result.epochTx.slice(0, 14)}…
                </a>
              } />
            )}
          </div>

          <p className="body" style={{ marginTop: "1rem", fontSize: "0.82rem", color: "var(--ink-dim)", lineHeight: 1.55 }}>
            <strong style={{ color: "var(--ink)" }}>Honest scope note.</strong> {result.note}
          </p>

          <div style={{ marginTop: "1.2rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <Link
              href={`/strategies/${result.tokenId}`}
              style={{ background: "var(--brass)", color: "var(--surface-base)", padding: "0.55rem 1rem", borderRadius: 6, fontWeight: 600, fontFamily: "var(--font-sans)", fontSize: "0.85rem", textDecoration: "none" }}
            >
              View wager dossier →
            </Link>
            <Link
              href="/protocol"
              style={{ color: "var(--brass)", padding: "0.55rem 1rem", border: "1px solid var(--rule)", borderRadius: 6, fontFamily: "var(--font-sans)", fontSize: "0.85rem", textDecoration: "none" }}
            >
              Back to protocol grid
            </Link>
          </div>
        </div>
      )}

      <p className="caption text-[var(--ink-faint)] mono" style={{ marginTop: "2rem", fontSize: "0.7rem", lineHeight: 1.5 }}>
        Server-side flow: encrypt soul (AES-256-GCM) → upload to 0G Storage → run TEE inference (Qwen 2.5 7B on 0G Compute, Intel TDX + H100) → verify chatId via processResponse → mint INFT on 0G Chain. The trader&apos;s free-text words live inside the encrypted soul, attested. Per-trade TEE attestation + per-strategy HL execution keys are v3.5 roadmap.
      </p>
    </div>
  );
}

// ─── tiny presentational helpers ──────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: "0.35rem" }}>
      <span className="label" style={{ fontSize: "0.65rem", letterSpacing: "0.15em" }}>
        {label}
      </span>
      {children}
    </div>
  );
}
function Hint({ children }: { children: React.ReactNode }) {
  return (
    <span className="caption" style={{ fontSize: "0.72rem", color: "var(--ink-faint)", lineHeight: 1.4 }}>
      {children}
    </span>
  );
}
function Row({ k, v, valid }: { k: string; v: React.ReactNode; valid?: boolean }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", flexWrap: "wrap" }}>
      <span className="label" style={{ fontSize: "0.65rem", minWidth: 180, color: "var(--ink-faint)" }}>
        {k}
      </span>
      <span style={{ color: "var(--ink)", wordBreak: "break-all" }}>{v}</span>
      {valid !== undefined && (
        <span style={{ color: valid ? "var(--win)" : "var(--ink-faint)", fontSize: "0.7rem" }}>
          {valid ? "✓ attested" : "(unverified)"}
        </span>
      )}
    </div>
  );
}
function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface-base)",
  border: "1px solid var(--rule)",
  borderRadius: 6,
  padding: "0.6rem 0.8rem",
  color: "var(--ink)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.85rem",
  width: "100%",
  outline: "none",
};
