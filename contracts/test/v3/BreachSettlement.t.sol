// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/v3/StrategyINFT.sol";
import "../../src/v3/InsurancePool.sol";
import "../../src/v3/TradeAttestation.sol";
import "../../src/legacy/tokens/MockUSDC.sol";

/// @title BreachSettlement.t.sol — demo-critical scenario test
/// @notice This is the test that protects the moment judges actually watch:
///         strategy bonds → allocators buy policies → bad trades drop equity →
///         markBreach → settleEpoch → allocators paid, residual to LPs, trader gets zero.
///         If this test passes the demo is durable. If it fails the demo lies.
contract BreachSettlementTest is Test {
    MockUSDC usdc;
    StrategyINFT strategy;
    InsurancePool pool;
    TradeAttestation attestation;

    address deployer = address(this);
    address trader = address(0xA1);
    address allocatorA = address(0xB1);
    address allocatorB = address(0xB2);
    address lp = address(0xC1);
    address operator = address(0xD1);

    uint256 constant BOND = 1000e6;            // 1000 USDC
    uint256 constant DRAWDOWN_BPS = 2000;      // 20%
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

        // Fund actors
        usdc.mint(trader, 10_000e6);
        usdc.mint(allocatorA, 10_000e6);
        usdc.mint(allocatorB, 10_000e6);
        usdc.mint(lp, 10_000e6);

        // LP seeds the pool so settle has somewhere to land
        vm.startPrank(lp);
        usdc.approve(address(pool), type(uint256).max);
        pool.deposit(5_000e6);
        vm.stopPrank();
    }

    // ─────────────────────────── helpers ───────────────────────────

    function _mintAndStart() internal returns (uint256 tokenId, uint256 epochId) {
        tokenId = strategy.mint(trader, StrategyINFT.Archetype.Bold, SEALED_SOUL, METADATA);
        vm.startPrank(trader);
        usdc.approve(address(strategy), type(uint256).max);
        epochId = strategy.startEpoch(tokenId, BOND, DRAWDOWN_BPS, EPOCH_DURATION);
        vm.stopPrank();
    }

    function _buyPolicy(address allocator, uint256 tokenId, uint256 maxClaim) internal returns (uint256 policyId) {
        vm.startPrank(allocator);
        usdc.approve(address(pool), type(uint256).max);
        policyId = pool.buyPolicy(tokenId, maxClaim);
        vm.stopPrank();
    }

    function _attestTrade(uint256 tokenId, int256 pnlDelta, uint256 equityAfter) internal {
        vm.prank(operator);
        attestation.recordTrade(
            tokenId,
            bytes32(uint256(0x1)),
            bytes32(uint256(0x2)),
            bytes32(uint256(0x3)),
            pnlDelta,
            equityAfter
        );
    }

    // ─────────────────────────── THE demo-critical test ───────────────────────────

    /// @notice Full breach scenario with 2 allocators, both fully covered.
    ///         BOND=1000, drawdown=20% → threshold=800
    ///         Allocator A: maxClaim=500
    ///         Allocator B: maxClaim=300
    ///         Equity drops to 750 → breach
    ///         Expected: A gets 500, B gets 300, residual=200 → LPs, trader=0
    function test_breach_two_allocators_full_coverage() public {
        (uint256 tokenId, uint256 epochId) = _mintAndStart();

        uint256 polA = _buyPolicy(allocatorA, tokenId, 500e6);
        uint256 polB = _buyPolicy(allocatorB, tokenId, 300e6);

        // Sanity: coverage is 800, bond is 1000, threshold is 800
        assertEq(strategy.breachThreshold(tokenId), 800e6, "threshold");

        // Bad trade — equity drops to 750 (breach: 750 <= 800)
        _attestTrade(tokenId, -250e6, 750e6);

        assertTrue(strategy.isInBreach(tokenId), "should be in breach");

        // Snapshot pre-settle balances
        uint256 lpAssetsPre = pool.totalAssets();
        uint256 traderUsdcPre = usdc.balanceOf(trader);
        uint256 allocAUsdcPre = usdc.balanceOf(allocatorA);
        uint256 allocBUsdcPre = usdc.balanceOf(allocatorB);

        // Mark breach (anyone) and settle (anyone)
        strategy.markBreach(tokenId);
        strategy.settleEpoch(tokenId);

        // Allocators paid full claim
        assertEq(usdc.balanceOf(allocatorA) - allocAUsdcPre, 500e6, "alloc A claim");
        assertEq(usdc.balanceOf(allocatorB) - allocBUsdcPre, 300e6, "alloc B claim");

        // Trader got nothing on breach (bond fully at risk)
        assertEq(usdc.balanceOf(trader), traderUsdcPre, "trader gets zero on breach");

        // Premiums were booked at buyPolicy (already in lpAssetsPre snapshot).
        // The settle delta is just the residual: bond=1000 - claims=800 = 200.
        assertEq(pool.totalAssets() - lpAssetsPre, 200e6, "pool absorbed residual at settle");

        // Strategy returns to Idle for re-bond
        StrategyINFT.StrategyData memory d = strategy.getData(tokenId);
        assertEq(uint8(d.status), uint8(StrategyINFT.EpochStatus.Idle), "strategy idle after settle");
        assertEq(d.currentEpochId, 0, "epoch reset");
        assertEq(d.bondAmount, 0, "bond drained");

        // Policy statuses
        assertEq(uint8(pool.getPolicy(polA).status), uint8(InsurancePool.PolicyStatus.Claimed), "A claimed");
        assertEq(uint8(pool.getPolicy(polB).status), uint8(InsurancePool.PolicyStatus.Claimed), "B claimed");

        // Epoch ID was returned by startEpoch (used here just to silence unused warning)
        epochId;
    }

    /// @notice Success path (v2 symmetric): epoch ends without breach.
    ///         Trader gets full bond back PLUS 60% of each policy's premium.
    ///         LPs keep 40% of premium as yield.
    function test_success_epoch_expiry_returns_bond_to_trader() public {
        (uint256 tokenId, ) = _mintAndStart();

        _buyPolicy(allocatorA, tokenId, 400e6);

        // Trades trend up: equity hits 1100, never breaches
        _attestTrade(tokenId, 100e6, 1100e6);

        uint256 premium = pool.premiumFor(400e6);
        uint256 traderShare = (premium * 6000) / 10_000; // 60%
        uint256 lpKept = premium - traderShare;          // 40%

        uint256 traderUsdcPre = usdc.balanceOf(trader);
        uint256 lpAssetsPre = pool.totalAssets();

        // Fast-forward past epoch end
        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        strategy.settleEpoch(tokenId);

        // Trader gets bond + 60% of premium
        assertEq(
            usdc.balanceOf(trader) - traderUsdcPre,
            BOND + traderShare,
            "trader gets bond + 60% premium on success"
        );

        // Pool retains 40% of premium (lpAssetsPre included the full premium → after
        // settle, totalAssets is reduced by traderShare, leaving lpKept retained)
        assertEq(pool.totalAssets(), lpAssetsPre - traderShare, "pool keeps 40% of premium");
        assertGt(lpKept, 0, "LP kept share is positive");

        // Strategy idle
        assertEq(uint8(strategy.getData(tokenId).status), uint8(StrategyINFT.EpochStatus.Idle), "idle");
    }

    /// @notice Breach where claims exceed remaining bond — second allocator gets partial.
    ///         BOND=1000, two policies maxClaim=600 each (total coverage=1200 > bond — but
    ///         buyPolicy enforces sum <= bond, so this scenario can't be set up directly).
    ///         Instead: claims sum < bond but bond drains during pool pulls. With bond=1000
    ///         and total maxClaim=900, A pulls 500 (bond=500), B pulls 400 (bond=100).
    ///         Wait — pool pulls min(maxClaim, remainingBond) so this works fine. Test the
    ///         edge case where second policy's pull is capped by what bond has left.
    function test_breach_claims_drain_bond_in_order() public {
        (uint256 tokenId, ) = _mintAndStart();

        // BOND=1000, drawdown=20% → threshold=800
        // Two policies summing to 900 (under bond)
        _buyPolicy(allocatorA, tokenId, 500e6);
        _buyPolicy(allocatorB, tokenId, 400e6);

        // Drop equity to 700 (breach)
        _attestTrade(tokenId, -300e6, 700e6);

        strategy.markBreach(tokenId);
        strategy.settleEpoch(tokenId);

        // A paid first, full 500. B paid 400. Residual=100 to LPs.
        assertEq(usdc.balanceOf(allocatorA), 10_000e6 - 62_500_000 + 500e6, "A full claim minus premium");
        // 62_500_000 = 500e6 * 1250 / 10000 = 62.5 USDC
        assertEq(usdc.balanceOf(allocatorB), 10_000e6 - 50_000_000 + 400e6, "B full claim minus premium");
        // 50_000_000 = 400e6 * 1250 / 10000 = 50 USDC
    }

    /// @notice Self-insurance is blocked: strategy owner cannot buy policy on their own strategy.
    function test_revert_when_trader_buys_own_policy() public {
        (uint256 tokenId, ) = _mintAndStart();

        vm.startPrank(trader);
        usdc.approve(address(pool), type(uint256).max);
        vm.expectRevert(InsurancePool.AllocatorIsTrader.selector);
        pool.buyPolicy(tokenId, 500e6);
        vm.stopPrank();
    }

    /// @notice Coverage cap: cannot buy a policy that would push total coverage past bond.
    function test_revert_when_coverage_exceeds_bond() public {
        (uint256 tokenId, ) = _mintAndStart();

        // BOND=1000. First policy takes 800.
        _buyPolicy(allocatorA, tokenId, 800e6);

        // Second policy of 300 would push coverage to 1100 > 1000 bond.
        vm.startPrank(allocatorB);
        usdc.approve(address(pool), type(uint256).max);
        vm.expectRevert(InsurancePool.CoverageExceedsBond.selector);
        pool.buyPolicy(tokenId, 300e6);
        vm.stopPrank();
    }

    /// @notice markBreach reverts when equity is still above threshold.
    function test_revert_markBreach_when_above_threshold() public {
        (uint256 tokenId, ) = _mintAndStart();

        // Equity drops to 850 — under starting bond but above threshold (800)
        _attestTrade(tokenId, -150e6, 850e6);

        vm.expectRevert(StrategyINFT.NotInBreachState.selector);
        strategy.markBreach(tokenId);
    }

    /// @notice settleEpoch on success path auto-settles even if markBreach was never called.
    ///         If we expire below threshold, settle should auto-promote to Breached.
    function test_settle_auto_promotes_to_breach_on_expiry_below_threshold() public {
        (uint256 tokenId, ) = _mintAndStart();

        _buyPolicy(allocatorA, tokenId, 500e6);

        // Drop to 750 (breach), but DON'T call markBreach
        _attestTrade(tokenId, -250e6, 750e6);

        // Fast forward past epoch end
        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        // Settle should detect breach via threshold check and route as breach
        strategy.settleEpoch(tokenId);

        // Allocator was paid (proves breach path was taken)
        assertEq(
            usdc.balanceOf(allocatorA),
            10_000e6 - 62_500_000 + 500e6,
            "auto-promoted to breach, allocator paid"
        );
    }

    /// @notice Breach with ZERO policies: residual still sweeps to LPs, trader still gets zero.
    ///         This is the "deserved to lose your bond even though nobody insured you" case.
    function test_breach_with_no_policies_still_slashes_trader() public {
        (uint256 tokenId, ) = _mintAndStart();

        // No buyPolicy calls. Drop equity to 700 (breach).
        _attestTrade(tokenId, -300e6, 700e6);

        uint256 traderUsdcPre = usdc.balanceOf(trader);
        uint256 lpAssetsPre = pool.totalAssets();

        strategy.markBreach(tokenId);
        strategy.settleEpoch(tokenId);

        // Trader gets nothing — full bond slashed even with no policies
        assertEq(usdc.balanceOf(trader), traderUsdcPre, "trader zero on breach (no policies)");

        // Full bond residual went to pool LPs
        assertEq(pool.totalAssets() - lpAssetsPre, BOND, "full bond swept to LPs");
    }

    /// @notice Re-bond after settle: trader can open a fresh epoch on the same token.
    function test_can_rebond_after_settle() public {
        (uint256 tokenId, ) = _mintAndStart();

        // Skip to expiry, settle clean
        vm.warp(block.timestamp + EPOCH_DURATION + 1);
        strategy.settleEpoch(tokenId);

        // Re-bond
        vm.startPrank(trader);
        uint256 newEpoch = strategy.startEpoch(tokenId, 500e6, 1500, 3 days);
        vm.stopPrank();

        StrategyINFT.StrategyData memory d = strategy.getData(tokenId);
        assertEq(d.currentEpochId, newEpoch, "new epoch active");
        assertEq(d.bondAmount, 500e6, "new bond locked");
        assertEq(d.startingBond, 500e6, "starting bond snapshot");
        assertEq(uint8(d.status), uint8(StrategyINFT.EpochStatus.Active), "active");
    }
}
