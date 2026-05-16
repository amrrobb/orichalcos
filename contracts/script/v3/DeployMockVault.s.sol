// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../../src/v3/MockYieldVault.sol";
import "../../src/legacy/tokens/MockUSDC.sol";

/// @title DeployMockVault — adds MockYieldVault to the existing v3 stack on Galileo
/// @notice Deploys the demo-grade yield vault against the already-deployed MockUSDC,
///         mints 1M USDC to the deployer, and seeds the reserve.
///
/// @dev Run with:
///   MOCK_USDC=0x2F7296aebCBc5a8D67A65FA6BF09dD74c70bC60f \
///   PRIVATE_KEY=0x... forge script script/v3/DeployMockVault.s.sol \
///     --rpc-url https://evmrpc-testnet.0g.ai \
///     --broadcast \
///     --legacy
contract DeployMockVault is Script {
    uint256 constant SEED = 1_000_000e6; // 1M USDC reserve for simulated yield

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address usdcAddr = vm.envAddress("MOCK_USDC");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        MockYieldVault vault = new MockYieldVault(usdcAddr);
        console.log("MockYieldVault deployed:", address(vault));

        // Seed the simulated-yield reserve.
        MockUSDC usdc = MockUSDC(usdcAddr);
        usdc.mint(deployer, SEED);
        usdc.approve(address(vault), SEED);
        vault.seed(SEED);
        console.log("Seeded reserve with USDC:", SEED);

        vm.stopBroadcast();

        console.log("===== MOCK VAULT DEPLOYMENT =====");
        console.log("MockYieldVault:", address(vault));
        console.log("Reserve seeded:", SEED);
    }
}
