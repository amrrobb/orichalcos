// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ApprenticeINFT.sol";
import "./Codex.sol";
import "./interfaces/IPyth.sol";

/// @title ScryingDuel — 1v1 oracle-settled direction prediction
/// @notice The core game mechanic of Orichalcos. Two Apprentices commit a binary
///         direction (LONG/SHORT) on a Pyth-fed asset for a 60-180s window. The
///         oracle settles. The winner takes the pot minus a protocol fee. The
///         loser's track record is updated forever.
///
///         Each commit carries:
///          - The TEE attestation (Intel TDX + H100 signed by enclave-born key)
///          - The 0G Storage hash of the public tell (reasoning paragraph)
///          - The price snapshot at commit time (so settlement is provable)
///
/// @dev Both Apprentices are operated by an off-chain agent runner that holds
///      the symmetric keys to their sealed souls (Tier 2-real). The runner calls
///      0G Compute (TEE) to produce signed direction calls + tells, then submits
///      them via commitDirection().
contract ScryingDuel {
    enum Direction { Long, Short }
    enum DuelStatus { Open, Committed, Settled, Cancelled }

    struct Duel {
        uint256 challengerTokenId;
        uint256 defenderTokenId;
        bytes32 priceFeedId;
        int64 priceAtCommit;          // Captured when both have committed
        uint256 commitTimestamp;      // Timestamp at full-commit
        uint256 settleTimestamp;      // commitTimestamp + window
        uint64 windowSeconds;         // 60..180
        Direction challengerCall;
        Direction defenderCall;
        bytes32 challengerTellHash;
        bytes32 defenderTellHash;
        bytes32 challengerAttestationHash;  // keccak256 of TEE attestation blob
        bytes32 defenderAttestationHash;
        uint256 stake;
        DuelStatus status;
        bool challengerCommitted;
        bool defenderCommitted;
    }

    ApprenticeINFT public immutable inft;
    Codex public immutable codex;
    IPyth public immutable pyth;
    address public immutable owner;

    uint256 public nextDuelId = 1;     // 0 reserved as "no duel"
    uint16 public protocolFeeBps = 250; // 2.5% to treasury
    address public treasury;
    uint256 public protocolFees;

    uint64 public constant MIN_WINDOW = 60;
    uint64 public constant MAX_WINDOW = 180;
    uint256 public constant MAX_PRICE_AGE = 60; // seconds

    mapping(uint256 => Duel) public duels;

    event DuelChallenged(
        uint256 indexed duelId,
        uint256 indexed challengerTokenId,
        uint256 indexed defenderTokenId,
        bytes32 priceFeedId,
        uint64 windowSeconds,
        uint256 stake
    );
    event DirectionCommitted(
        uint256 indexed duelId,
        uint256 indexed tokenId,
        Direction direction,
        bytes32 tellHash,
        bytes32 attestationHash
    );
    event DuelSettled(
        uint256 indexed duelId,
        uint256 indexed winnerTokenId,
        uint256 indexed loserTokenId,
        int64 priceAtCommit,
        int64 priceAtSettle,
        uint256 winnings,
        uint256 protocolFee
    );
    event DuelCancelled(uint256 indexed duelId);

    error InvalidWindow();
    error SameApprentice();
    error NotOpen();
    error NotChallengerOrDefender();
    error AlreadyCommitted();
    error InvalidStake();
    error WindowNotEnded();
    error AlreadySettled();
    error NotBothCommitted();
    error InvalidAttestation();
    error InvalidTellHash();
    error OnlyOwner();
    error NotAuthorizedToCommit();

    modifier onlyOwner_() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address _inft, address _codex, address _pyth, address _treasury) {
        inft = ApprenticeINFT(_inft);
        codex = Codex(_codex);
        pyth = IPyth(_pyth);
        owner = msg.sender;
        treasury = _treasury;
    }

    function setTreasury(address _treasury) external onlyOwner_ {
        treasury = _treasury;
    }

    function setProtocolFeeBps(uint16 bps) external onlyOwner_ {
        require(bps <= 1000, "Fee too high"); // hard cap 10%
        protocolFeeBps = bps;
    }

    function withdrawFees() external onlyOwner_ {
        uint256 amount = protocolFees;
        protocolFees = 0;
        (bool ok, ) = treasury.call{value: amount}("");
        require(ok, "Fee withdraw failed");
    }

    // ─────────────────────────── Lifecycle ───────────────────────────

    /// @notice Open a duel. Stakes msg.value as the entry pot. The defender's
    ///         matching stake is provided by either a contract-side escrow flow
    ///         (future) or — for the demo — the same caller funds both sides
    ///         via challenge() then commit() on both. We keep the on-chain rule
    ///         simple: total pot = msg.value at challenge, both sides contribute
    ///         equally off-chain.
    function challenge(
        uint256 challengerTokenId,
        uint256 defenderTokenId,
        bytes32 priceFeedId,
        uint64 windowSeconds
    ) external payable returns (uint256 duelId) {
        if (challengerTokenId == defenderTokenId) revert SameApprentice();
        if (windowSeconds < MIN_WINDOW || windowSeconds > MAX_WINDOW) revert InvalidWindow();
        if (msg.value == 0) revert InvalidStake();
        // Existence check: getData reverts if either tokenId doesn't exist
        inft.getData(challengerTokenId);
        inft.getData(defenderTokenId);

        duelId = nextDuelId++;
        Duel storage d = duels[duelId];
        d.challengerTokenId = challengerTokenId;
        d.defenderTokenId = defenderTokenId;
        d.priceFeedId = priceFeedId;
        d.windowSeconds = windowSeconds;
        d.stake = msg.value;
        d.status = DuelStatus.Open;

        emit DuelChallenged(duelId, challengerTokenId, defenderTokenId, priceFeedId, windowSeconds, msg.value);
    }

    /// @notice Commit a direction call for one side of the duel.
    /// @dev TEE attestation is verified off-chain by the agent runner; the hash
    ///      is committed here so it's a permanent on-chain witness. The full
    ///      attestation blob lives on 0G Storage with the public tell.
    ///
    ///      Authorization: msg.sender must be (a) the INFT owner, (b) ERC-721
    ///      approved-for-all by the owner, or (c) the per-token approved address.
    ///      This is the standard ERC-721 operator pattern — Trainers can let
    ///      their agent runner commit on their behalf via setApprovalForAll().
    function commitDirection(
        uint256 duelId,
        uint256 tokenId,
        Direction direction,
        bytes32 tellHash,
        bytes32 attestationHash
    ) external {
        Duel storage d = duels[duelId];
        if (d.status != DuelStatus.Open) revert NotOpen();
        if (tellHash == bytes32(0)) revert InvalidTellHash();
        if (attestationHash == bytes32(0)) revert InvalidAttestation();

        bool isChallenger = (tokenId == d.challengerTokenId);
        bool isDefender = (tokenId == d.defenderTokenId);
        if (!isChallenger && !isDefender) revert NotChallengerOrDefender();

        // Authorization: only the Apprentice's owner (or its approved operator)
        // can commit a direction. Closes a frontrun-griefing vector.
        address tokenOwner = inft.ownerOf(tokenId);
        if (
            msg.sender != tokenOwner
            && !inft.isApprovedForAll(tokenOwner, msg.sender)
            && inft.getApproved(tokenId) != msg.sender
        ) {
            revert NotAuthorizedToCommit();
        }

        if (isChallenger) {
            if (d.challengerCommitted) revert AlreadyCommitted();
            d.challengerCall = direction;
            d.challengerTellHash = tellHash;
            d.challengerAttestationHash = attestationHash;
            d.challengerCommitted = true;
        } else {
            if (d.defenderCommitted) revert AlreadyCommitted();
            d.defenderCall = direction;
            d.defenderTellHash = tellHash;
            d.defenderAttestationHash = attestationHash;
            d.defenderCommitted = true;
        }

        emit DirectionCommitted(duelId, tokenId, direction, tellHash, attestationHash);

        // When both have committed, snapshot the price + start the window
        if (d.challengerCommitted && d.defenderCommitted) {
            IPyth.Price memory snapshot = pyth.getPriceNoOlderThan(d.priceFeedId, MAX_PRICE_AGE);
            d.priceAtCommit = snapshot.price;
            d.commitTimestamp = block.timestamp;
            d.settleTimestamp = block.timestamp + d.windowSeconds;
            d.status = DuelStatus.Committed;
        }
    }

    /// @notice Settle a duel. Anyone can call (gasless from owner perspective).
    ///         Reads Pyth at settleTimestamp. Determines winner. Pays out.
    ///         Calls Codex.recordDuelOutcome() to update INFT track records.
    function settle(uint256 duelId) external {
        Duel storage d = duels[duelId];
        if (d.status != DuelStatus.Committed) revert NotBothCommitted();
        if (block.timestamp < d.settleTimestamp) revert WindowNotEnded();

        IPyth.Price memory current = pyth.getPriceNoOlderThan(d.priceFeedId, MAX_PRICE_AGE);
        int64 priceNow = current.price;

        // Outcome: priceNow > priceAtCommit → LONG correct.
        // Tied price treated as no-movement → both wrong. We resolve as draw to
        // challenger by default (rare; if it happens often the agent should pick
        // tighter windows). For now: tie → challenger wins to keep flow simple.
        bool longCorrect = priceNow > d.priceAtCommit;
        bool shortCorrect = priceNow < d.priceAtCommit;

        bool challengerWon;
        if (longCorrect) {
            challengerWon = (d.challengerCall == Direction.Long);
            // If both LONG → challenger wins (they initiated). If both SHORT → defender wins.
            if (d.challengerCall == d.defenderCall) {
                challengerWon = true; // tie-break to challenger
            }
        } else if (shortCorrect) {
            challengerWon = (d.challengerCall == Direction.Short);
            if (d.challengerCall == d.defenderCall) {
                challengerWon = true;
            }
        } else {
            // No price movement at all → tie-break to challenger
            challengerWon = true;
        }

        uint256 winnerTokenId = challengerWon ? d.challengerTokenId : d.defenderTokenId;
        uint256 loserTokenId = challengerWon ? d.defenderTokenId : d.challengerTokenId;

        uint256 protocolFee = (d.stake * protocolFeeBps) / 10000;
        uint256 winnings = d.stake - protocolFee;
        protocolFees += protocolFee;

        d.status = DuelStatus.Settled;

        // Pay out to the winning Apprentice's owner
        address winnerOwner = inft.ownerOf(winnerTokenId);
        (bool ok, ) = winnerOwner.call{value: winnings}("");
        require(ok, "Payout failed");

        // Codex updates ELO + Title + INFT
        codex.recordDuelOutcome(duelId, winnerTokenId, loserTokenId);

        emit DuelSettled(duelId, winnerTokenId, loserTokenId, d.priceAtCommit, priceNow, winnings, protocolFee);
    }

    /// @notice Cancel a duel that's still Open (no commits yet) — refund stake.
    function cancel(uint256 duelId) external {
        Duel storage d = duels[duelId];
        if (d.status != DuelStatus.Open) revert NotOpen();
        if (d.challengerCommitted || d.defenderCommitted) revert AlreadyCommitted();

        // Either Apprentice's owner can cancel
        address chOwner = inft.ownerOf(d.challengerTokenId);
        address defOwner = inft.ownerOf(d.defenderTokenId);
        require(msg.sender == chOwner || msg.sender == defOwner || msg.sender == owner, "Not authorized");

        d.status = DuelStatus.Cancelled;
        (bool ok, ) = chOwner.call{value: d.stake}("");
        require(ok, "Refund failed");

        emit DuelCancelled(duelId);
    }

    // ─────────────────────────── Views ───────────────────────────

    function getDuel(uint256 duelId) external view returns (Duel memory) {
        return duels[duelId];
    }
}
