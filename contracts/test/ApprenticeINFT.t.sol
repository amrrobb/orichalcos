// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ApprenticeINFT.sol";

contract ApprenticeINFTTest is Test {
    ApprenticeINFT inft;

    address deployer = address(this);
    address codex = address(0xC0DE);
    address trainer = address(0xBEEF);
    address other = address(0xCAFE);

    bytes32 constant SOUL_ROOT = bytes32(uint256(0xABCDEF));
    bytes32 constant META_HASH = bytes32(uint256(0x123456));

    function setUp() public {
        inft = new ApprenticeINFT();
        inft.setCodex(codex);
    }

    // ─────── Mint ───────

    function test_Mint() public {
        uint256 tokenId = inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);
        assertEq(tokenId, 0);
        assertEq(inft.ownerOf(tokenId), trainer);

        ApprenticeINFT.ApprenticeData memory d = inft.getData(tokenId);
        assertEq(uint8(d.apprenticeType), uint8(ApprenticeINFT.ApprenticeType.Bold));
        assertEq(uint8(d.currentTitle), uint8(ApprenticeINFT.Title.Initiate));
        assertEq(d.elo, 1200);
        assertEq(d.wins, 0);
        assertEq(d.losses, 0);
        assertEq(d.sealedSoulRoot, SOUL_ROOT);
        assertEq(d.metadataHash, META_HASH);
        assertEq(d.mintedBy, deployer);
        assertFalse(d.championBeaten);
    }

    function test_MintRevertsOnZeroSoulRoot() public {
        vm.expectRevert(ApprenticeINFT.InvalidSealedSoul.selector);
        inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, bytes32(0), META_HASH);
    }

    function test_MintEmitsUpdated() public {
        vm.expectEmit(true, false, false, true);
        emit IERC7857.Updated(0, bytes32(0), META_HASH, deployer);
        inft.mint(trainer, ApprenticeINFT.ApprenticeType.Patient, SOUL_ROOT, META_HASH);
    }

    function test_MintIncrementsTokenId() public {
        inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);
        uint256 second = inft.mint(trainer, ApprenticeINFT.ApprenticeType.Sharp, SOUL_ROOT, META_HASH);
        assertEq(second, 1);
        assertEq(inft.nextTokenId(), 2);
    }

    function test_AllFourTypesMintable() public {
        inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);
        inft.mint(trainer, ApprenticeINFT.ApprenticeType.Patient, SOUL_ROOT, META_HASH);
        inft.mint(trainer, ApprenticeINFT.ApprenticeType.Sharp, SOUL_ROOT, META_HASH);
        inft.mint(trainer, ApprenticeINFT.ApprenticeType.Stoic, SOUL_ROOT, META_HASH);

        assertEq(uint8(inft.typeOf(0)), uint8(ApprenticeINFT.ApprenticeType.Bold));
        assertEq(uint8(inft.typeOf(1)), uint8(ApprenticeINFT.ApprenticeType.Patient));
        assertEq(uint8(inft.typeOf(2)), uint8(ApprenticeINFT.ApprenticeType.Sharp));
        assertEq(uint8(inft.typeOf(3)), uint8(ApprenticeINFT.ApprenticeType.Stoic));
    }

    // ─────── setStats access control ───────

    function test_SetStatsOnlyCodex() public {
        uint256 tokenId = inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);
        vm.prank(other);
        vm.expectRevert(ApprenticeINFT.OnlyCodex.selector);
        inft.setStats(tokenId, 1250, 1, 0, ApprenticeINFT.Title.Initiate);
    }

    function test_SetStatsByCodexUpdatesData() public {
        uint256 tokenId = inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);
        vm.prank(codex);
        inft.setStats(tokenId, 1300, 5, 1, ApprenticeINFT.Title.Apprentice);

        ApprenticeINFT.ApprenticeData memory d = inft.getData(tokenId);
        assertEq(d.elo, 1300);
        assertEq(d.wins, 5);
        assertEq(d.losses, 1);
        assertEq(uint8(d.currentTitle), uint8(ApprenticeINFT.Title.Apprentice));
    }

    function test_SetStatsEmitsUpdated() public {
        uint256 tokenId = inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);
        vm.prank(codex);
        // Don't check exact hash, just that event fires
        vm.expectEmit(true, false, false, false);
        emit IERC7857.Updated(tokenId, bytes32(0), bytes32(0), codex);
        inft.setStats(tokenId, 1250, 1, 0, ApprenticeINFT.Title.Initiate);
    }

    function test_SetStatsNonexistentReverts() public {
        vm.prank(codex);
        vm.expectRevert(ApprenticeINFT.NonexistentToken.selector);
        inft.setStats(999, 1250, 1, 0, ApprenticeINFT.Title.Initiate);
    }

    // ─────── Title progression (set via Codex passes in newTitle) ───────

    function test_TitleTransitionsAcrossThresholds() public {
        uint256 tokenId = inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);

        vm.startPrank(codex);
        // 3 wins → Apprentice
        inft.setStats(tokenId, 1230, 3, 0, ApprenticeINFT.Title.Apprentice);
        assertEq(uint8(inft.titleOf(tokenId)), uint8(ApprenticeINFT.Title.Apprentice));

        // 10 wins → Adept
        inft.setStats(tokenId, 1320, 10, 1, ApprenticeINFT.Title.Adept);
        assertEq(uint8(inft.titleOf(tokenId)), uint8(ApprenticeINFT.Title.Adept));

        // 25 wins + champion beaten → Master
        inft.markChampionBeaten(tokenId);
        inft.setStats(tokenId, 1500, 25, 4, ApprenticeINFT.Title.Master);
        assertEq(uint8(inft.titleOf(tokenId)), uint8(ApprenticeINFT.Title.Master));

        // 50 wins + ELO ≥ 1800 → Sage
        inft.setStats(tokenId, 1820, 50, 8, ApprenticeINFT.Title.Sage);
        assertEq(uint8(inft.titleOf(tokenId)), uint8(ApprenticeINFT.Title.Sage));
        vm.stopPrank();
    }

    // ─────── markChampionBeaten ───────

    function test_MarkChampionBeatenOnce() public {
        uint256 tokenId = inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);
        assertFalse(inft.getData(tokenId).championBeaten);

        vm.prank(codex);
        inft.markChampionBeaten(tokenId);
        assertTrue(inft.getData(tokenId).championBeaten);

        // Calling again is no-op (no event)
        vm.prank(codex);
        inft.markChampionBeaten(tokenId);
        assertTrue(inft.getData(tokenId).championBeaten);
    }

    function test_MarkChampionOnlyCodex() public {
        uint256 tokenId = inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);
        vm.expectRevert(ApprenticeINFT.OnlyCodex.selector);
        inft.markChampionBeaten(tokenId);
    }

    // ─────── setCodex ───────

    function test_SetCodexOnlyOwner() public {
        vm.prank(other);
        vm.expectRevert(ApprenticeINFT.OnlyOwner.selector);
        inft.setCodex(other);
    }

    function test_SetCodexUpdates() public {
        address newCodex = address(0xDEAD);
        inft.setCodex(newCodex);
        assertEq(inft.codex(), newCodex);
    }

    // ─────── Transfer preserves track record ───────

    function test_TransferPreservesData() public {
        uint256 tokenId = inft.mint(trainer, ApprenticeINFT.ApprenticeType.Bold, SOUL_ROOT, META_HASH);
        vm.prank(codex);
        inft.setStats(tokenId, 1500, 25, 4, ApprenticeINFT.Title.Master);

        vm.prank(trainer);
        inft.transferFrom(trainer, other, tokenId);

        // New owner inherits the entire reputation
        assertEq(inft.ownerOf(tokenId), other);
        ApprenticeINFT.ApprenticeData memory d = inft.getData(tokenId);
        assertEq(d.elo, 1500);
        assertEq(d.wins, 25);
        assertEq(uint8(d.currentTitle), uint8(ApprenticeINFT.Title.Master));
    }
}
