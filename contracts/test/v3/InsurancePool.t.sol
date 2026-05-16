// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/v3/StrategyINFT.sol";
import "../../src/v3/InsurancePool.sol";
import "../../src/v3/TradeAttestation.sol";
import "../../src/legacy/tokens/MockUSDC.sol";

/// @title InsurancePool.t.sol — unit tests for LP deposit/withdraw + premium math
contract InsurancePoolTest is Test {
    MockUSDC usdc;
    StrategyINFT strategy;
    InsurancePool pool;

    address lp1 = address(0xC1);
    address lp2 = address(0xC2);
    address other = address(0xA2);

    function setUp() public {
        usdc = new MockUSDC();
        strategy = new StrategyINFT(address(usdc));
        pool = new InsurancePool(address(usdc), address(strategy));

        usdc.mint(lp1, 10_000e6);
        usdc.mint(lp2, 10_000e6);
    }

    function _deposit(address lp, uint256 amount) internal returns (uint256 shares) {
        vm.startPrank(lp);
        usdc.approve(address(pool), amount);
        shares = pool.deposit(amount);
        vm.stopPrank();
    }

    // ─────────────────────────── deposit / withdraw ───────────────────────────

    function test_first_deposit_mints_1to1_shares() public {
        uint256 shares = _deposit(lp1, 1_000e6);
        assertEq(shares, 1_000e6, "1:1 shares for first depositor");
        assertEq(pool.totalShares(), 1_000e6, "totalShares");
        assertEq(pool.totalAssets(), 1_000e6, "totalAssets");
        assertEq(pool.lpShares(lp1), 1_000e6, "lp1 share balance");
    }

    function test_second_deposit_pro_rata() public {
        _deposit(lp1, 1_000e6);
        uint256 shares2 = _deposit(lp2, 500e6);
        assertEq(shares2, 500e6, "1:1 because no yield yet");
        assertEq(pool.totalAssets(), 1_500e6, "totalAssets sums");
    }

    function test_withdraw_returns_pro_rata_assets() public {
        _deposit(lp1, 1_000e6);
        uint256 balBefore = usdc.balanceOf(lp1);

        vm.startPrank(lp1);
        uint256 assets = pool.withdraw(400e6);
        vm.stopPrank();

        assertEq(assets, 400e6, "1:1 since no yield");
        assertEq(usdc.balanceOf(lp1) - balBefore, 400e6, "received");
        assertEq(pool.lpShares(lp1), 600e6, "shares left");
        assertEq(pool.totalAssets(), 600e6, "totalAssets reduced");
    }

    function test_withdraw_after_yield_pays_pro_rata() public {
        _deposit(lp1, 1_000e6);
        _deposit(lp2, 1_000e6);

        // Simulate yield: poke totalAssets via direct USDC + rebook (use absorbResidual via prank from strategy)
        usdc.mint(address(pool), 200e6);
        vm.prank(address(strategy));
        pool.absorbResidual(200e6);

        // Total assets = 2200, total shares = 2000.
        // lp1 owns 1000 shares → 1100 USDC
        assertEq(pool.lpAssetValue(lp1), 1_100e6, "lp1 share value with yield");

        uint256 lp1Before = usdc.balanceOf(lp1);
        vm.startPrank(lp1);
        pool.withdraw(1_000e6); // burn all shares
        vm.stopPrank();
        assertEq(usdc.balanceOf(lp1) - lp1Before, 1_100e6, "lp1 yield realized");
    }

    function test_revert_withdraw_more_than_balance() public {
        _deposit(lp1, 100e6);
        vm.prank(lp1);
        vm.expectRevert(InsurancePool.NoSharesToWithdraw.selector);
        pool.withdraw(200e6);
    }

    function test_revert_zero_deposit() public {
        vm.startPrank(lp1);
        usdc.approve(address(pool), 100e6);
        vm.expectRevert(InsurancePool.InvalidAmount.selector);
        pool.deposit(0);
        vm.stopPrank();
    }

    function test_revert_zero_withdraw() public {
        vm.prank(lp1);
        vm.expectRevert(InsurancePool.InvalidAmount.selector);
        pool.withdraw(0);
    }

    // ─────────────────────────── premium math ───────────────────────────

    function test_premium_math_default_bps() public view {
        // default 12.5%
        assertEq(pool.premiumFor(800e6), (800e6 * 1250) / 10_000, "default premium");
        assertEq(pool.premiumFor(1_000e6), 125e6, "default 12.5% of 1000");
    }

    function test_setPremiumBps_changes_quote() public {
        pool.setPremiumBps(2000); // 20%
        assertEq(pool.premiumFor(1_000e6), 200e6, "new bps applied");
    }

    function test_revert_setPremiumBps_from_non_owner() public {
        vm.prank(other);
        vm.expectRevert(InsurancePool.OnlyOwner.selector);
        pool.setPremiumBps(2000);
    }

    function test_revert_setPremiumBps_above_cap() public {
        vm.expectRevert(); // require string, not custom error
        pool.setPremiumBps(5_001);
    }

    // ─────────────────────────── access control ───────────────────────────

    function test_revert_settleClaim_from_non_strategy() public {
        vm.expectRevert(InsurancePool.OnlyStrategyINFT.selector);
        pool.settleClaim(1);
    }

    function test_revert_expirePolicy_from_non_strategy() public {
        vm.expectRevert(InsurancePool.OnlyStrategyINFT.selector);
        pool.expirePolicy(1);
    }

    function test_revert_absorbResidual_from_non_strategy() public {
        vm.expectRevert(InsurancePool.OnlyStrategyINFT.selector);
        pool.absorbResidual(100);
    }

    function test_revert_buyPolicy_when_strategy_not_active() public {
        // mint a strategy but don't start an epoch
        uint256 tokenId = strategy.mint(other, StrategyINFT.Archetype.Bold, bytes32(uint256(1)), bytes32(uint256(2)));
        vm.startPrank(lp1);
        usdc.approve(address(pool), type(uint256).max);
        vm.expectRevert(InsurancePool.EpochNotActive.selector);
        pool.buyPolicy(tokenId, 100e6);
        vm.stopPrank();
    }
}

