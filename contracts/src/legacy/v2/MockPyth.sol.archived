// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IPyth.sol";

/// @title MockPyth — IPyth stub for 0G Galileo testnet
/// @dev Used because Pyth is not deployed on Galileo (16602). Identical interface
///      to mainnet Pyth (16661) so deploy script is the only thing that changes.
///
///      Tests and the off-chain agent runner can call setPrice() to control the
///      oracle. On mainnet this contract is replaced by the real Pyth deployment
///      at 0x2880aB155794e7179c9eE2e38200202908C17B43.
contract MockPyth is IPyth {
    address public immutable owner;
    mapping(bytes32 => Price) private _prices;

    event PriceSet(bytes32 indexed id, int64 price, int32 expo, uint256 publishTime);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Test/agent-only: set the price for a feed id.
    function setPrice(bytes32 id, int64 price, uint64 conf, int32 expo) external {
        require(msg.sender == owner, "Only owner");
        _prices[id] = Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: block.timestamp
        });
        emit PriceSet(id, price, expo, block.timestamp);
    }

    /// @notice Test/agent-only: set price with a custom publishTime (for stale-price tests).
    function setPriceWithTime(bytes32 id, int64 price, uint64 conf, int32 expo, uint256 publishTime) external {
        require(msg.sender == owner, "Only owner");
        _prices[id] = Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: publishTime
        });
        emit PriceSet(id, price, expo, publishTime);
    }

    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (Price memory p) {
        p = _prices[id];
        require(p.publishTime != 0, "Price not set");
        require(block.timestamp <= p.publishTime + age, "Price too old");
    }

    function getPriceUnsafe(bytes32 id) external view returns (Price memory) {
        return _prices[id];
    }

    function getUpdateFee(bytes[] calldata) external pure returns (uint256) {
        return 0;
    }

    function updatePriceFeeds(bytes[] calldata) external payable {
        // No-op on mock. Real Pyth ingests Hermes attestations here.
    }
}
