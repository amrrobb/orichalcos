// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ApprenticeINFT.sol";
import "../src/Codex.sol";

contract CodexTest is Test {
    ApprenticeINFT inft;
    Codex codex;

    address deployer = address(this);
    address duelContract = address(0xD0E1);
    address trainer = address(0xBEEF);
    address other = address(0xCAFE);

    bytes32 constant SOUL_ROOT = bytes32(uint256(0xABCDEF));
    bytes32 constant META_HASH = bytes32(uint256(0x123456));

    function setUp() public {
        inft = new ApprenticeINFT();
        codex = new Codex(address(inft));
        inft.setCodex(address(codex));
        codex.setDuelContract(duelContract);
    }

    function _mintApprentice(ApprenticeINFT.ApprenticeType t) internal returns (uint256) {
        return inft.mint(trainer, t, SOUL_ROOT, META_HASH);
    }

    // ─────── ELO math ───────

    function test_EvenMatch_WinnerGains16_LoserLoses16() public view {
        // Even match (1200 vs 1200): expected = 0.5, K=32 → ±16
        (uint16 wNew, uint16 lNew) = codex.previewEloChange(1200, 1200);
        assertEq(wNew, 1216);
        assertEq(lNew, 1184);
    }

    function test_FavoredWinnerGainsLess() public view {
        // Big diff (1500 vs 1200, diff=300): winner expected ~0.849
        // delta_w = 32*(1-0.849) = 32*0.151 = 4 (truncated)
        // delta_l = 32*0.849 = 27 (truncated)
        (uint16 wNew, uint16 lNew) = codex.previewEloChange(1500, 1200);
        assertEq(wNew, 1504);
        assertEq(lNew, 1173);
    }

    function test_UnderdogWinnerGainsMore() public view {
        // Underdog 1200 beats 1500: winner expected = 1 - 0.849 = 0.151
        // delta_w = 32*(1-0.151) = 32*0.849 = 27 (truncated)
        // delta_l = 32*0.151 = 4 (truncated)
        (uint16 wNew, uint16 lNew) = codex.previewEloChange(1200, 1500);
        assertEq(wNew, 1227);
        assertEq(lNew, 1496);
    }

    function test_EloFloorAt100() public view {
        // Loser at 110, big diff → would drop below 100 floor
        (uint16 wNew, uint16 lNew) = codex.previewEloChange(2000, 110);
        assertEq(wNew, 2000); // diff > 800 → expected 0.99 → +0.32 truncates to 0
        assertEq(lNew, 100);  // floored at 100
    }

    // ─────── Title derivation ───────

    function test_TitleInitiate() public view {
        assertEq(uint8(codex.previewTitle(0, 1200, false)), uint8(ApprenticeINFT.Title.Initiate));
        assertEq(uint8(codex.previewTitle(2, 1300, false)), uint8(ApprenticeINFT.Title.Initiate));
    }

    function test_TitleApprenticeAt3Wins() public view {
        assertEq(uint8(codex.previewTitle(3, 1230, false)), uint8(ApprenticeINFT.Title.Apprentice));
        assertEq(uint8(codex.previewTitle(9, 1280, false)), uint8(ApprenticeINFT.Title.Apprentice));
    }

    function test_TitleAdeptAt10Wins() public view {
        assertEq(uint8(codex.previewTitle(10, 1320, false)), uint8(ApprenticeINFT.Title.Adept));
        assertEq(uint8(codex.previewTitle(24, 1500, false)), uint8(ApprenticeINFT.Title.Adept));
    }

    function test_TitleMasterRequiresChampionBeaten() public view {
        // 25 wins, no champion → still Adept
        assertEq(uint8(codex.previewTitle(25, 1500, false)), uint8(ApprenticeINFT.Title.Adept));
        // 25 wins + champion beaten → Master
        assertEq(uint8(codex.previewTitle(25, 1500, true)), uint8(ApprenticeINFT.Title.Master));
    }

    function test_TitleSageRequires50WinsAnd1800Elo() public view {
        // 50 wins, ELO 1799 → only Master (assuming championBeaten)
        assertEq(uint8(codex.previewTitle(50, 1799, true)), uint8(ApprenticeINFT.Title.Master));
        // 50 wins, ELO 1800, champion beaten → Sage
        assertEq(uint8(codex.previewTitle(50, 1800, true)), uint8(ApprenticeINFT.Title.Sage));
        // 50 wins, ELO 1800, no champion → still Sage (Sage check is first)
        assertEq(uint8(codex.previewTitle(50, 1800, false)), uint8(ApprenticeINFT.Title.Sage));
    }

    // ─────── recordDuelOutcome ───────

    function test_RecordDuelOnlyDuelContract() public {
        uint256 a = _mintApprentice(ApprenticeINFT.ApprenticeType.Bold);
        uint256 b = _mintApprentice(ApprenticeINFT.ApprenticeType.Patient);

        vm.expectRevert(Codex.OnlyDuelContract.selector);
        codex.recordDuelOutcome(1, a, b);
    }

    function test_RecordDuelUpdatesBothApprentices() public {
        uint256 a = _mintApprentice(ApprenticeINFT.ApprenticeType.Bold);
        uint256 b = _mintApprentice(ApprenticeINFT.ApprenticeType.Patient);

        vm.prank(duelContract);
        codex.recordDuelOutcome(1, a, b);

        ApprenticeINFT.ApprenticeData memory wd = inft.getData(a);
        ApprenticeINFT.ApprenticeData memory ld = inft.getData(b);
        assertEq(wd.elo, 1216);
        assertEq(wd.wins, 1);
        assertEq(wd.losses, 0);
        assertEq(ld.elo, 1184);
        assertEq(ld.wins, 0);
        assertEq(ld.losses, 1);
    }

    function test_RecordDuelTitleProgression() public {
        uint256 a = _mintApprentice(ApprenticeINFT.ApprenticeType.Bold);
        uint256 b = _mintApprentice(ApprenticeINFT.ApprenticeType.Patient);

        // Run 3 duels — `a` should become Apprentice
        vm.startPrank(duelContract);
        codex.recordDuelOutcome(1, a, b);
        codex.recordDuelOutcome(2, a, b);
        codex.recordDuelOutcome(3, a, b);
        vm.stopPrank();

        assertEq(uint8(inft.titleOf(a)), uint8(ApprenticeINFT.Title.Apprentice));
        assertEq(uint8(inft.titleOf(b)), uint8(ApprenticeINFT.Title.Initiate));
    }

    function test_RecordDuelChampionBeaten() public {
        // Mint a "burner" Apprentice first to occupy tokenId 0 (reserved per Codex docs).
        _mintApprentice(ApprenticeINFT.ApprenticeType.Stoic);
        // Now contender = tokenId 1, champion = tokenId 2.
        uint256 contender = _mintApprentice(ApprenticeINFT.ApprenticeType.Bold);
        uint256 champion = _mintApprentice(ApprenticeINFT.ApprenticeType.Bold);
        codex.registerChampion(ApprenticeINFT.ApprenticeType.Bold, champion);

        // Get contender to 25 wins against a non-Champion (need 24 wins first via duels with `champion` not registered)
        // Simpler: mint a third "punching bag" and run 24 duels
        uint256 dummy = _mintApprentice(ApprenticeINFT.ApprenticeType.Patient);
        vm.startPrank(duelContract);
        for (uint256 i = 0; i < 24; i++) {
            codex.recordDuelOutcome(uint256(100 + i), contender, dummy);
        }
        // 24 wins, no champion beaten → Adept
        assertEq(uint8(inft.titleOf(contender)), uint8(ApprenticeINFT.Title.Adept));

        // 25th win is against the Champion → triggers championBeaten + Master
        codex.recordDuelOutcome(200, contender, champion);
        vm.stopPrank();

        assertTrue(inft.getData(contender).championBeaten);
        assertEq(uint8(inft.titleOf(contender)), uint8(ApprenticeINFT.Title.Master));
    }

    // ─────── registerChampion ───────

    function test_RegisterChampionOnlyOwner() public {
        uint256 t = _mintApprentice(ApprenticeINFT.ApprenticeType.Bold);
        vm.prank(other);
        vm.expectRevert(Codex.OnlyOwner.selector);
        codex.registerChampion(ApprenticeINFT.ApprenticeType.Bold, t);
    }

    function test_RegisterChampionOnce() public {
        // Burn tokenId 0 so we can use 1 and 2 as Champions
        _mintApprentice(ApprenticeINFT.ApprenticeType.Stoic);
        uint256 a = _mintApprentice(ApprenticeINFT.ApprenticeType.Bold);
        uint256 b = _mintApprentice(ApprenticeINFT.ApprenticeType.Bold);
        codex.registerChampion(ApprenticeINFT.ApprenticeType.Bold, a);
        vm.expectRevert(Codex.ChampionAlreadySet.selector);
        codex.registerChampion(ApprenticeINFT.ApprenticeType.Bold, b);
    }

    function test_RegisterChampionRejectsTokenIdZero() public {
        // Reserve: Apprentice 0 is the genesis mint, never a Champion (per Codex docs)
        // Have to mint at least one to make any tokenId, but registering with id 0 should fail.
        _mintApprentice(ApprenticeINFT.ApprenticeType.Bold); // tokenId 0 exists now
        vm.expectRevert("Champion tokenId 0 reserved");
        codex.registerChampion(ApprenticeINFT.ApprenticeType.Bold, 0);
    }
}
