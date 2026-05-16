// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/v3/MockYieldVault.sol";
import "../../src/legacy/tokens/MockUSDC.sol";

/// @title MockYieldVault.t.sol — unit tests for the demo-grade yield wrapper
contract MockYieldVaultTest is Test {
    MockUSDC usdc;
    MockYieldVault vault;

    address seeder = address(0xBEE);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    uint256 constant SEED_AMOUNT = 1_000_000e6; // 1M USDC reserve

    function setUp() public {
        usdc = new MockUSDC();
        vault = new MockYieldVault(address(usdc));

        usdc.mint(seeder, SEED_AMOUNT);
        usdc.mint(alice, 10_000e6);
        usdc.mint(bob, 10_000e6);

        vm.startPrank(seeder);
        usdc.approve(address(vault), SEED_AMOUNT);
        vault.seed(SEED_AMOUNT);
        vm.stopPrank();
    }

    function _deposit(address user, uint256 amount) internal {
        vm.startPrank(user);
        usdc.approve(address(vault), amount);
        vault.deposit(amount);
        vm.stopPrank();
    }

    function test_deposit_thenWithdraw_returnsPrincipalPlusYield() public {
        uint256 principal = 1_000e6;
        _deposit(alice, principal);

        // Warp 30 days
        skip(30 days);

        // Expected yield: 1000 * 800 * 30 / (10000 * 365) ≈ 6.575342 USDC
        uint256 expected = (principal * 800 * 30 days) / (10_000 * 365 days);
        assertEq(vault.previewYield(alice), expected, "preview matches formula");

        uint256 beforeBal = usdc.balanceOf(alice);
        // Withdraw "everything" — after _accrue inside withdraw, balances will be
        // principal+expected. Pass that exact amount.
        vm.prank(alice);
        vault.withdraw(principal + expected);
        uint256 afterBal = usdc.balanceOf(alice);

        assertGt(afterBal - beforeBal, principal, "withdraw returned more than principal");
        assertEq(afterBal - beforeBal, principal + expected, "withdraw matches principal + yield");
    }

    function test_yield_isProportionalToTime() public {
        uint256 amount = 1_000e6;
        _deposit(alice, amount);
        _deposit(bob, amount);

        // Both have same deposit, same timestamp. Warp 15 days; bob harvests
        // (re-accrues clock). Then warp 15 more days. Alice waited 30, bob 15.
        skip(15 days);

        // Bob touches his balance by depositing 1 wei (forces _accrue)
        vm.startPrank(bob);
        usdc.approve(address(vault), 1);
        vault.deposit(1);
        vm.stopPrank();

        skip(15 days);

        uint256 aliceYield = vault.previewYield(alice);
        uint256 bobYield = vault.previewYield(bob);

        // Alice has compounded once over 30 days; bob has accrued 15d once + 15d again
        // We just want approximate 2x relationship.
        // Compounding distortion is tiny for these values — allow 1% slop.
        assertGt(aliceYield, bobYield, "alice (30d uninterrupted) > bob (15d)");
        uint256 ratio = (aliceYield * 100) / bobYield;
        assertGe(ratio, 190, "alice yield ~2x bob (lower)");
        assertLe(ratio, 210, "alice yield ~2x bob (upper)");
    }

    function test_reserve_depletes_thenYieldStops() public {
        // Deposit a huge principal so the 8% APR over a long time exhausts the reserve.
        uint256 huge = 10_000_000_000e6; // 10B USDC
        usdc.mint(alice, huge);
        _deposit(alice, huge);

        // Warp far enough to exhaust the 1M reserve.
        // Yield rate: 10B * 0.08 / year = 800M / year, so >~1.25 days exhausts 1M.
        skip(365 days);

        // previewYield is capped at remaining reserve
        assertEq(vault.previewYield(alice), SEED_AMOUNT, "preview capped at full reserve");

        // First withdraw drains principal + all reserve as yield
        // (cache balances first — vm.prank only sticks for next external call)
        uint256 aliceShares = vault.balances(alice);
        vm.prank(alice);
        vault.withdraw(aliceShares);
        // Reserve should be 0 (or nearly so — accrual capped at reserve)
        assertEq(vault.reserve(), 0, "reserve depleted");

        // Second user deposits & waits — should get principal back only
        uint256 amt = 1_000e6;
        _deposit(bob, amt);
        skip(30 days);

        assertEq(vault.previewYield(bob), 0, "no yield once reserve is empty");

        uint256 beforeBob = usdc.balanceOf(bob);
        uint256 bobShares = vault.balances(bob);
        vm.prank(bob);
        vault.withdraw(bobShares);
        assertEq(usdc.balanceOf(bob) - beforeBob, amt, "bob got principal only");
    }
}
