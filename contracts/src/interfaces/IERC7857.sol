// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice ERC-7857 — Intelligent NFTs
/// @dev INFTs bind a transferable identity to a piece of intelligence (an AI agent's
///      sealed soul, system prompt, or model weights). The `Updated` event is the
///      core spec hook — every state change to the agent's intelligence MUST emit it.
interface IERC7857 {
    /// @notice Emitted whenever the intelligence bound to a token changes.
    /// @param tokenId The INFT being updated.
    /// @param oldHash The previous metadataHash (or sealedSoulRoot).
    /// @param newHash The new metadataHash (or sealedSoulRoot).
    /// @param updatedBy Address that performed the update (e.g. Codex contract).
    event Updated(uint256 indexed tokenId, bytes32 oldHash, bytes32 newHash, address indexed updatedBy);

    /// @notice Returns the current intelligence-binding hash for `tokenId`.
    function metadataHashOf(uint256 tokenId) external view returns (bytes32);
}
