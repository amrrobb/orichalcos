// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./DeployGalileo.s.sol";

/// @title DeployAristotle — deploys v3 contract suite to 0G Aristotle mainnet
/// @notice Same as DeployGalileo. Only run AFTER Galileo demo is rock-solid.
///         The submission requires a "0G mainnet contract address," and
///         Aristotle (16661) is the 0G mainnet.
///
/// @dev Run with:
///   PRIVATE_KEY=0x... forge script script/v3/DeployAristotle.s.sol \
///     --rpc-url https://evmrpc.0g.ai \
///     --broadcast \
///     --legacy
contract DeployAristotle is DeployGalileo {
    // No overrides needed — DeployGalileo's run() is generic.
    // We inherit so the deploy artifact path is named clearly in broadcast/ dir.
}
