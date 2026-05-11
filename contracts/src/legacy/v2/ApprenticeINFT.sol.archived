// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./interfaces/IERC7857.sol";

/// @title ApprenticeINFT — ERC-721 + ERC-7857 Apprentice NFT for Orichalcos
/// @notice An Apprentice is a transferable AI agent. The track record (ELO,
///         wins, losses, Title) is bound to the token; transferring the token
///         transfers the entire reputation. Burning the identity means walking
///         away from years of accumulated track record — that's the point.
///
/// @dev ERC-7857 spec compliance via the `Updated` event on every state mutation
///      that changes the agent's intelligence-binding hash.
contract ApprenticeINFT is ERC721, IERC7857 {
    enum ApprenticeType { Bold, Patient, Sharp, Stoic }
    enum Title { Initiate, Apprentice, Adept, Master, Sage }

    struct ApprenticeData {
        ApprenticeType apprenticeType; // Bold | Patient | Sharp | Stoic — locked at mint
        Title currentTitle;            // Initiate → Apprentice → Adept → Master → Sage
        uint16 elo;                    // Starts at 1200
        uint32 wins;
        uint32 losses;
        bytes32 sealedSoulRoot;        // Merkle root of encrypted soul on 0G Storage
        bytes32 metadataHash;          // ERC-7857 metadata hash
        address mintedBy;
        uint256 mintedAt;
        bool championBeaten;           // True once this Apprentice has beaten its Type's Champion
    }

    uint16 public constant STARTING_ELO = 1200;

    address public immutable owner;
    address public codex;          // Only Codex can update fight stats
    uint256 public nextTokenId;

    mapping(uint256 => ApprenticeData) private _data;

    event ApprenticeMinted(
        uint256 indexed tokenId,
        address indexed trainer,
        ApprenticeType apprenticeType,
        bytes32 sealedSoulRoot
    );
    event StatsUpdated(
        uint256 indexed tokenId,
        uint16 newElo,
        uint32 newWins,
        uint32 newLosses,
        Title newTitle
    );
    event CodexUpdated(address indexed oldCodex, address indexed newCodex);
    event ChampionBeaten(uint256 indexed tokenId, ApprenticeType championType);

    error OnlyOwner();
    error OnlyCodex();
    error NonexistentToken();
    error InvalidSealedSoul();

    modifier onlyOwner_() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyCodex() {
        if (msg.sender != codex) revert OnlyCodex();
        _;
    }

    constructor() ERC721("Orichalcos Apprentice", "ORICH-APPR") {
        owner = msg.sender;
    }

    /// @notice Mint a new Apprentice for `trainer`.
    /// @param trainer The Trainer who owns the Apprentice.
    /// @param apprenticeType Locked at mint — cannot be changed later.
    /// @param sealedSoulRoot 0G Storage merkle root of the encrypted soul.
    /// @param metadataHash ERC-7857 metadata hash.
    function mint(
        address trainer,
        ApprenticeType apprenticeType,
        bytes32 sealedSoulRoot,
        bytes32 metadataHash
    ) external returns (uint256 tokenId) {
        if (sealedSoulRoot == bytes32(0)) revert InvalidSealedSoul();
        tokenId = nextTokenId++;
        _safeMint(trainer, tokenId);
        _data[tokenId] = ApprenticeData({
            apprenticeType: apprenticeType,
            currentTitle: Title.Initiate,
            elo: STARTING_ELO,
            wins: 0,
            losses: 0,
            sealedSoulRoot: sealedSoulRoot,
            metadataHash: metadataHash,
            mintedBy: msg.sender,
            mintedAt: block.timestamp,
            championBeaten: false
        });
        emit ApprenticeMinted(tokenId, trainer, apprenticeType, sealedSoulRoot);
        emit Updated(tokenId, bytes32(0), metadataHash, msg.sender);
    }

    /// @notice Set the Codex contract address. Only the deployer can set this.
    function setCodex(address newCodex) external onlyOwner_ {
        emit CodexUpdated(codex, newCodex);
        codex = newCodex;
    }

    /// @notice Apply Codex-computed stats to an Apprentice.
    /// @dev Only the Codex contract may call. Title progression is computed
    ///      on the Codex side and passed in here (single source of truth there).
    function setStats(
        uint256 tokenId,
        uint16 newElo,
        uint32 newWins,
        uint32 newLosses,
        Title newTitle
    ) external onlyCodex {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        ApprenticeData storage d = _data[tokenId];
        d.elo = newElo;
        d.wins = newWins;
        d.losses = newLosses;
        d.currentTitle = newTitle;

        bytes32 oldHash = d.metadataHash;
        bytes32 newHash = keccak256(
            abi.encodePacked(tokenId, newElo, newWins, newLosses, newTitle, d.sealedSoulRoot)
        );
        d.metadataHash = newHash;

        emit StatsUpdated(tokenId, newElo, newWins, newLosses, newTitle);
        emit Updated(tokenId, oldHash, newHash, msg.sender);
    }

    /// @notice Mark that this Apprentice has beaten its Type's Champion at least once.
    function markChampionBeaten(uint256 tokenId) external onlyCodex {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        ApprenticeData storage d = _data[tokenId];
        if (!d.championBeaten) {
            d.championBeaten = true;
            emit ChampionBeaten(tokenId, d.apprenticeType);
        }
    }

    // ─────────────────────────── Views ───────────────────────────

    function getData(uint256 tokenId) external view returns (ApprenticeData memory) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        return _data[tokenId];
    }

    function metadataHashOf(uint256 tokenId) external view returns (bytes32) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        return _data[tokenId].metadataHash;
    }

    function eloOf(uint256 tokenId) external view returns (uint16) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        return _data[tokenId].elo;
    }

    function titleOf(uint256 tokenId) external view returns (Title) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        return _data[tokenId].currentTitle;
    }

    function typeOf(uint256 tokenId) external view returns (ApprenticeType) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        return _data[tokenId].apprenticeType;
    }
}
