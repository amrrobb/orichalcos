// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal Pyth interface — vendored from @pythnetwork/pyth-sdk-solidity
/// @dev Only the functions Orichalcos needs are included here.
interface IPyth {
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    /// @notice Returns the price IF it's not older than `age` seconds, otherwise reverts.
    /// @param id Pyth price feed id (e.g. BTC/USD)
    /// @param age maximum age in seconds
    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (Price memory);

    /// @notice Returns the most recent price for `id`, regardless of staleness.
    function getPriceUnsafe(bytes32 id) external view returns (Price memory);

    /// @notice Update fee for `updateData`.
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint256);

    /// @notice Submit price updates from Hermes / off-chain.
    function updatePriceFeeds(bytes[] calldata updateData) external payable;
}
