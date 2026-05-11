// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ApprenticeINFT.sol";

/// @title Codex — on-chain track record + ELO + Title progression
/// @notice The Codex is the single source of truth for an Apprentice's track
///         record. It computes ELO and Title transitions; ApprenticeINFT trusts
///         the Codex via its onlyCodex modifier.
///
/// @dev ELO uses standard piecewise approximation with K=32. We use integer math
///      with a 1000x scale internally for the win-probability lookup, keeping
///      gas bounded and avoiding precompile/oracle dependencies.
contract Codex {
    ApprenticeINFT public immutable inft;
    address public immutable owner;
    address public duelContract;

    uint16 public constant K_FACTOR = 32;
    uint16 public constant STARTING_ELO = 1200;

    // Title win thresholds (matches HANDOFF Section 3)
    uint32 public constant WINS_APPRENTICE = 3;
    uint32 public constant WINS_ADEPT = 10;
    uint32 public constant WINS_MASTER = 25;
    uint32 public constant WINS_SAGE = 50;
    uint16 public constant ELO_SAGE = 1800;

    // Champion address bookkeeping — set per Type after Champion mint
    mapping(uint8 => uint256) public championOf; // ApprenticeType -> Champion tokenId

    event DuelOutcomeRecorded(
        uint256 indexed duelId,
        uint256 indexed winnerTokenId,
        uint256 indexed loserTokenId,
        uint16 winnerNewElo,
        uint16 loserNewElo
    );
    event TitleProgressed(uint256 indexed tokenId, ApprenticeINFT.Title newTitle);
    event ChampionRegistered(uint8 indexed apprenticeType, uint256 indexed tokenId);
    event DuelContractUpdated(address indexed oldDuel, address indexed newDuel);

    error OnlyOwner();
    error OnlyDuelContract();
    error ChampionAlreadySet();

    modifier onlyOwner_() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyDuelContract() {
        if (msg.sender != duelContract) revert OnlyDuelContract();
        _;
    }

    constructor(address _inft) {
        inft = ApprenticeINFT(_inft);
        owner = msg.sender;
    }

    function setDuelContract(address _duel) external onlyOwner_ {
        emit DuelContractUpdated(duelContract, _duel);
        duelContract = _duel;
    }

    /// @notice Register the Champion tokenId for a given Type. One per Type, set once.
    function registerChampion(ApprenticeINFT.ApprenticeType apprenticeType, uint256 tokenId) external onlyOwner_ {
        uint8 t = uint8(apprenticeType);
        if (championOf[t] != 0) revert ChampionAlreadySet();
        // Use sentinel +1 storage so championOf[type] = tokenId+1 (avoid tokenId==0 ambiguity)
        // Actually: keep semantics simple — disallow Champions with tokenId 0 (mint Champions after at least one Apprentice)
        require(tokenId != 0, "Champion tokenId 0 reserved");
        championOf[t] = tokenId;
        emit ChampionRegistered(t, tokenId);
    }

    /// @notice Called by ScryingDuel after settlement.
    /// @dev Computes new ELO for both Apprentices, updates wins/losses, derives
    ///      Title from win count + ELO + championBeaten, then writes back to INFT.
    function recordDuelOutcome(
        uint256 duelId,
        uint256 winnerTokenId,
        uint256 loserTokenId
    ) external onlyDuelContract {
        ApprenticeINFT.ApprenticeData memory w = inft.getData(winnerTokenId);
        ApprenticeINFT.ApprenticeData memory l = inft.getData(loserTokenId);

        (uint16 winnerNewElo, uint16 loserNewElo) = _calculateNewElo(w.elo, l.elo);

        uint32 winnerWins = w.wins + 1;
        uint32 winnerLosses = w.losses;
        uint32 loserWins = l.wins;
        uint32 loserLosses = l.losses + 1;

        // Was the loser the winner's Type-Champion? If yes, mark championBeaten.
        bool winnerBeatChampion = w.championBeaten;
        uint256 typeChampion = championOf[uint8(w.apprenticeType)];
        if (typeChampion != 0 && typeChampion == loserTokenId && !w.championBeaten) {
            inft.markChampionBeaten(winnerTokenId);
            winnerBeatChampion = true;
        }

        ApprenticeINFT.Title winnerNewTitle = _deriveTitle(winnerWins, winnerNewElo, winnerBeatChampion);
        ApprenticeINFT.Title loserNewTitle = _deriveTitle(loserWins, loserNewElo, l.championBeaten);

        inft.setStats(winnerTokenId, winnerNewElo, winnerWins, winnerLosses, winnerNewTitle);
        inft.setStats(loserTokenId, loserNewElo, loserWins, loserLosses, loserNewTitle);

        if (winnerNewTitle != w.currentTitle) {
            emit TitleProgressed(winnerTokenId, winnerNewTitle);
        }
        if (loserNewTitle != l.currentTitle) {
            emit TitleProgressed(loserTokenId, loserNewTitle);
        }

        emit DuelOutcomeRecorded(duelId, winnerTokenId, loserTokenId, winnerNewElo, loserNewElo);
    }

    // ─────────────────────────── ELO math ───────────────────────────

    /// @notice Piecewise integer approximation of ELO. Matches K=32 standard.
    /// @dev Avoids floating-point. Win probability table is precomputed in 100-point
    ///      buckets of rating difference. For diff > 800, treat as essentially 1.0/0.0.
    function _calculateNewElo(uint16 winnerElo, uint16 loserElo)
        internal
        pure
        returns (uint16 newWinnerElo, uint16 newLoserElo)
    {
        // expectedWinnerWinPct out of 1000 (so 500 = 0.5 exact even match)
        uint256 expectedWinnerWinPct = _expectedWinPct(winnerElo, loserElo);

        // Result for winner = 1.0 (1000/1000 in scale), for loser = 0
        // delta = K * (actual - expected). Winner: (1000 - expected). Loser: (0 - expected) = -expected.
        // K_FACTOR is the integer coefficient, scaled inversely by 1000.
        uint256 winnerDelta = (uint256(K_FACTOR) * (1000 - expectedWinnerWinPct)) / 1000;
        uint256 loserDelta = (uint256(K_FACTOR) * expectedWinnerWinPct) / 1000;

        newWinnerElo = uint16(uint256(winnerElo) + winnerDelta);
        // Floor at 100 ELO (don't let an Apprentice drop below this — they're still INFTs)
        if (loserElo > loserDelta + 100) {
            newLoserElo = uint16(uint256(loserElo) - loserDelta);
        } else {
            newLoserElo = 100;
        }
    }

    /// @notice Returns the winner's expected-win-probability scaled to 1000.
    ///         500 = 50%. 750 = 75%. Piecewise table over absolute ELO diff.
    function _expectedWinPct(uint16 a, uint16 b) internal pure returns (uint256 pct) {
        if (a == b) return 500;

        bool aHigher = a > b;
        uint256 diff = aHigher ? uint256(a) - uint256(b) : uint256(b) - uint256(a);

        // Piecewise approximation of 1 / (1 + 10^(-diff/400)) — standard ELO formula.
        // Buckets in steps of 50, scaled to per-thousand:
        uint256 advantagePct;
        if (diff >= 800)       advantagePct = 990;
        else if (diff >= 600)  advantagePct = 970;
        else if (diff >= 500)  advantagePct = 947;
        else if (diff >= 400)  advantagePct = 909;
        else if (diff >= 300)  advantagePct = 849;
        else if (diff >= 200)  advantagePct = 758;
        else if (diff >= 150)  advantagePct = 703;
        else if (diff >= 100)  advantagePct = 640;
        else if (diff >= 50)   advantagePct = 571;
        else                   advantagePct = 535;

        // a is the "winner" position — caller passed (winner, loser). If a < b then winner is underdog.
        return aHigher ? advantagePct : (1000 - advantagePct);
    }

    // ─────────────────────────── Title derivation ───────────────────────────

    /// @dev Title progression rules (HANDOFF Section 3):
    ///      Initiate (0) → Apprentice (3 wins) → Adept (10 wins)
    ///      → Master (25 wins + championBeaten)
    ///      → Sage (50 wins + ELO ≥ 1800)
    function _deriveTitle(uint32 wins, uint16 elo, bool championBeaten)
        internal
        pure
        returns (ApprenticeINFT.Title)
    {
        if (wins >= WINS_SAGE && elo >= ELO_SAGE) return ApprenticeINFT.Title.Sage;
        if (wins >= WINS_MASTER && championBeaten) return ApprenticeINFT.Title.Master;
        if (wins >= WINS_ADEPT) return ApprenticeINFT.Title.Adept;
        if (wins >= WINS_APPRENTICE) return ApprenticeINFT.Title.Apprentice;
        return ApprenticeINFT.Title.Initiate;
    }

    // ─────────────────────────── Views ───────────────────────────

    /// @notice Expose ELO calc for off-chain simulation / dashboard previews.
    function previewEloChange(uint16 winnerElo, uint16 loserElo)
        external
        pure
        returns (uint16, uint16)
    {
        return _calculateNewElo(winnerElo, loserElo);
    }

    /// @notice Expose title derivation for off-chain previews.
    function previewTitle(uint32 wins, uint16 elo, bool championBeaten)
        external
        pure
        returns (ApprenticeINFT.Title)
    {
        return _deriveTitle(wins, elo, championBeaten);
    }
}