/// @title InsurancePoolV2Split — tests the v2 symmetric 60/40 split on expirePolicy
/// @notice On epoch success the trader gets 60% of each policy's premium, LPs keep 40%.
contract InsurancePoolV2SplitTest is Test {
    MockUSDC usdc;
    StrategyINFT strategy;
    InsurancePool pool;
    TradeAttestation attestation;

    address trader = address(0xA1);
    address allocator = address(0xB1);
    address lp = address(0xC1);
    address operator = address(0xD1);

    uint256 constant BOND = 1000e6;
    uint256 constant DRAWDOWN_BPS = 2000;
    uint256 constant EPOCH_DURATION = 7 days;
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
        usdc.mint(allocator, 10_000e6);
        usdc.mint(lp, 10_000e6);

        // LP seeds the pool
        vm.startPrank(lp);
        usdc.approve(address(pool), type(uint256).max);
        pool.deposit(5_000e6);
        vm.stopPrank();
    }

    function test_success_pays_trader_60_percent_premium() public {
        // mint strategy + start epoch
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);
        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        strategy.startEpoch(tokenId, BOND, DRAWDOWN_BPS, EPOCH_DURATION);
        vm.stopPrank();

        // Allocator buys a 500 USDC policy → premium = 12.5% * 500 = 62.5
        vm.startPrank(allocator);
        usdc.approve(address(pool), type(uint256).max);
        pool.buyPolicy(tokenId, 500e6);
        vm.stopPrank();

        uint256 premium = pool.premiumFor(500e6);
        uint256 expectedTraderShare = (premium * 6000) / 10_000;
        uint256 expectedLPKept = premium - expectedTraderShare;

        // Snapshot
        uint256 lpAssetsPre = pool.totalAssets();
        uint256 traderUsdcPre = usdc.balanceOf(trader);

        // Profit trade to keep promise — equity rises (no breach)
        vm.prank(operator);
        attestation.recordTrade(
            tokenId,
            bytes32(uint256(0x1)),
            bytes32(uint256(0x2)),
            bytes32(uint256(0x3)),
            int256(100e6),
            BOND + 100e6
        );

        // Fast-forward past epoch end and settle (success path)
        vm.warp(block.timestamp + EPOCH_DURATION + 1);
        strategy.settleEpoch(tokenId);

        // Trader gets bond back PLUS 60% of premium
        uint256 traderDelta = usdc.balanceOf(trader) - traderUsdcPre;
        assertEq(traderDelta, BOND + expectedTraderShare, "trader gets bond + 60% premium");

        // Pool totalAssets reduced by trader share (LP keeps 40%)
        assertEq(pool.totalAssets(), lpAssetsPre - expectedTraderShare, "LP retains 40% of premium");
        assertGt(expectedLPKept, 0, "LP kept share is positive");
    }

    function test_expirePolicy_emits_split_event() public {
        // mint strategy + start epoch
        uint256 tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);
        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        strategy.startEpoch(tokenId, BOND, DRAWDOWN_BPS, EPOCH_DURATION);
        vm.stopPrank();

        vm.startPrank(allocator);
        usdc.approve(address(pool), type(uint256).max);
        uint256 policyId = pool.buyPolicy(tokenId, 500e6);
        vm.stopPrank();

        uint256 premium = pool.premiumFor(500e6);
        uint256 expectedTraderShare = (premium * 6000) / 10_000;
        uint256 expectedLPKept = premium - expectedTraderShare;

        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        // Expect PolicyExpired(policyId, lpKept, traderShare)
        vm.expectEmit(true, false, false, true, address(pool));
        emit InsurancePool.PolicyExpired(policyId, expectedLPKept, expectedTraderShare);
        strategy.settleEpoch(tokenId);
    }
}
