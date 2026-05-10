/**
 * VerifyModal — opened on wax seal click.
 *
 * Exposes the cryptographic evidence so a skeptical judge can reproduce the
 * verification chain themselves. Per advisor: this is the demo's most defensible
 * technical moment.
 *
 *   - TEE seal:  shows chatId + provider verification status + the
 *                /v1/proxy/signature/{chatId} URL pattern they could hit
 *   - 0G seal:   shows merkle root + how to download via SDK or /api/tell
 *   - Pyth seal: shows feedId + price-at-commit + chainscan link
 */
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { EXPLORER_URL, ADDRESSES, STORAGE_INDEXER_URL } from "@/lib/contracts";
import { pythFeedLabel } from "@/lib/constants";
import { formatHash, formatPythPrice } from "@/lib/format";

type SealKind = "tee" | "0g" | "pyth";

interface VerifyModalProps {
  kind: SealKind | null;
  onClose: () => void;
  /** TEE chatIds for both sides (if available) */
  challengerChatId?: string;
  defenderChatId?: string;
  /** 0G Storage merkle roots for the public tells */
  challengerTellRoot?: string;
  defenderTellRoot?: string;
  /** Pyth feed + commit price */
  priceFeedId?: string;
  priceAtCommit?: bigint;
  /** Optional chainscan tx hash for the settle transaction */
  settleTxHash?: string;
}

export function VerifyModal({
  kind,
  onClose,
  challengerChatId,
  defenderChatId,
  challengerTellRoot,
  defenderTellRoot,
  priceFeedId,
  priceAtCommit,
  settleTxHash,
}: VerifyModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!kind) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [kind, onClose]);

  if (!kind) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[var(--surface-raised)] border border-[var(--brass-dim)] rounded-[var(--radius-lg)] max-w-xl w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "var(--shadow-modal)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="label" style={{ fontSize: "0.65rem" }}>
              {KIND_HEADER[kind]}
            </p>
            <h3
              className="display-3 mt-1"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.5rem" }}
            >
              {KIND_TITLE[kind]}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--ink-dim)] hover:text-[var(--brass-bright)] text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {kind === "tee" && (
          <TeeBody challengerChatId={challengerChatId} defenderChatId={defenderChatId} />
        )}
        {kind === "0g" && (
          <ZgBody
            challengerTellRoot={challengerTellRoot}
            defenderTellRoot={defenderTellRoot}
          />
        )}
        {kind === "pyth" && (
          <PythBody
            priceFeedId={priceFeedId}
            priceAtCommit={priceAtCommit}
            settleTxHash={settleTxHash}
          />
        )}
      </div>
    </div>
  );
}

const KIND_HEADER: Record<SealKind, string> = {
  tee: "Sealed inference",
  "0g": "Content-addressed storage",
  pyth: "Oracle settlement",
};
const KIND_TITLE: Record<SealKind, string> = {
  tee: "TEE attestation",
  "0g": "0G Storage merkle root",
  pyth: "Pyth Network proof",
};

function TeeBody({ challengerChatId, defenderChatId }: { challengerChatId?: string; defenderChatId?: string }) {
  return (
    <div className="space-y-4">
      <p className="body-sm text-[var(--ink-dim)] leading-relaxed">
        Both Apprentices&apos; soul prompts were decrypted inside an Intel TDX + H100 enclave on
        a 0G Compute provider. Each response is signed by an enclave-born key; the broker
        verifies the signature when settling fees. Verifiable by hitting the provider&apos;s
        signature endpoint with the chatId.
      </p>
      <div className="space-y-3">
        {challengerChatId && (
          <EvidenceRow label="Challenger chatId" value={challengerChatId} mono full />
        )}
        {defenderChatId && (
          <EvidenceRow label="Defender chatId" value={defenderChatId} mono full />
        )}
      </div>
      <p className="caption text-[var(--ink-faint)] mt-3 italic">
        Verification: the broker calls {`/v1/proxy/signature/{chatId}?model={model}`} on the
        provider and recovers the signing address from the message hash.
      </p>
    </div>
  );
}

function ZgBody({ challengerTellRoot, defenderTellRoot }: { challengerTellRoot?: string; defenderTellRoot?: string }) {
  return (
    <div className="space-y-4">
      <p className="body-sm text-[var(--ink-dim)] leading-relaxed">
        Each Apprentice&apos;s public tell — the one-paragraph reasoning — is uploaded to 0G
        Storage as a content-addressed JSON blob. The merkle root is committed on-chain in
        the duel record. Editing the tell rewrites the hash, which would break the chain.
      </p>
      <div className="space-y-3">
        {challengerTellRoot && (
          <EvidenceRow label="Challenger tell root" value={challengerTellRoot} mono full />
        )}
        {defenderTellRoot && (
          <EvidenceRow label="Defender tell root" value={defenderTellRoot} mono full />
        )}
      </div>
      <p className="caption text-[var(--ink-faint)] mt-3 italic">
        Indexer: <span className="mono">{STORAGE_INDEXER_URL}</span>. Read directly from this
        site at <span className="mono">/api/tell?root=&lt;root&gt;</span>.
      </p>
    </div>
  );
}

function PythBody({
  priceFeedId,
  priceAtCommit,
  settleTxHash,
}: {
  priceFeedId?: string;
  priceAtCommit?: bigint;
  settleTxHash?: string;
}) {
  return (
    <div className="space-y-4">
      <p className="body-sm text-[var(--ink-dim)] leading-relaxed">
        At commit time the duel contract reads the Pyth-fed asset price using
        getPriceNoOlderThan(). At settle, it reads again. The price delta determines the
        winner. On Galileo testnet, MockPyth implements the same interface; on Aristotle
        mainnet the real Pyth contract supplies the price.
      </p>
      <div className="space-y-3">
        {priceFeedId && (
          <EvidenceRow label="Feed" value={pythFeedLabel(priceFeedId)} />
        )}
        {priceFeedId && <EvidenceRow label="Feed ID" value={priceFeedId} mono full />}
        {priceAtCommit !== undefined && (
          <EvidenceRow label="Price at commit" value={`$${formatPythPrice(priceAtCommit)}`} />
        )}
        {settleTxHash && (
          <EvidenceRow
            label="Settle tx"
            value={
              <Link
                href={`${EXPLORER_URL}/tx/${settleTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brass-bright)] hover:underline underline-offset-4 mono"
              >
                {formatHash(settleTxHash)} ↗
              </Link>
            }
          />
        )}
        <EvidenceRow
          label="ScryingDuel contract"
          value={
            <Link
              href={`${EXPLORER_URL}/address/${ADDRESSES.scryingDuel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brass-bright)] hover:underline underline-offset-4 mono"
            >
              {formatHash(ADDRESSES.scryingDuel)} ↗
            </Link>
          }
        />
      </div>
    </div>
  );
}

function EvidenceRow({
  label,
  value,
  mono = false,
  full = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 pb-2 border-b border-[var(--rule)] last:border-0">
      <span className="caption text-[var(--ink-dim)] flex-shrink-0">{label}</span>
      <span
        className={`text-right ${mono ? "mono" : ""}`}
        style={{
          fontSize: full ? "0.7rem" : "0.875rem",
          color: "var(--ink)",
          wordBreak: full ? "break-all" : "normal",
          maxWidth: full ? "60%" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
