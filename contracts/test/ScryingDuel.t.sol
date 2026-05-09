// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ApprenticeINFT.sol";
import "../src/Codex.sol";
import "../src/ScryingDuel.sol";
import "../src/MockPyth.sol";

contract ScryingDuelTest is Test {
    ApprenticeINFT inft;
    Codex codex;
    MockPyth pyth;
    ScryingDuel duel;

    address deployer = address(this);
    address treasury = address(0x7E45);
    address trainerA = address(0xA1);
    address trainerB = address(0xB2);

    bytes32 constant SOUL_ROOT = bytes32(uint256(0xABCDEF));
    bytes32 constant META_HASH = bytes32(uint256(0x123456));
    bytes32 constant BTC_USD = bytes32(uint256(1));
    bytes32 constant TELL_HASH_A = bytes32(uint256(0x111111));
    bytes32 constant TELL_HASH_B = bytes32(uint256(0x222222));
    bytes32 constant ATT_HASH_A = bytes32(uint256(0x333333));
    bytes32 constant ATT_HASH_B = bytes32(uint256(0x444444));

    uint256 tokenA;
    uint256 tokenB;

    function setUp() public {
        inft = new ApprenticeINFT();
        codex = new Codex(address(inft));
        pyth = new MockPyth();
        duel = new ScryingDuel(address(inft), address(codex), address(pyth), treasury);

        inft.setCodex(address(codex));
        codex.setDuelContract(address(duel));

        // Set initial Pyth price
        pyth.setPrice(BTC_USD, 60000_00000000, 1000, -8); // $60,000

        // Mint 2 Apprentices (tokenIds 0 and 1; we'll use these as challenger/defender)
        tokenA = inft.mint(trainerA, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);
        tokenB = inft.mint(trainerB, ApprenticeINFT.ApprenticeType.Patient, SOUL_ROOT, META_HASH);

        // Fund trainers
        vm.deal(trainerA, 10 ether);
        vm.deal(trainerB, 10 ether);
    }

    // ─────── Challenge ───────

    function test_Challenge() public {
        vm.prank(trainerA);
        uint256 duelId = duel.challenge{value: 1 ether}(tokenA, tokenB, BTC_USD, 60);
        assertEq(duelId, 1);

        ScryingDuel.Duel memory d = duel.getDuel(duelId);
        assertEq(d.challengerTokenId, tokenA);
        assertEq(d.defenderTokenId, tokenB);
        assertEq(d.priceFeedId, BTC_USD);
        assertEq(d.windowSeconds, 60);
        assertEq(d.stake, 1 ether);
        assertEq(uint8(d.status), uint8(ScryingDuel.DuelStatus.Open));
    }

    function test_ChallengeRevertsWindowTooShort() public {
        vm.prank(trainerA);
        vm.expectRevert(ScryingDuel.InvalidWindow.selector);
        duel.challenge{value: 1 ether}(tokenA, tokenB, BTC_USD, 30);
    }

    function test_ChallengeRevertsWindowTooLong() public {
        vm.prank(trainerA);
        vm.expectRevert(ScryingDuel.InvalidWindow.selector);
        duel.challenge{value: 1 ether}(tokenA, tokenB, BTC_USD, 200);
    }

    function test_ChallengeRevertsSameApprentice() public {
        vm.prank(trainerA);
        vm.expectRevert(ScryingDuel.SameApprentice.selector);
        duel.challenge{value: 1 ether}(tokenA, tokenA, BTC_USD, 60);
    }

    function test_ChallengeRevertsZeroStake() public {
        vm.prank(trainerA);
        vm.expectRevert(ScryingDuel.InvalidStake.selector);
        duel.challenge{value: 0}(tokenA, tokenB, BTC_USD, 60);
    }

    // ─────── Commit ───────

    function _openDuel() internal returns (uint256) {
        vm.prank(trainerA);
        return duel.challenge{value: 1 ether}(tokenA, tokenB, BTC_USD, 60);
    }

    function test_CommitFromBothMovesToCommitted() public {
        uint256 duelId = _openDuel();

        duel.commitDirection(duelId, tokenA, ScryingDuel.Direction.Long, TELL_HASH_A, ATT_HASH_A);
        assertEq(uint8(duel.getDuel(duelId).status), uint8(ScryingDuel.DuelStatus.Open));

        duel.commitDirection(duelId, tokenB, ScryingDuel.Direction.Short, TELL_HASH_B, ATT_HASH_B);
        ScryingDuel.Duel memory d = duel.getDuel(duelId);
        assertEq(uint8(d.status), uint8(ScryingDuel.DuelStatus.Committed));
        assertEq(d.priceAtCommit, 60000_00000000);
        assertGt(d.settleTimestamp, block.timestamp);
    }

    function test_CommitRevertsAlreadyCommitted() public {
        uint256 duelId = _openDuel();
        duel.commitDirection(duelId, tokenA, ScryingDuel.Direction.Long, TELL_HASH_A, ATT_HASH_A);
        vm.expectRevert(ScryingDuel.AlreadyCommitted.selector);
        duel.commitDirection(duelId, tokenA, ScryingDuel.Direction.Short, TELL_HASH_A, ATT_HASH_A);
    }

    function test_CommitRevertsWrongTokenId() public {
        uint256 duelId = _openDuel();
        // Mint a third Apprentice and try to commit on this duel — should fail
        uint256 stranger = inft.mint(trainerA, ApprenticeINFT.ApprenticeType.Sharp, SOUL_ROOT, META_HASH);
        vm.expectRevert(ScryingDuel.NotChallengerOrDefender.selector);
        duel.commitDirection(duelId, stranger, ScryingDuel.Direction.Long, TELL_HASH_A, ATT_HASH_A);
    }

    function test_CommitRevertsZeroTellHash() public {
        uint256 duelId = _openDuel();
        vm.expectRevert(ScryingDuel.InvalidTellHash.selector);
        duel.commitDirection(duelId, tokenA, ScryingDuel.Direction.Long, bytes32(0), ATT_HASH_A);
    }

    function test_CommitRevertsZeroAttestation() public {
        uint256 duelId = _openDuel();
        vm.expectRevert(ScryingDuel.InvalidAttestation.selector);
        duel.commitDirection(duelId, tokenA, ScryingDuel.Direction.Long, TELL_HASH_A, bytes32(0));
    }

    // ─────── Settle ───────

    function _commitBoth(uint256 duelId, ScryingDuel.Direction callA, ScryingDuel.Direction callB) internal {
        duel.commitDirection(duelId, tokenA, callA, TELL_HASH_A, ATT_HASH_A);
        duel.commitDirection(duelId, tokenB, callB, TELL_HASH_B, ATT_HASH_B);
    }

    function test_SettlePriceUpLongWins() public {
        uint256 duelId = _openDuel();
        _commitBoth(duelId, ScryingDuel.Direction.Long, ScryingDuel.Direction.Short);

        // Skip past settle window
        vm.warp(block.timestamp + 65);
        // Price moves up
        pyth.setPrice(BTC_USD, 60500_00000000, 1000, -8);

        uint256 trainerABefore = trainerA.balance;
        duel.settle(duelId);

        // trainerA (challenger) called LONG, price went up → trainerA wins
        ScryingDuel.Duel memory d = duel.getDuel(duelId);
        assertEq(uint8(d.status), uint8(ScryingDuel.DuelStatus.Settled));

        // 1 ether - 2.5% fee = 0.975 ether to winner
        assertEq(trainerA.balance, trainerABefore + 0.975 ether);
        assertEq(duel.protocolFees(), 0.025 ether);

        // Codex updated INFT
        assertEq(inft.getData(tokenA).wins, 1);
        assertEq(inft.getData(tokenB).losses, 1);
    }

    function test_SettlePriceDownShortWins() public {
        uint256 duelId = _openDuel();
        _commitBoth(duelId, ScryingDuel.Direction.Long, ScryingDuel.Direction.Short);

        vm.warp(block.timestamp + 65);
        pyth.setPrice(BTC_USD, 59500_00000000, 1000, -8);

        uint256 trainerBBefore = trainerB.balance;
        duel.settle(duelId);

        // trainerB (defender) called SHORT, price went down → trainerB wins
        assertEq(trainerB.balance, trainerBBefore + 0.975 ether);
        assertEq(inft.getData(tokenA).losses, 1);
        assertEq(inft.getData(tokenB).wins, 1);
    }

    function test_SettleRevertsBeforeWindow() public {
        uint256 duelId = _openDuel();
        _commitBoth(duelId, ScryingDuel.Direction.Long, ScryingDuel.Direction.Short);

        // Don't warp — window not ended
        vm.expectRevert(ScryingDuel.WindowNotEnded.selector);
        duel.settle(duelId);
    }

    function test_SettleRevertsBothNotCommitted() public {
        uint256 duelId = _openDuel();
        duel.commitDirection(duelId, tokenA, ScryingDuel.Direction.Long, TELL_HASH_A, ATT_HASH_A);
        vm.warp(block.timestamp + 200);
        vm.expectRevert(ScryingDuel.NotBothCommitted.selector);
        duel.settle(duelId);
    }

    function test_SettleTieBreakToChallenger() public {
        uint256 duelId = _openDuel();
        _commitBoth(duelId, ScryingDuel.Direction.Long, ScryingDuel.Direction.Long);

        vm.warp(block.timestamp + 65);
        // Price up — both LONG, but challenger wins per tie-break
        pyth.setPrice(BTC_USD, 60500_00000000, 1000, -8);
        duel.settle(duelId);

        assertEq(inft.getData(tokenA).wins, 1);
        assertEq(inft.getData(tokenB).losses, 1);
    }

    // ─────── Cancel ───────

    function test_CancelRefunds() public {
        uint256 duelId = _openDuel();
        uint256 trainerABefore = trainerA.balance;
        vm.prank(trainerA);
        duel.cancel(duelId);

        // Refund 1 ether
        assertEq(trainerA.balance, trainerABefore + 1 ether);
        assertEq(uint8(duel.getDuel(duelId).status), uint8(ScryingDuel.DuelStatus.Cancelled));
    }

    function test_CancelRevertsAfterCommit() public {
        uint256 duelId = _openDuel();
        duel.commitDirection(duelId, tokenA, ScryingDuel.Direction.Long, TELL_HASH_A, ATT_HASH_A);
        vm.prank(trainerA);
        vm.expectRevert(ScryingDuel.AlreadyCommitted.selector);
        duel.cancel(duelId);
    }

    // ─────── Protocol fees ───────

    function test_WithdrawFees() public {
        uint256 duelId = _openDuel();
        _commitBoth(duelId, ScryingDuel.Direction.Long, ScryingDuel.Direction.Short);
        vm.warp(block.timestamp + 65);
        pyth.setPrice(BTC_USD, 60500_00000000, 1000, -8);
        duel.settle(duelId);

        assertEq(duel.protocolFees(), 0.025 ether);
        uint256 treasuryBefore = treasury.balance;
        duel.withdrawFees();
        assertEq(treasury.balance, treasuryBefore + 0.025 ether);
        assertEq(duel.protocolFees(), 0);
    }
}
