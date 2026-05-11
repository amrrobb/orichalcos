// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ScryingDuel.sol";
import "../src/MockPyth.sol";

/// @notice Smoke test PART 2 — runs after the 60s settle window has elapsed.
///         Bumps Pyth price up (so LONG wins), then settles the duel.
///         Hero called LONG → Hero wins → triggers championBeaten → Title goes
///         from Initiate to Apprentice (1 win < 3 → Initiate; the 25-wins-to-Master
///         path is unit-tested separately).
///
/// Env vars: SCRYING_DUEL, MOCK_PYTH, DUEL_ID
contract SmokeTestPart2 is Script {
    bytes32 constant BTC_USD_FEED = bytes32(uint256(1));

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        ScryingDuel duel = ScryingDuel(vm.envAddress("SCRYING_DUEL"));
        MockPyth pyth = MockPyth(vm.envAddress("MOCK_PYTH"));
        uint256 duelId = vm.envUint("DUEL_ID");

        vm.startBroadcast(deployerKey);

        // 1. Move BTC price up: $60,000 -> $60,500. Hero (LONG) wins.
        pyth.setPrice(BTC_USD_FEED, 60500_00000000, 1000, -8);

        // 2. Settle.
        duel.settle(duelId);

        vm.stopBroadcast();

        console.log("=== Smoke Test Part 2 complete ===");
        console.log("duelId   :", duelId);
        console.log("Final BTC: $60,500 (up from $60,000)");
        console.log("Hero (LONG) wins. Verify state via cast call.");
    }
}
