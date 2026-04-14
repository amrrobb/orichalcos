// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/tokens/MockWETH.sol";
import "../src/tokens/MockUSDC.sol";
import "../src/dex/OrichalcosPair.sol";
import "../src/OrichalcosVault.sol";
import "../src/OrichalcosINFT.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Agent address — same as deployer for hackathon demo
        address agent = deployer;

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy tokens
        MockWETH weth = new MockWETH();
        MockUSDC usdc = new MockUSDC();
        console.log("MockWETH:", address(weth));
        console.log("MockUSDC:", address(usdc));

        // 2. Deploy pair (token0 must be < token1)
        address token0 = address(weth) < address(usdc) ? address(weth) : address(usdc);
        address token1 = address(weth) < address(usdc) ? address(usdc) : address(weth);
        OrichalcosPair pair = new OrichalcosPair(token0, token1);
        console.log("OrichalcosPair:", address(pair));
        console.log("  token0:", token0);
        console.log("  token1:", token1);

        // 3. Seed liquidity: 100 WETH + 300,000 USDC
        uint256 wethAmount = 100 ether;
        uint256 usdcAmount = 300_000e6;

        if (token0 == address(weth)) {
            weth.approve(address(pair), wethAmount);
            usdc.approve(address(pair), usdcAmount);
            pair.addLiquidity(wethAmount, usdcAmount);
        } else {
            usdc.approve(address(pair), usdcAmount);
            weth.approve(address(pair), wethAmount);
            pair.addLiquidity(usdcAmount, wethAmount);
        }

        (uint112 r0, uint112 r1) = pair.getReserves();
        console.log("Pair reserves:", uint256(r0), uint256(r1));

        // 4. Deploy vault
        OrichalcosVault vault = new OrichalcosVault(address(pair), agent);
        console.log("OrichalcosVault:", address(vault));

        // 5. Deposit initial funds into vault for agent to trade
        // 10 WETH + 30,000 USDC
        weth.approve(address(vault), 10 ether);
        vault.deposit(address(weth), 10 ether);
        usdc.approve(address(vault), 30_000e6);
        vault.deposit(address(usdc), 30_000e6);
        console.log("Vault funded: 10 WETH + 30,000 USDC");

        // 6. Deploy INFT
        OrichalcosINFT inft = new OrichalcosINFT();
        console.log("OrichalcosINFT:", address(inft));

        vm.stopBroadcast();

        // Output summary
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Network: 0G Galileo Testnet (16602)");
        console.log("Deployer:", deployer);
        console.log("MockWETH:", address(weth));
        console.log("MockUSDC:", address(usdc));
        console.log("OrichalcosPair:", address(pair));
        console.log("OrichalcosVault:", address(vault));
        console.log("OrichalcosINFT:", address(inft));
        console.log("Agent:", agent);
    }
}
