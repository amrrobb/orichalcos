// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/v3/StrategyINFT.sol";
import "../../src/v3/InsurancePool.sol";
import "../../src/v3/TradeAttestation.sol";
import "../../src/legacy/tokens/MockUSDC.sol";

/// @title TradeAttestation.t.sol — unit tests for TEE-attested trade log
contract TradeAttestationTest is Test {
    MockUSDC usdc;
    StrategyINFT strategy;
    InsurancePool pool;
    TradeAttestation attestation;

    address trader = address(0xA1);
    address operator = address(0xD1);
    address other = address(0xA2);

    bytes32 constant CHAT_ID = bytes32(uint256(0x111));
    bytes32 constant STORAGE_ROOT = bytes32(uint256(0x222));
    bytes32 constant HL_TX = bytes32(uint256(0x333));

    function setUp() public {
        usdc = new MockUSDC();
        strategy = new StrategyINFT(address(usdc));
        pool = new InsurancePool(address(usdc), address(strategy));
        attestation = new TradeAttestation(address(strategy));

        strategy.setTradeAttestation(address(attestation));
        strategy.setInsurancePool(address(pool));
        attestation.setOperator(operator);

        usdc.mint(trader, 10_000e6);
    }

    function _activeStrategy() internal returns (uint256 tokenId) {
        tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, bytes32(uint256(1)), bytes32(uint256(2)));
        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        strategy.startEpoch(tokenId, 1_000e6, 2000, 7 days);
        vm.stopPrank();
    }

    // ─────────────────────────── recordTrade ───────────────────────────

    function test_recordTrade_appends_and_updates_equity() public {
        uint256 tokenId = _activeStrategy();

        vm.prank(operator);
        uint256 idx = attestation.recordTrade(tokenId, CHAT_ID, STORAGE_ROOT, HL_TX, 50e6, 1_050e6);

        assertEq(idx, 0, "first trade index");
        assertEq(attestation.tradeCount(tokenId), 1, "count");

        TradeAttestation.Trade memory t = attestation.getTradeAt(tokenId, 0);
        assertEq(t.chatId, CHAT_ID, "chatId");
        assertEq(t.storageRoot, STORAGE_ROOT, "storageRoot");
        assertEq(t.hyperliquidTxHash, HL_TX, "hl tx");
        assertEq(t.pnlDelta, 50e6, "pnl");
        assertEq(t.equityAfter, 1_050e6, "equityAfter");

        // Equity propagated into StrategyINFT
        assertEq(strategy.getData(tokenId).currentEquity, 1_050e6, "strategy equity updated");
    }

    function test_recordTrade_multiple_appends_in_order() public {
        uint256 tokenId = _activeStrategy();

        vm.startPrank(operator);
        attestation.recordTrade(tokenId, CHAT_ID, STORAGE_ROOT, HL_TX, 50e6, 1_050e6);
        attestation.recordTrade(tokenId, CHAT_ID, STORAGE_ROOT, HL_TX, -100e6, 950e6);
        attestation.recordTrade(tokenId, CHAT_ID, STORAGE_ROOT, HL_TX, 30e6, 980e6);
        vm.stopPrank();

        assertEq(attestation.tradeCount(tokenId), 3, "3 trades");
        assertEq(attestation.getTradeAt(tokenId, 2).equityAfter, 980e6, "latest equity");
        assertEq(strategy.getData(tokenId).currentEquity, 980e6, "strategy mirrors latest");
    }

    function test_getTrades_returns_full_array() public {
        uint256 tokenId = _activeStrategy();

        vm.startPrank(operator);
        attestation.recordTrade(tokenId, CHAT_ID, STORAGE_ROOT, HL_TX, 50e6, 1_050e6);
        attestation.recordTrade(tokenId, CHAT_ID, STORAGE_ROOT, HL_TX, -100e6, 950e6);
        vm.stopPrank();

        TradeAttestation.Trade[] memory trades = attestation.getTrades(tokenId);
        assertEq(trades.length, 2, "2 trades");
        assertEq(trades[0].equityAfter, 1_050e6);
        assertEq(trades[1].equityAfter, 950e6);
    }

    // ─────────────────────────── access control ───────────────────────────

    function test_revert_recordTrade_from_non_operator() public {
        uint256 tokenId = _activeStrategy();
        vm.prank(other);
        vm.expectRevert(TradeAttestation.OnlyOperator.selector);
        attestation.recordTrade(tokenId, CHAT_ID, STORAGE_ROOT, HL_TX, 0, 1_000e6);
    }

    function test_revert_recordTrade_when_not_active() public {
        // Strategy minted but no epoch started → status is Idle
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, bytes32(uint256(1)), bytes32(uint256(2)));
        vm.prank(operator);
        vm.expectRevert(TradeAttestation.EpochNotActive.selector);
        attestation.recordTrade(tokenId, CHAT_ID, STORAGE_ROOT, HL_TX, 0, 1_000e6);
    }

    function test_setOperator_only_owner() public {
        attestation.setOperator(other);
        assertEq(attestation.operator(), other, "owner can change operator");

        vm.prank(other);
        vm.expectRevert(TradeAttestation.OnlyOwner.selector);
        attestation.setOperator(address(0x9999));
    }
}
