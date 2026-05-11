// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ApprenticeINFT.sol";
import "../src/Codex.sol";
import "../src/ScryingDuel.sol";

/// @notice Deploy the Scrying Duel v2 stack to 0G Aristotle mainnet (16661).
///         Uses the REAL Pyth contract — no MockPyth.
///         Pyth on Aristotle: 0x2880aB155794e7179c9eE2e38200202908C17B43
///
///         Run only on Day 7 per HANDOFF.md, after Discord confirms whether
///         testnet deployment is acceptable for the submission requirement.
contract DeployAristotle is Script {
    address constant PYTH_ARISTOTLE = 0x2880aB155794e7179c9eE2e38200202908C17B43;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address treasury = vm.envOr("TREASURY", deployer);

        vm.startBroadcast(deployerKey);

        ApprenticeINFT inft = new ApprenticeINFT();
        Codex codex = new Codex(address(inft));
        ScryingDuel duel = new ScryingDuel(address(inft), address(codex), PYTH_ARISTOTLE, treasury);

        inft.setCodex(address(codex));
        codex.setDuelContract(address(duel));

        vm.stopBroadcast();

        console.log("=== Orichalcos Scrying Duel v2 - Aristotle Mainnet ===");
        console.log("Pyth (real)   :", PYTH_ARISTOTLE);
        console.log("ApprenticeINFT:", address(inft));
        console.log("Codex         :", address(codex));
        console.log("ScryingDuel   :", address(duel));
        console.log("Treasury      :", treasury);
        console.log("Deployer      :", deployer);
    }
}
