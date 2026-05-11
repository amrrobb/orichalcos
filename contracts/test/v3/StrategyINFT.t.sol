// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/v3/StrategyINFT.sol";
import "../../src/v3/InsurancePool.sol";
import "../../src/v3/TradeAttestation.sol";
import "../../src/legacy/tokens/MockUSDC.sol";

/// @title StrategyINFT.t.sol — unit tests for StrategyINFT lifecycle + access control
contract StrategyINFTTest is Test {
    MockUSDC usdc;
    StrategyINFT strategy;
    InsurancePool pool;
    TradeAttestation attestation;

    address trader = address(0xA1);
    address other = address(0xA2);
    address operator = address(0xD1);

    bytes32 constant SEALED_SOUL = bytes32(uint256(0xDEADBEEF));
    bytes32 constant METADATA = bytes32(uint256(0xCAFEBABE));

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

    // ─────────────────────────── mint ───────────────────────────

    function test_mint_sets_initial_state() public {
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Patient, SEALED_SOUL, METADATA);
        assertEq(tokenId, 1, "first tokenId is 1 (0 reserved)");
        assertEq(strategy.ownerOf(tokenId), trader, "trader owns");

        StrategyINFT.StrategyData memory d = strategy.getData(tokenId);
        assertEq(uint8(d.archetype), uint8(StrategyINFT.Archetype.Patient), "archetype");
        assertEq(d.sealedSoulRoot, SEALED_SOUL, "soul root");
        assertEq(d.metadataHash, METADATA, "metadata");
        assertEq(d.currentEpochId, 0, "no epoch");
        assertEq(uint8(d.status), uint8(StrategyINFT.EpochStatus.Idle), "idle");
    }

    function test_revert_mint_with_zero_soul() public {
        vm.expectRevert(StrategyINFT.InvalidSealedSoul.selector);
        strategy.mint(trader, StrategyINFT.Archetype.Bold, bytes32(0), METADATA);
    }

    function test_token_ids_increment() public {
        uint256 a = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);
        uint256 b = strategy.mint(trader, StrategyINFT.Archetype.Sharp, SEALED_SOUL, METADATA);
        assertEq(b, a + 1, "ids increment");
    }

    // ─────────────────────────── startEpoch ───────────────────────────

    function test_startEpoch_locks_bond_and_activates() public {
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);

        vm.startPrank(trader);
        usdc.approve(address(strategy), 1_000e6);
        uint256 epochId = strategy.startEpoch(tokenId, 1_000e6, 2000, 7 days);
        vm.stopPrank();

        assertEq(epochId, 1, "first epoch id");
        assertEq(usdc.balanceOf(address(strategy)), 1_000e6, "bond locked");

        StrategyINFT.StrategyData memory d = strategy.getData(tokenId);
        assertEq(d.bondAmount, 1_000e6, "bond amount");
        assertEq(d.startingBond, 1_000e6, "starting bond snapshot");
        assertEq(d.currentEquity, 1_000e6, "equity = bond at start");
        assertEq(d.maxDrawdownBps, 2000, "drawdown");
        assertEq(uint8(d.status), uint8(StrategyINFT.EpochStatus.Active), "active");
        assertEq(d.epochEndTs, block.timestamp + 7 days, "end ts");
    }

    function test_revert_startEpoch_from_non_owner() public {
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);

        vm.startPrank(other);
        usdc.mint(other, 1_000e6);
        usdc.approve(address(strategy), 1_000e6);
        vm.expectRevert(StrategyINFT.OnlyTraderOrApproved.selector);
        strategy.startEpoch(tokenId, 1_000e6, 2000, 7 days);
        vm.stopPrank();
    }

    function test_revert_double_startEpoch() public {
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);

        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        strategy.startEpoch(tokenId, 1_000e6, 2000, 7 days);

        vm.expectRevert(StrategyINFT.EpochNotIdle.selector);
        strategy.startEpoch(tokenId, 500e6, 1500, 3 days);
        vm.stopPrank();
    }

    function test_revert_startEpoch_invalid_drawdown_zero() public {
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);
        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        vm.expectRevert(StrategyINFT.InvalidDrawdown.selector);
        strategy.startEpoch(tokenId, 1_000e6, 0, 7 days);
        vm.stopPrank();
    }

    function test_revert_startEpoch_drawdown_too_high() public {
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);
        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        vm.expectRevert(StrategyINFT.InvalidDrawdown.selector);
        strategy.startEpoch(tokenId, 1_000e6, 10_000, 7 days);
        vm.stopPrank();
    }

    // ─────────────────────────── access control ───────────────────────────

    function test_only_trade_attestation_can_update_equity() public {
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);
        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        strategy.startEpoch(tokenId, 1_000e6, 2000, 7 days);
        vm.stopPrank();

        // Random caller blocked
        vm.expectRevert(StrategyINFT.OnlyTradeAttestation.selector);
        strategy.recordEquityUpdate(tokenId, 900e6);

        // Even trader blocked
        vm.prank(trader);
        vm.expectRevert(StrategyINFT.OnlyTradeAttestation.selector);
        strategy.recordEquityUpdate(tokenId, 900e6);
    }

    function test_only_pool_can_pull_collateral() public {
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);
        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        strategy.startEpoch(tokenId, 1_000e6, 2000, 7 days);
        vm.stopPrank();

        vm.expectRevert(StrategyINFT.OnlyInsurancePool.selector);
        strategy.pullCollateralForClaim(tokenId, 100e6);
    }

    function test_only_owner_can_set_wires() public {
        vm.prank(other);
        vm.expectRevert(StrategyINFT.OnlyOwner.selector);
        strategy.setTradeAttestation(address(0x1234));

        vm.prank(other);
        vm.expectRevert(StrategyINFT.OnlyOwner.selector);
        strategy.setInsurancePool(address(0x1234));
    }

    // ─────────────────────────── views ───────────────────────────

    function test_breach_threshold_math() public {
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);
        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        strategy.startEpoch(tokenId, 1_000e6, 2000, 7 days); // 20% drawdown
        vm.stopPrank();
        // threshold = 1000 * (10000 - 2000) / 10000 = 800
        assertEq(strategy.breachThreshold(tokenId), 800e6, "20% drawdown threshold");
    }

    function test_isInBreach_active_below_threshold() public {
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);
        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        strategy.startEpoch(tokenId, 1_000e6, 2000, 7 days);
        vm.stopPrank();

        assertFalse(strategy.isInBreach(tokenId), "not in breach at start");

        vm.prank(operator);
        attestation.recordTrade(tokenId, bytes32(0), bytes32(0), bytes32(0), -199e6, 801e6);
        assertFalse(strategy.isInBreach(tokenId), "above threshold = not breach");

        vm.prank(operator);
        attestation.recordTrade(tokenId, bytes32(0), bytes32(0), bytes32(0), -1e6, 800e6);
        assertTrue(strategy.isInBreach(tokenId), "exactly at threshold = breach (drawdown hit)");

        vm.prank(operator);
        attestation.recordTrade(tokenId, bytes32(0), bytes32(0), bytes32(0), -1e6, 799e6);
        assertTrue(strategy.isInBreach(tokenId), "below threshold = breach");
    }

    function test_revert_views_on_nonexistent_token() public {
        vm.expectRevert(StrategyINFT.NonexistentToken.selector);
        strategy.getData(999);

        vm.expectRevert(StrategyINFT.NonexistentToken.selector);
        strategy.breachThreshold(999);
    }
}
