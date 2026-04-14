// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/tokens/MockWETH.sol";
import "../src/tokens/MockUSDC.sol";
import "../src/dex/OrichalcosPair.sol";
import "../src/OrichalcosVault.sol";
import "../src/OrichalcosINFT.sol";

contract OrichalcosTest is Test {
    MockWETH weth;
    MockUSDC usdc;
    OrichalcosPair pair;
    OrichalcosVault vault;
    OrichalcosINFT inft;

    address owner = address(this);
    address agent = address(0xA6E47);
    address user = address(0xBEEF);

    function setUp() public {
        // Deploy tokens
        weth = new MockWETH();
        usdc = new MockUSDC();

        // Ensure token0 < token1 (standard ordering)
        address t0 = address(weth) < address(usdc) ? address(weth) : address(usdc);
        address t1 = address(weth) < address(usdc) ? address(usdc) : address(weth);

        // Deploy pair
        pair = new OrichalcosPair(t0, t1);

        // Deploy vault
        vault = new OrichalcosVault(address(pair), agent);

        // Deploy INFT
        inft = new OrichalcosINFT();

        // Seed liquidity: 100 WETH + 300,000 USDC
        if (t0 == address(weth)) {
            weth.approve(address(pair), 100 ether);
            usdc.approve(address(pair), 300_000e6);
            pair.addLiquidity(100 ether, 300_000e6);
        } else {
            usdc.approve(address(pair), 300_000e6);
            weth.approve(address(pair), 100 ether);
            pair.addLiquidity(300_000e6, 100 ether);
        }
    }

    // ============ DEX Tests ============

    function test_PairHasReserves() public view {
        (uint112 r0, uint112 r1) = pair.getReserves();
        assertGt(r0, 0, "Reserve0 should be > 0");
        assertGt(r1, 0, "Reserve1 should be > 0");
    }

    function test_SwapWethForUsdc() public {
        uint256 swapAmount = 1 ether;
        weth.approve(address(pair), swapAmount);

        uint256 expectedOut = pair.getAmountOut(address(weth), swapAmount);
        assertGt(expectedOut, 0, "Expected output should be > 0");

        uint256 usdcBefore = usdc.balanceOf(owner);
        pair.swap(address(weth), swapAmount, 0, owner);
        uint256 usdcAfter = usdc.balanceOf(owner);

        assertEq(usdcAfter - usdcBefore, expectedOut, "USDC received should match expected");
    }

    function test_SwapZeroReverts() public {
        vm.expectRevert("Zero input");
        pair.swap(address(weth), 0, 0, owner);
    }

    function test_SwapInvalidTokenReverts() public {
        vm.expectRevert("Invalid token");
        pair.swap(address(0xDEAD), 1 ether, 0, owner);
    }

    // ============ Vault Tests ============

    function test_Deposit() public {
        uint256 depositAmount = 10 ether;
        weth.approve(address(vault), depositAmount);
        vault.deposit(address(weth), depositAmount);

        assertEq(vault.getBalance(address(weth)), depositAmount, "Vault WETH balance should match deposit");
    }

    function test_DepositInvalidTokenReverts() public {
        vm.expectRevert("Invalid token");
        vault.deposit(address(0xDEAD), 1 ether);
    }

    function test_WithdrawOnlyOwner() public {
        // Deposit first
        weth.approve(address(vault), 10 ether);
        vault.deposit(address(weth), 10 ether);

        // Non-owner can't withdraw
        vm.prank(user);
        vm.expectRevert("Only owner");
        vault.withdraw(address(weth), 5 ether);

        // Owner can withdraw
        vault.withdraw(address(weth), 5 ether);
        assertEq(vault.getBalance(address(weth)), 5 ether);
    }

    function test_ExecuteTradeOnlyAgent() public {
        // Deposit WETH into vault
        weth.approve(address(vault), 10 ether);
        vault.deposit(address(weth), 10 ether);

        // Non-agent can't trade
        vm.prank(user);
        vm.expectRevert("Only agent");
        vault.executeTrade(address(weth), 1 ether, 0);

        // Agent can trade
        vm.prank(agent);
        (bytes32 tradeId, uint256 amountOut) = vault.executeTrade(address(weth), 1 ether, 0);

        assertGt(amountOut, 0, "Trade should produce output");
        assertTrue(tradeId != bytes32(0), "TradeId should be non-zero");
        assertEq(vault.getTradeCount(), 1, "Should have 1 trade");
    }

    function test_ExecuteTradeInsufficientBalance() public {
        // No deposit — vault has 0 WETH
        vm.prank(agent);
        vm.expectRevert(); // ERC20 insufficient balance
        vault.executeTrade(address(weth), 1 ether, 0);
    }

    function test_RegisterAttestation() public {
        // Deposit and trade
        weth.approve(address(vault), 10 ether);
        vault.deposit(address(weth), 10 ether);

        vm.prank(agent);
        (bytes32 tradeId,) = vault.executeTrade(address(weth), 1 ether, 0);

        // Register attestation
        bytes32 attestationRoot = keccak256("test-attestation");
        vm.prank(agent);
        vault.registerAttestation(tradeId, attestationRoot);

        assertEq(vault.tradeAttestations(tradeId), attestationRoot, "Attestation should be registered");

        // Trade record should also have the attestation
        OrichalcosVault.Trade memory trade = vault.getTrade(0);
        assertEq(trade.attestationRoot, attestationRoot, "Trade record should have attestation");
    }

    function test_FullTradeFlow() public {
        // Deposit
        weth.approve(address(vault), 10 ether);
        vault.deposit(address(weth), 10 ether);

        // Agent executes 3 trades
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(agent);
            (bytes32 tradeId, uint256 amountOut) = vault.executeTrade(address(weth), 1 ether, 0);
            assertGt(amountOut, 0);

            // Register attestation
            bytes32 attestationRoot = keccak256(abi.encodePacked("attestation-", i));
            vm.prank(agent);
            vault.registerAttestation(tradeId, attestationRoot);
        }

        assertEq(vault.getTradeCount(), 3, "Should have 3 trades");

        // Verify each trade has an attestation
        for (uint256 i = 0; i < 3; i++) {
            OrichalcosVault.Trade memory trade = vault.getTrade(i);
            assertTrue(trade.attestationRoot != bytes32(0), "Each trade should have attestation");
        }
    }

    function test_SetAgent() public {
        address newAgent = address(0x1234);
        vault.setAgent(newAgent);
        assertEq(vault.agent(), newAgent);

        // Old agent can't trade
        vm.prank(agent);
        vm.expectRevert("Only agent");
        vault.executeTrade(address(weth), 1 ether, 0);
    }

    // ============ INFT Tests ============

    function test_MintINFT() public {
        bytes32[] memory hashes = new bytes32[](2);
        hashes[0] = keccak256("strategy_config");
        hashes[1] = keccak256("performance_log");

        string[] memory descriptions = new string[](2);
        descriptions[0] = "strategy_config";
        descriptions[1] = "performance_log";

        uint256 tokenId = inft.mint(user, hashes, descriptions);
        assertEq(tokenId, 0);
        assertEq(inft.ownerOf(0), user);

        OrichalcosINFT.IntelligentData[] memory data = inft.intelligentDataOf(0);
        assertEq(data.length, 2);
        assertEq(data[0].dataHash, hashes[0]);
        assertEq(keccak256(bytes(data[0].dataDescription)), keccak256(bytes("strategy_config")));
    }

    function test_UpdateINFTData() public {
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = keccak256("v1");
        string[] memory descriptions = new string[](1);
        descriptions[0] = "data";

        inft.mint(user, hashes, descriptions);

        // Update as owner (user)
        bytes32[] memory newHashes = new bytes32[](1);
        newHashes[0] = keccak256("v2");
        vm.prank(user);
        inft.updateData(0, newHashes);

        assertEq(inft.dataHashesOf(0)[0], newHashes[0]);
    }

    function test_UpdateINFTOnlyOwner() public {
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = keccak256("v1");
        string[] memory descriptions = new string[](1);
        descriptions[0] = "data";

        inft.mint(user, hashes, descriptions);

        bytes32[] memory newHashes = new bytes32[](1);
        newHashes[0] = keccak256("v2");

        // Non-owner (agent) can't update
        vm.prank(agent);
        vm.expectRevert("Not owner");
        inft.updateData(0, newHashes);
    }

    function test_MintEmptyData() public {
        bytes32[] memory hashes = new bytes32[](0);
        string[] memory descriptions = new string[](0);
        uint256 tokenId = inft.mint(user, hashes, descriptions);

        OrichalcosINFT.IntelligentData[] memory data = inft.intelligentDataOf(tokenId);
        assertEq(data.length, 0);
    }
}
