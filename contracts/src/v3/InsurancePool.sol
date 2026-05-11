// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./StrategyINFT.sol";

/// @title InsurancePool — Protocol-owned premium aggregator for Orichalcos v3
/// @notice Allocators (third parties, NOT the strategy trader) buy policies that pay out
///         from the strategy's bonded collateral if the strategy breaches its drawdown.
///         LPs deposit USDC, earn premium yield, and bear ZERO principal risk in v3
///         (bond ≥ max claim is enforced at policy issue time). v3.1 = LP underwriting
///         where bond < claim is allowed and LPs absorb the tail.
///
///         Three flows:
///          1. LP deposit/withdraw — pure share accounting against premium yield
///          2. Allocator buyPolicy — premium goes to pool, policy bound to (strategy, epoch)
///          3. Settlement (called by StrategyINFT.settleEpoch):
///             - On breach: settleClaim(policyId) routes bond → allocator
///             - On success: expirePolicy(policyId) leaves premium as LP yield
contract InsurancePool {
    enum PolicyStatus { Active, Claimed, Expired }

    struct Policy {
        uint256 strategyId;
        uint256 epochId;          // matches StrategyINFT.currentEpochId at issue time
        address allocator;        // beneficiary on breach
        uint256 premium;          // already paid in
        uint256 maxClaim;         // payout cap
        PolicyStatus status;
    }

    IERC20 public immutable usdc;
    StrategyINFT public immutable strategyINFT;
    address public immutable owner;

    // Premium pricing — v3 uses fixed BPS of maxClaim. v3.1 = risk oracle.
    uint16 public premiumBps = 1250; // 12.5% premium for protection

    // LP share accounting (ERC-4626-lite, no transferable shares for v3)
    uint256 public totalShares;
    uint256 public totalAssets;   // USDC backing LP shares (premium income that wasn't claimed)
    mapping(address => uint256) public lpShares;

    // Policies
    mapping(uint256 => Policy) public policies;
    uint256 public nextPolicyId = 1;

    // Track allocated coverage per (strategyId, epochId) so we can enforce
    // sum(maxClaim) ≤ bondAmount of that epoch
    mapping(uint256 => mapping(uint256 => uint256)) public allocatedCoverage;
    // strategyId → epochId → list of active policy IDs (for settle iteration)
    mapping(uint256 => mapping(uint256 => uint256[])) public policiesByEpoch;

    event Deposited(address indexed lp, uint256 assets, uint256 sharesMinted);
    event Withdrawn(address indexed lp, uint256 sharesBurned, uint256 assetsOut);
    event PolicyBought(uint256 indexed policyId, uint256 indexed strategyId, uint256 indexed epochId, address allocator, uint256 premium, uint256 maxClaim);
    event PolicyClaimed(uint256 indexed policyId, address indexed allocator, uint256 paidOut);
    event PolicyExpired(uint256 indexed policyId, uint256 premiumKept);
    event PremiumBpsUpdated(uint16 oldBps, uint16 newBps);

    error OnlyOwner();
    error OnlyStrategyINFT();
    error AllocatorIsTrader();
    error EpochNotActive();
    error CoverageExceedsBond();
    error InvalidAmount();
    error InvalidPolicy();
    error NoSharesToWithdraw();

    constructor(address _usdc, address _strategyINFT) {
        usdc = IERC20(_usdc);
        strategyINFT = StrategyINFT(_strategyINFT);
        owner = msg.sender;
    }

    // ─────────────────────────── Admin ───────────────────────────

    function setPremiumBps(uint16 newBps) external {
        if (msg.sender != owner) revert OnlyOwner();
        require(newBps > 0 && newBps <= 5_000, "premiumBps out of range"); // hard cap 50%
        emit PremiumBpsUpdated(premiumBps, newBps);
        premiumBps = newBps;
    }

    // ─────────────────────────── LP side ───────────────────────────

    /// @notice Deposit USDC into the protocol pool. Mints shares pro-rata against totalAssets.
    function deposit(uint256 assets) external returns (uint256 shares) {
        if (assets == 0) revert InvalidAmount();
        // Bootstrap: first depositor gets 1:1 shares
        shares = totalShares == 0 ? assets : (assets * totalShares) / totalAssets;
        totalShares += shares;
        totalAssets += assets;
        lpShares[msg.sender] += shares;
        require(usdc.transferFrom(msg.sender, address(this), assets), "USDC transfer failed");
        emit Deposited(msg.sender, assets, shares);
    }

    /// @notice Burn shares, withdraw USDC pro-rata. Premium yield only — no claim risk in v3.
    function withdraw(uint256 shares) external returns (uint256 assets) {
        if (shares == 0) revert InvalidAmount();
        if (lpShares[msg.sender] < shares) revert NoSharesToWithdraw();
        assets = (shares * totalAssets) / totalShares;
        totalShares -= shares;
        totalAssets -= assets;
        lpShares[msg.sender] -= shares;
        require(usdc.transfer(msg.sender, assets), "USDC transfer failed");
        emit Withdrawn(msg.sender, shares, assets);
    }

    // ─────────────────────────── Allocator side ───────────────────────────

    /// @notice Buy a policy on a Strategy Agent's current epoch. Pulls premium from msg.sender.
    /// @dev Reverts if msg.sender is the strategy's owner (no self-insurance).
    ///      Reverts if sum(allocatedCoverage) + maxClaim > bondAmount.
    ///      Premium = (maxClaim * premiumBps) / 10000.
    function buyPolicy(uint256 strategyId, uint256 maxClaim) external returns (uint256 policyId) {
        if (maxClaim == 0) revert InvalidAmount();

        StrategyINFT.StrategyData memory sd = strategyINFT.getData(strategyId);
        if (sd.status != StrategyINFT.EpochStatus.Active) revert EpochNotActive();
        if (strategyINFT.ownerOf(strategyId) == msg.sender) revert AllocatorIsTrader();

        uint256 epochId = sd.currentEpochId;
        uint256 alreadyAllocated = allocatedCoverage[strategyId][epochId];
        if (alreadyAllocated + maxClaim > sd.bondAmount) revert CoverageExceedsBond();

        uint256 premium = premiumFor(maxClaim);
        policyId = nextPolicyId++;
        policies[policyId] = Policy({
            strategyId: strategyId,
            epochId: epochId,
            allocator: msg.sender,
            premium: premium,
            maxClaim: maxClaim,
            status: PolicyStatus.Active
        });
        allocatedCoverage[strategyId][epochId] = alreadyAllocated + maxClaim;
        policiesByEpoch[strategyId][epochId].push(policyId);

        // Premium goes into pool as LP yield (totalAssets), realized at success.
        // We hold it now; on claim it remains LP yield (claim is funded from bond).
        require(usdc.transferFrom(msg.sender, address(this), premium), "Premium transfer failed");
        totalAssets += premium;

        emit PolicyBought(policyId, strategyId, epochId, msg.sender, premium, maxClaim);
    }

    // ─────────────────────────── Settlement (called by StrategyINFT) ───────────────────────────

    /// @notice Settle a single policy on epoch breach. Pulls collateral from the strategy
    ///         vault and pays the allocator.
    /// @dev Only StrategyINFT can call, only during its settleEpoch flow.
    function settleClaim(uint256 policyId) external returns (uint256 paidOut) {
        if (msg.sender != address(strategyINFT)) revert OnlyStrategyINFT();
        Policy storage p = policies[policyId];
        if (p.status != PolicyStatus.Active) revert InvalidPolicy();

        // Pull up to maxClaim from the strategy's bond. The strategy may have
        // less left than maxClaim if multiple policies share a thinning bond.
        paidOut = strategyINFT.pullCollateralForClaim(p.strategyId, p.maxClaim);
        p.status = PolicyStatus.Claimed;

        if (paidOut > 0) {
            require(usdc.transfer(p.allocator, paidOut), "Claim payout failed");
        }
        emit PolicyClaimed(policyId, p.allocator, paidOut);
    }

    /// @notice Mark a policy expired on epoch success. Premium stays in pool as LP yield.
    function expirePolicy(uint256 policyId) external {
        if (msg.sender != address(strategyINFT)) revert OnlyStrategyINFT();
        Policy storage p = policies[policyId];
        if (p.status != PolicyStatus.Active) revert InvalidPolicy();
        p.status = PolicyStatus.Expired;
        emit PolicyExpired(policyId, p.premium);
    }

    // ─────────────────────────── Views ───────────────────────────

    function premiumFor(uint256 maxClaim) public view returns (uint256) {
        return (maxClaim * premiumBps) / 10_000;
    }

    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }

    function policiesFor(uint256 strategyId, uint256 epochId) external view returns (uint256[] memory) {
        return policiesByEpoch[strategyId][epochId];
    }

    function lpAssetValue(address lp) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (lpShares[lp] * totalAssets) / totalShares;
    }
}
