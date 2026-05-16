// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Demo-grade simulated yield. Yield is minted from a deployer-seeded
///         reserve, not earned from a real protocol. Not production code.
///
/// @dev Shape: USDC-denominated, 1:1 shares/assets (yield is added directly
///      to the user's balance — no share-price drift). 8% APR accrued
///      linearly per block since the user's last interaction. When the
///      seeded reserve is depleted, accrual returns 0 and users get
///      principal back only.

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockYieldVault {
    IERC20 public immutable asset;            // USDC (6-dec)
    uint16 public constant APY_BPS = 800;     // 8.00% APR
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    /// @notice Principal + accrued yield held for each user (USDC, 6-dec).
    ///         Shares are 1:1 with assets in this demo vault.
    mapping(address => uint256) public balances;

    /// @notice Last time the user's accrual was settled.
    mapping(address => uint256) public lastAccrualTs;

    /// @notice Pool of USDC the deployer pre-funded to back simulated yield.
    ///         Decreases as yield is minted into user balances.
    uint256 public reserve;

    event Seeded(address indexed by, uint256 amount, uint256 newReserve);
    event Deposited(address indexed user, uint256 assets);
    event Withdrawn(address indexed user, uint256 assets);
    event YieldAccrued(address indexed user, uint256 amount, uint256 newReserve);

    error InvalidAmount();
    error InsufficientBalance();
    error TransferFailed();

    constructor(address _asset) {
        asset = IERC20(_asset);
    }

    /// @notice Deployer (anyone, for demo) pre-funds the yield reserve.
    ///         Caller must have approved this contract for `amount`.
    function seed(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        bool ok = asset.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        reserve += amount;
        emit Seeded(msg.sender, amount, reserve);
    }

    /// @notice Pull `assets` USDC from the caller into the vault. Accrues
    ///         any pending yield first so the deposit doesn't reset the
    ///         clock unfairly.
    function deposit(uint256 assets) external returns (uint256 shares) {
        if (assets == 0) revert InvalidAmount();
        _accrue(msg.sender);
        bool ok = asset.transferFrom(msg.sender, address(this), assets);
        if (!ok) revert TransferFailed();
        balances[msg.sender] += assets;
        lastAccrualTs[msg.sender] = block.timestamp;
        emit Deposited(msg.sender, assets);
        return assets; // 1:1
    }

    /// @notice Burn `shares` and send the underlying USDC back to the caller.
    ///         Accrues first so the user gets their accrued yield in the same tx.
    function withdraw(uint256 shares) external returns (uint256 assets) {
        if (shares == 0) revert InvalidAmount();
        _accrue(msg.sender);
        uint256 bal = balances[msg.sender];
        if (shares > bal) revert InsufficientBalance();
        balances[msg.sender] = bal - shares;
        lastAccrualTs[msg.sender] = block.timestamp;
        bool ok = asset.transfer(msg.sender, shares);
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, shares);
        return shares;
    }

    /// @notice Total USDC sitting in the vault (user principal + accrued + remaining reserve).
    function totalAssets() external view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    /// @notice Shares held by `user` (1:1 USDC-denominated). Does NOT include
    ///         un-accrued yield since the user's last interaction —
    ///         use `previewYield` for that.
    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }

    /// @notice Accrued-but-not-yet-realised yield for `user`. Capped at the
    ///         remaining reserve so it never lies about what withdraw will pay.
    function previewYield(address user) external view returns (uint256) {
        return _pendingYield(user);
    }

    /// @notice 800 = 8.00% APR. Constant for the demo.
    function apyBps() external pure returns (uint16) {
        return APY_BPS;
    }

    // ─── internal ────────────────────────────────────────────────────

    function _pendingYield(address user) internal view returns (uint256) {
        uint256 bal = balances[user];
        if (bal == 0) return 0;
        uint256 last = lastAccrualTs[user];
        if (last == 0 || block.timestamp <= last) return 0;
        uint256 elapsed = block.timestamp - last;
        uint256 raw = (bal * APY_BPS * elapsed) / (10_000 * SECONDS_PER_YEAR);
        if (raw > reserve) return reserve;
        return raw;
    }

    function _accrue(address user) internal {
        uint256 y = _pendingYield(user);
        if (y > 0) {
            balances[user] += y;
            reserve -= y;
            emit YieldAccrued(user, y, reserve);
        }
        lastAccrualTs[user] = block.timestamp;
    }
}
