/**
 * Wraps the approve→buyPolicy flow.
 *
 * Premium = (maxClaim * premiumBps) / 10000 — that's what we approve, NOT
 * maxClaim. (Easy bug: only the premium is pulled from the allocator's wallet.)
 */
"use client";

import { useCallback } from "react";
import { V3_ADDRESSES } from "@/lib/contracts";
import { INSURANCE_POOL_ABI } from "@/lib/abi/v3";
import { useApproveAndCall } from "./useApproveAndCall";

export function useBuyPolicy() {
  const flow = useApproveAndCall<readonly [bigint, bigint]>();

  const buyPolicy = useCallback(
    (tokenId: bigint, maxClaim: bigint, premium: bigint) => {
      flow.start({
        spender: V3_ADDRESSES.insurancePool,
        amount: premium,
        contract: {
          address: V3_ADDRESSES.insurancePool,
          abi: INSURANCE_POOL_ABI,
          functionName: "buyPolicy",
          args: [tokenId, maxClaim],
        },
      });
    },
    [flow],
  );

  return { ...flow, buyPolicy };
}
