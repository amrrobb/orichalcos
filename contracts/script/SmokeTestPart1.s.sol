// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ApprenticeINFT.sol";
import "../src/Codex.sol";
import "../src/ScryingDuel.sol";
import "../src/MockPyth.sol";

/// @notice Smoke test PART 1 — runs against live Galileo deployment.
///         Mints a genesis burner + hero + Champion, registers the Champion,
///         opens a duel, commits both sides. Stops before settle so the
///         shell can wait the 60s window then run Part 2.
///
/// Reads addresses from env vars:
///   APPRENTICE_INFT, CODEX, SCRYING_DUEL, MOCK_PYTH
contract SmokeTestPart1 is Script {
    bytes32 constant BTC_USD_FEED = bytes32(uint256(1)); // MockPyth-only test feed
    bytes32 constant SOUL_ROOT_HERO  = bytes32(uint256(0xAAA111));
    bytes32 constant SOUL_ROOT_CHAMP = bytes32(uint256(0xCCC222));
    bytes32 constant META_HASH       = bytes32(uint256(0x123456));

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        ApprenticeINFT inft = ApprenticeINFT(vm.envAddress("APPRENTICE_INFT"));
        Codex codex = Codex(vm.envAddress("CODEX"));
        ScryingDuel duel = ScryingDuel(vm.envAddress("SCRYING_DUEL"));
        MockPyth pyth = MockPyth(vm.envAddress("MOCK_PYTH"));

        vm.startBroadcast(deployerKey);

        // 1. Mint genesis burner (tokenId 0 — reserved per Codex docs)
        uint256 burnerId = inft.mint(
            deployer,
            ApprenticeINFT.ApprenticeType.Stoic,
            bytes32(uint256(0xDEAD)),
            META_HASH
        );

        // 2. Mint hero (tokenId 1) — Bold archetype, owned by deployer
        uint256 heroId = inft.mint(
            deployer,
            ApprenticeINFT.ApprenticeType.Bold,
            SOUL_ROOT_HERO,
            META_HASH
        );

        // 3. Mint Bold Champion (tokenId 2) — also owned by deployer for the smoke test
        uint256 champId = inft.mint(
            deployer,
            ApprenticeINFT.ApprenticeType.Bold,
            SOUL_ROOT_CHAMP,
            META_HASH
        );

        // 4. Register Champion in Codex
        codex.registerChampion(ApprenticeINFT.ApprenticeType.Bold, champId);

        // 5. Refresh Pyth price (publishTime must be recent)
        pyth.setPrice(BTC_USD_FEED, 60000_00000000, 1000, -8);

        // 6. Open the duel: hero (challenger) vs Champion (defender)
        uint256 duelId = duel.challenge{value: 0.001 ether}(
            heroId, champId, BTC_USD_FEED, 60
        );

        // 7. Commit both sides. Both use a non-zero tellHash + attestationHash
        //    (mocked for the smoke test — agent runner produces real ones in Day 4).
        bytes32 heroTellHash  = keccak256(abi.encode("smoke-hero-tell", duelId));
        bytes32 heroAttHash   = keccak256(abi.encode("smoke-hero-att",  duelId));
        bytes32 champTellHash = keccak256(abi.encode("smoke-champ-tell", duelId));
        bytes32 champAttHash  = keccak256(abi.encode("smoke-champ-att",  duelId));

        duel.commitDirection(
            duelId, heroId, ScryingDuel.Direction.Long,  heroTellHash,  heroAttHash
        );
        duel.commitDirection(
            duelId, champId, ScryingDuel.Direction.Short, champTellHash, champAttHash
        );

        vm.stopBroadcast();

        console.log("=== Smoke Test Part 1 complete ===");
        console.log("burnerId :", burnerId);
        console.log("heroId   :", heroId);
        console.log("champId  :", champId);
        console.log("duelId   :", duelId);
        console.log("Pyth feed price set to: $60,000");
        console.log("Hero called LONG, Champion called SHORT");
        console.log("Now wait the settle window (>= 60s), then run SmokeTestPart2");
    }
}
