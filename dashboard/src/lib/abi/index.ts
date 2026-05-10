/**
 * ABIs for v2 contracts. Sourced from the production-tested calls in
 * agent/src/duel/run-champion-duel.ts and agent/src/duel/mint-champions.ts.
 *
 * Only the read functions and events the frontend uses are included. Writes
 * (challenge, commitDirection, settle) are agent-only in v2 demo scope.
 */

export const APPRENTICE_INFT_ABI = [
  {
    type: "function",
    name: "getData",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "apprenticeType", type: "uint8" }, // 0=Bold, 1=Patient, 2=Sharp, 3=Stoic
          { name: "currentTitle", type: "uint8" },   // 0=Initiate, 1=Apprentice, 2=Adept, 3=Master, 4=Sage
          { name: "elo", type: "uint16" },
          { name: "wins", type: "uint32" },
          { name: "losses", type: "uint32" },
          { name: "sealedSoulRoot", type: "bytes32" },
          { name: "metadataHash", type: "bytes32" },
          { name: "mintedBy", type: "address" },
          { name: "mintedAt", type: "uint256" },
          { name: "championBeaten", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const CODEX_ABI = [
  {
    type: "function",
    name: "championOf",
    stateMutability: "view",
    inputs: [{ name: "apprenticeType", type: "uint8" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const SCRYING_DUEL_ABI = [
  {
    type: "function",
    name: "nextDuelId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getDuel",
    stateMutability: "view",
    inputs: [{ name: "duelId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "challengerTokenId", type: "uint256" },
          { name: "defenderTokenId", type: "uint256" },
          { name: "priceFeedId", type: "bytes32" },
          { name: "priceAtCommit", type: "int64" },
          { name: "commitTimestamp", type: "uint256" },
          { name: "settleTimestamp", type: "uint256" },
          { name: "windowSeconds", type: "uint64" },
          { name: "challengerCall", type: "uint8" }, // 0=LONG, 1=SHORT
          { name: "defenderCall", type: "uint8" },
          { name: "challengerTellHash", type: "bytes32" },
          { name: "defenderTellHash", type: "bytes32" },
          { name: "challengerAttestationHash", type: "bytes32" },
          { name: "defenderAttestationHash", type: "bytes32" },
          { name: "stake", type: "uint256" },
          { name: "status", type: "uint8" }, // 0=Open, 1=Committed, 2=Settled, 3=Cancelled
          { name: "challengerCommitted", type: "bool" },
          { name: "defenderCommitted", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "DuelSettled",
    inputs: [
      { name: "duelId", type: "uint256", indexed: true },
      { name: "winnerTokenId", type: "uint256", indexed: true },
      { name: "loserTokenId", type: "uint256", indexed: true },
      { name: "priceAtCommit", type: "int64", indexed: false },
      { name: "priceAtSettle", type: "int64", indexed: false },
      { name: "winnings", type: "uint256", indexed: false },
      { name: "protocolFee", type: "uint256", indexed: false },
    ],
  },
] as const;
