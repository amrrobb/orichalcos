/**
 * "Get test USDC" faucet button.
 *
 * Calls MockUSDC.mint(connectedAddress, 10_000 USDC). Surfaced in the
 * header for self-onboarding judges — without it, the buy-policy flow
 * requires manual airdrop.
 */
"use client";

import { useEffect, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { EXPLORER_URL, V3_ADDRESSES } from "@/lib/contracts";
import { MOCK_USDC_ABI } from "@/lib/abi/v3";

const MINT_AMOUNT = 10_000_000_000n; // 10,000 USDC at 6 decimals

interface Props {
  variant?: "header" | "inline";
}

export function FaucetButton({ variant = "header" }: Props) {
  const { address, isConnected } = useAccount();
  const tx = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: tx.data });
  const [showToast, setShowToast] = useState(false);

  // Show toast on confirmation, auto-dismiss after 6s.
  useEffect(() => {
    if (receipt.isSuccess && tx.data) {
      setShowToast(true);
      const id = setTimeout(() => setShowToast(false), 6000);
      return () => clearTimeout(id);
    }
  }, [receipt.isSuccess, tx.data]);

  if (!isConnected) return null;

  const onClick = () => {
    if (!address) return;
    tx.writeContract({
      address: V3_ADDRESSES.mockUsdc,
      abi: MOCK_USDC_ABI,
      functionName: "mint",
      args: [address, MINT_AMOUNT],
    });
  };

  const isPending = tx.isPending || receipt.isLoading;

  const headerStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: isPending ? "var(--ink-faint)" : "var(--brass)",
    border: "1px solid var(--brass-deep)",
    background: "rgba(212,165,116,0.06)",
    padding: "0.45rem 0.75rem",
    borderRadius: 4,
    whiteSpace: "nowrap",
    cursor: isPending ? "wait" : "pointer",
    transition: "all 0.12s",
  };

  const inlineStyle: React.CSSProperties = {
    ...headerStyle,
    fontSize: "0.75rem",
    padding: "0.55rem 0.9rem",
  };

  return (
    <>
      <button
        onClick={onClick}
        disabled={isPending}
        style={variant === "header" ? headerStyle : inlineStyle}
        title="Mint 10,000 test USDC to your wallet"
      >
        {isPending ? "Minting…" : "Get test USDC ↗"}
      </button>

      {showToast && tx.data && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100,
            background: "var(--surface-raised)",
            border: "1px solid var(--brass-deep)",
            borderRadius: 6,
            padding: "0.85rem 1.1rem",
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)",
            maxWidth: 320,
            fontFamily: "var(--font-sans)",
            fontSize: "0.85rem",
            color: "var(--ink)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--win)",
              marginBottom: "0.35rem",
            }}
          >
            ✓ 10,000 test USDC minted
          </div>
          <div style={{ color: "var(--ink-dim)", marginBottom: "0.4rem", lineHeight: 1.4 }}>
            You can now place a stake on any active Strategy Agent.
          </div>
          <a
            href={`${EXPLORER_URL}/tx/${tx.data}`}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              color: "var(--brass)",
            }}
          >
            View tx on chainscan ↗
          </a>
        </div>
      )}
    </>
  );
}
