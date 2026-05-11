/**
 * Wraps the approve→deposit flow for LPs.
 */
"use client";

import { useCallback } from "react";
import { V3_ADDRESSES } from "@/lib/contracts";
import { INSURANCE_POOL_ABI } from "@/lib/abi/v3";
import { useApproveAndCall } from "./useApproveAndCall";

export function useDepositLP() {
  const flow = useApproveAndCall<readonly [bigint]>();

  const deposit = useCallback(
    (assets: bigint) => {
      flow.start({
        spender: V3_ADDRESSES.insurancePool,
        amount: assets,
        contract: {
          address: V3_ADDRESSES.insurancePool,
          abi: INSURANCE_POOL_ABI,
          functionName: "deposit",
          args: [assets],
        },
      });
    },
    [flow],
  );

  return { ...flow, deposit };
}
