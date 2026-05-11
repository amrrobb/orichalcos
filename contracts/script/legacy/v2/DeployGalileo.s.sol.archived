// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ApprenticeINFT.sol";
import "../src/Codex.sol";
import "../src/ScryingDuel.sol";
import "../src/MockPyth.sol";

/// @notice Deploy the Scrying Duel v2 stack to 0G Galileo testnet (16602).
///         Uses MockPyth because Pyth is not on Galileo. Mainnet (Aristotle 16661)
///         uses DeployAristotle.s.sol with the real Pyth at
///         0x2880aB155794e7179c9eE2e38200202908C17B43.
contract DeployGalileo is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address treasury = vm.envOr("TREASURY", deployer);

        vm.startBroadcast(deployerKey);

        MockPyth pyth = new MockPyth();
        ApprenticeINFT inft = new ApprenticeINFT();
        Codex codex = new Codex(address(inft));
        ScryingDuel duel = new ScryingDuel(address(inft), address(codex), address(pyth), treasury);

        // Wire up
        inft.setCodex(address(codex));
        codex.setDuelContract(address(duel));

        // Seed Pyth with a sane initial BTC/USD price for the demo
        bytes32 BTC_USD = bytes32(uint256(1));
        pyth.setPrice(BTC_USD, 60000_00000000, 1000, -8);

        vm.stopBroadcast();

        console.log("=== Orichalcos Scrying Duel v2 - Galileo Testnet ===");
        console.log("MockPyth      :", address(pyth));
        console.log("ApprenticeINFT:", address(inft));
        console.log("Codex         :", address(codex));
        console.log("ScryingDuel   :", address(duel));
        console.log("Treasury      :", treasury);
        console.log("Deployer      :", deployer);
    }
}
