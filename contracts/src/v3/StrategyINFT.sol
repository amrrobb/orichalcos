// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IERC7857.sol";

/// @title StrategyINFT — ERC-721 + ERC-7857 AI trading strategy NFT (Orichalcos v3)
/// @notice A Strategy Agent is a transferable AI perp trading agent. Each token has:
///         (a) a sealed soul (encrypted system prompt on 0G Storage), (b) an inlined
///         per-token vault that holds bonded collateral for the active epoch, and
///         (c) lifecycle state (Idle → Active → Breached/Settled).
///
///         This is the risk-management primitive at the heart of Orichalcos v3.
///         The bond is the on-chain backing for any insurance policies written
///         against this strategy by the InsurancePool. On drawdown breach, the
///         pool can pull from the bond to settle claims.
contract StrategyINFT is ERC721, IERC7857, ReentrancyGuard {
    enum Archetype { Bold, Patient, Sharp, Stoic }
    enum EpochStatus { Idle, Active, Breached, Settled }

    struct StrategyData {
        Archetype archetype;          // locked at mint — Bold (Momentum) | Patient (Mean-Rev) | Sharp (Scalper) | Stoic (Grid)
        bytes32 sealedSoulRoot;       // 0G Storage merkle root of encrypted strategy
        bytes32 metadataHash;         // ERC-7857 metadata hash
        address mintedBy;
        uint256 mintedAt;

        // Inlined per-token vault — no separate vault contract per advisor's "cut to 3 contracts" rec
        uint256 currentEpochId;       // 0 = no active epoch
        uint256 startingBond;         // bond locked at startEpoch — IMMUTABLE during epoch (used for threshold math)
        uint256 bondAmount;           // current bond balance (drains during settle as pool pulls collateral)
        uint256 maxDrawdownBps;       // e.g. 2000 = 20%
        uint256 epochStartTs;
        uint256 epochEndTs;
        uint256 currentEquity;        // updated by TradeAttestation per trade
        EpochStatus status;
    }

    IERC20 public immutable usdc;
    address public immutable owner;
    address public tradeAttestation;  // only it can update equity
    address public insurancePool;     // only it can pull collateral on claim
    uint256 public nextTokenId = 1;   // tokenId 0 reserved per ERC-7857 convention
    uint256 public nextEpochId = 1;

    mapping(uint256 => StrategyData) private _data;

    event StrategyMinted(uint256 indexed tokenId, address indexed trader, Archetype archetype, bytes32 sealedSoulRoot);
    event EpochStarted(uint256 indexed tokenId, uint256 indexed epochId, uint256 bondAmount, uint256 maxDrawdownBps, uint256 epochEndTs);
    event EquityUpdated(uint256 indexed tokenId, uint256 indexed epochId, uint256 newEquity);
    event BreachMarked(uint256 indexed tokenId, uint256 indexed epochId, uint256 equityAtBreach, uint256 threshold);
    event EpochSettled(uint256 indexed tokenId, uint256 indexed epochId, uint256 toAllocators, uint256 toTrader);
    event TradeAttestationSet(address indexed oldAddr, address indexed newAddr);
    event InsurancePoolSet(address indexed oldAddr, address indexed newAddr);

    error OnlyOwner();
    error OnlyTradeAttestation();
    error OnlyInsurancePool();
    error OnlyTraderOrApproved();
    error NonexistentToken();
    error InvalidSealedSoul();
    error InvalidBondAmount();
    error InvalidDrawdown();
    error InvalidDuration();
    error EpochNotIdle();
    error EpochNotActive();
    error EpochNotEndedOrBreached();
    error NotInBreachState();
    error TransferRefused();

    constructor(address _usdc) ERC721("Orichalcos Strategy Agent", "ORICH-STRAT") {
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }

    // ─────────────────────────── Wiring (owner-only) ───────────────────────────

    function setTradeAttestation(address newAddr) external {
        if (msg.sender != owner) revert OnlyOwner();
        emit TradeAttestationSet(tradeAttestation, newAddr);
        tradeAttestation = newAddr;
    }

    function setInsurancePool(address newAddr) external {
        if (msg.sender != owner) revert OnlyOwner();
        emit InsurancePoolSet(insurancePool, newAddr);
        insurancePool = newAddr;
    }

    // ─────────────────────────── Lifecycle ───────────────────────────

    /// @notice Mint a new Strategy Agent. Trader funds USDC for first epoch via startEpoch().
    function mint(
        address trader,
        Archetype archetype,
        bytes32 sealedSoulRoot,
        bytes32 metadataHash
    ) external returns (uint256 tokenId) {
        if (sealedSoulRoot == bytes32(0)) revert InvalidSealedSoul();
        tokenId = nextTokenId++;
        _safeMint(trader, tokenId);
        StrategyData storage d = _data[tokenId];
        d.archetype = archetype;
        d.sealedSoulRoot = sealedSoulRoot;
        d.metadataHash = metadataHash;
        d.mintedBy = msg.sender;
        d.mintedAt = block.timestamp;
        d.status = EpochStatus.Idle;
        emit StrategyMinted(tokenId, trader, archetype, sealedSoulRoot);
        emit Updated(tokenId, bytes32(0), metadataHash, msg.sender);
    }

    /// @notice Open a new epoch on a Strategy Agent. Trader must approve USDC first.
    /// @dev Requires status == Idle. Pulls bondAmount USDC from msg.sender.
    function startEpoch(
        uint256 tokenId,
        uint256 bondAmount,
        uint256 maxDrawdownBps,
        uint256 epochDurationSecs
    ) external returns (uint256 epochId) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        address tokenOwner = _ownerOf(tokenId);
        if (
            msg.sender != tokenOwner
            && !isApprovedForAll(tokenOwner, msg.sender)
            && getApproved(tokenId) != msg.sender
        ) revert OnlyTraderOrApproved();

        StrategyData storage d = _data[tokenId];
        if (d.status != EpochStatus.Idle) revert EpochNotIdle();
        if (bondAmount == 0) revert InvalidBondAmount();
        if (maxDrawdownBps == 0 || maxDrawdownBps >= 10_000) revert InvalidDrawdown();
        if (epochDurationSecs == 0) revert InvalidDuration();

        epochId = nextEpochId++;
        d.currentEpochId = epochId;
        d.startingBond = bondAmount;
        d.bondAmount = bondAmount;
        d.maxDrawdownBps = maxDrawdownBps;
        d.epochStartTs = block.timestamp;
        d.epochEndTs = block.timestamp + epochDurationSecs;
        d.currentEquity = bondAmount;
        d.status = EpochStatus.Active;

        require(usdc.transferFrom(msg.sender, address(this), bondAmount), "USDC transfer failed");
        emit EpochStarted(tokenId, epochId, bondAmount, maxDrawdownBps, d.epochEndTs);
    }

    /// @notice Push a fresh equity reading. Only TradeAttestation may call.
    function recordEquityUpdate(uint256 tokenId, uint256 newEquity) external {
        if (msg.sender != tradeAttestation) revert OnlyTradeAttestation();
        StrategyData storage d = _data[tokenId];
        if (d.status != EpochStatus.Active) revert EpochNotActive();
        d.currentEquity = newEquity;
        emit EquityUpdated(tokenId, d.currentEpochId, newEquity);
    }

    /// @notice Anyone can call once equity ≤ breach threshold. Halts the epoch.
    /// @dev Idempotent — second call reverts NotInBreachState.
    function markBreach(uint256 tokenId) external {
        StrategyData storage d = _data[tokenId];
        if (d.status != EpochStatus.Active) revert EpochNotActive();
        uint256 threshold = _breachThreshold(d);
        if (d.currentEquity > threshold) revert NotInBreachState();
        d.status = EpochStatus.Breached;
        emit BreachMarked(tokenId, d.currentEpochId, d.currentEquity, threshold);
    }

    /// @notice Settle the epoch. Callable after epochEndTs (success path) or after
    ///         breach (failure path).
    ///         Breach path: bond → claims (capped by bond), residual → pool LPs.
    ///                      Trader gets ZERO. Bond is fully at risk on breach.
    ///         Success path: bond → trader. Premium stays in pool as LP yield.
    function settleEpoch(uint256 tokenId) external nonReentrant {
        StrategyData storage d = _data[tokenId];
        bool isBreached = d.status == EpochStatus.Breached;
        bool isExpired = d.status == EpochStatus.Active && block.timestamp >= d.epochEndTs;
        if (!isBreached && !isExpired) revert EpochNotEndedOrBreached();

        uint256 epochId = d.currentEpochId;
        // Auto-promote to Breached if we crossed threshold without an explicit markBreach
        // (handles the case where epoch expired AND was below threshold at last update).
        if (!isBreached && d.currentEquity <= _breachThreshold(d)) {
            d.status = EpochStatus.Breached;
            isBreached = true;
            emit BreachMarked(tokenId, epochId, d.currentEquity, _breachThreshold(d));
        }

        IInsurancePool pool = IInsurancePool(insurancePool);
        uint256[] memory policyIds = pool.policiesFor(tokenId, epochId);
        uint256 toAllocators = 0;

        if (isBreached) {
            // Breach path — pull collateral for each policy, then sweep residual to LPs
            for (uint256 i = 0; i < policyIds.length; i++) {
                toAllocators += pool.settleClaim(policyIds[i]);
            }
            uint256 residual = d.bondAmount; // whatever bond is left after pool pulls
            address tokenOwner = _ownerOf(tokenId);
            d.bondAmount = 0;
            d.status = EpochStatus.Settled;
            if (residual > 0) {
                require(usdc.transfer(insurancePool, residual), "Residual to pool failed");
                pool.absorbResidual(residual);
            }
            emit EpochSettled(tokenId, epochId, toAllocators, 0);
            tokenOwner; // silence unused — trader receives nothing on breach
        } else {
            // Success path — expire all policies, return full bond to trader
            for (uint256 i = 0; i < policyIds.length; i++) {
                pool.expirePolicy(policyIds[i]);
            }
            uint256 toTrader = d.bondAmount;
            address tokenOwner = _ownerOf(tokenId);
            d.bondAmount = 0;
            d.status = EpochStatus.Settled;
            if (toTrader > 0) {
                require(usdc.transfer(tokenOwner, toTrader), "Trader payout failed");
            }
            emit EpochSettled(tokenId, epochId, 0, toTrader);
        }

        // Allow re-bond on next epoch by returning to Idle
        d.status = EpochStatus.Idle;
        d.currentEpochId = 0;
        d.startingBond = 0;
        d.maxDrawdownBps = 0;
        d.epochStartTs = 0;
        d.epochEndTs = 0;
        d.currentEquity = 0;
    }

    // ─────────────────────────── Pool callbacks ───────────────────────────

    /// @notice Called by InsurancePool during settleEpoch's claim phase.
    /// @dev Transfers up to `amount` USDC from this token's bond to the pool, which
    ///      forwards it to the policy beneficiary. Returns actual amount sent.
    function pullCollateralForClaim(uint256 tokenId, uint256 amount) external returns (uint256 sent) {
        if (msg.sender != insurancePool) revert OnlyInsurancePool();
        StrategyData storage d = _data[tokenId];
        // Allowed during settleEpoch — status is Breached at that point.
        if (d.status != EpochStatus.Breached) revert NotInBreachState();
        sent = amount > d.bondAmount ? d.bondAmount : amount;
        if (sent > 0) {
            d.bondAmount -= sent;
            require(usdc.transfer(insurancePool, sent), "Pull collateral failed");
        }
    }

    // ─────────────────────────── Views ───────────────────────────

    function getData(uint256 tokenId) external view returns (StrategyData memory) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        return _data[tokenId];
    }

    function breachThreshold(uint256 tokenId) external view returns (uint256) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        return _breachThreshold(_data[tokenId]);
    }

    function isInBreach(uint256 tokenId) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        StrategyData storage d = _data[tokenId];
        if (d.status != EpochStatus.Active) return d.status == EpochStatus.Breached;
        return d.currentEquity <= _breachThreshold(d);
    }

    function metadataHashOf(uint256 tokenId) external view returns (bytes32) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();
        return _data[tokenId].metadataHash;
    }

    // ─────────────────────────── Internal ───────────────────────────

    function _breachThreshold(StrategyData storage d) internal view returns (uint256) {
        // threshold = startingBond * (10000 - maxDrawdownBps) / 10000
        // startingBond is locked at startEpoch and never mutated, so this is
        // safe to read at any point during the epoch lifecycle (even mid-settle
        // when bondAmount is being drained by pool pulls).
        return (d.startingBond * (10_000 - d.maxDrawdownBps)) / 10_000;
    }
}

/// @notice Minimal interface to InsurancePool to break circular import.
interface IInsurancePool {
    function policiesFor(uint256 strategyId, uint256 epochId) external view returns (uint256[] memory);
    function settleClaim(uint256 policyId) external returns (uint256 paidOut);
    function expirePolicy(uint256 policyId) external;
    function absorbResidual(uint256 amount) external;
}
