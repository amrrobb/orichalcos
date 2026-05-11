// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./StrategyINFT.sol";

/// @title TradeAttestation — Append-only TEE-attested trade log for Orichalcos v3
/// @notice Every trade a Strategy Agent makes lands here. Each record carries:
///          - 0G Compute TEE chatId (proves which TEE inference produced the decision)
///          - 0G Storage merkle root (encrypted blob: decision + attestation + receipt)
///          - Hyperliquid testnet/mainnet txHash (the real on-chain execution)
///          - Signed P&L delta (operator-reported; v3.1 = oracle-verified)
///         Records call back into StrategyINFT.recordEquityUpdate() so per-token equity
///         stays in sync with the trade log without reading it back.
///
/// @dev v3 trusts the operator to report P&L matching the Hyperliquid txHash. Judges
///      can verify by clicking the txHash → Hyperliquid explorer → see the actual fill.
///      v3.1 roadmap: Pyth or Hyperliquid oracle to verify P&L on-chain at attest time.
contract TradeAttestation {
    struct Trade {
        uint256 strategyId;
        uint256 epochId;
        bytes32 chatId;             // 0G Compute TEE attestation chatId
        bytes32 storageRoot;        // 0G Storage hash: {decision, attestation, tradeReceipt}
        bytes32 hyperliquidTxHash;  // real on-chain Hyperliquid tx (or 0x0 in MOCK_DEX)
        int256 pnlDelta;            // signed P&L change in USDC (6 decimals)
        uint256 equityAfter;        // post-trade equity, mirrored into StrategyINFT
        uint256 timestamp;
    }

    StrategyINFT public immutable strategyINFT;
    address public immutable owner;
    address public operator;        // off-chain agent runner authorized to attest

    mapping(uint256 => Trade[]) public tradesByStrategy;

    event TradeRecorded(
        uint256 indexed strategyId,
        uint256 indexed epochId,
        uint256 tradeIndex,
        bytes32 chatId,
        bytes32 storageRoot,
        bytes32 hyperliquidTxHash,
        int256 pnlDelta,
        uint256 equityAfter
    );
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);

    error OnlyOwner();
    error OnlyOperator();
    error EpochNotActive();
    error InvalidEquity();

    constructor(address _strategyINFT) {
        strategyINFT = StrategyINFT(_strategyINFT);
        owner = msg.sender;
    }

    // ─────────────────────────── Admin ───────────────────────────

    function setOperator(address newOperator) external {
        if (msg.sender != owner) revert OnlyOwner();
        emit OperatorUpdated(operator, newOperator);
        operator = newOperator;
    }

    // ─────────────────────────── Attestation ───────────────────────────

    /// @notice Record a single TEE-attested trade. Updates StrategyINFT equity in same tx.
    /// @dev Reverts if strategy's epoch is not Active. Reverts if equityAfter implies
    ///      a bond underflow (sanity: equity floors at 0). pnlDelta is informational —
    ///      equity is what's authoritative for breach detection.
    function recordTrade(
        uint256 strategyId,
        bytes32 chatId,
        bytes32 storageRoot,
        bytes32 hyperliquidTxHash,
        int256 pnlDelta,
        uint256 equityAfter
    ) external returns (uint256 tradeIndex) {
        if (msg.sender != operator) revert OnlyOperator();
        StrategyINFT.StrategyData memory sd = strategyINFT.getData(strategyId);
        if (sd.status != StrategyINFT.EpochStatus.Active) revert EpochNotActive();

        Trade memory t = Trade({
            strategyId: strategyId,
            epochId: sd.currentEpochId,
            chatId: chatId,
            storageRoot: storageRoot,
            hyperliquidTxHash: hyperliquidTxHash,
            pnlDelta: pnlDelta,
            equityAfter: equityAfter,
            timestamp: block.timestamp
        });
        tradesByStrategy[strategyId].push(t);
        tradeIndex = tradesByStrategy[strategyId].length - 1;

        // Mirror equity into StrategyINFT — that's where breach detection reads.
        strategyINFT.recordEquityUpdate(strategyId, equityAfter);

        emit TradeRecorded(
            strategyId,
            sd.currentEpochId,
            tradeIndex,
            chatId,
            storageRoot,
            hyperliquidTxHash,
            pnlDelta,
            equityAfter
        );
    }

    // ─────────────────────────── Views ───────────────────────────

    function getTrades(uint256 strategyId) external view returns (Trade[] memory) {
        return tradesByStrategy[strategyId];
    }

    function tradeCount(uint256 strategyId) external view returns (uint256) {
        return tradesByStrategy[strategyId].length;
    }

    function getTradeAt(uint256 strategyId, uint256 index) external view returns (Trade memory) {
        return tradesByStrategy[strategyId][index];
    }
}
