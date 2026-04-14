// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title OrichalcosINFT — Simplified ERC-7857 Intelligent NFT
/// @dev Represents an AI trading agent as an on-chain NFT with
///      encrypted metadata stored on 0G Storage (referenced by data hashes).
///      Simplified from full ERC-7857: no transfer proofs, no oracle/verifier.
contract OrichalcosINFT is ERC721 {
    struct IntelligentData {
        string dataDescription;
        bytes32 dataHash; // 0G Storage Merkle root
    }

    uint256 private _nextTokenId;

    // tokenId => data hashes (each pointing to 0G Storage)
    mapping(uint256 => bytes32[]) private _dataHashes;
    mapping(uint256 => string[]) private _dataDescriptions;

    event AgentMinted(uint256 indexed tokenId, address indexed owner, bytes32[] dataHashes, string[] dataDescriptions);
    event DataUpdated(uint256 indexed tokenId, bytes32[] oldHashes, bytes32[] newHashes);

    constructor() ERC721("Orichalcos Agent", "ORIAG") {}

    function mint(
        address to,
        bytes32[] memory dataHashes,
        string[] memory dataDescriptions
    ) external returns (uint256 tokenId) {
        require(dataHashes.length == dataDescriptions.length, "Length mismatch");

        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        for (uint256 i = 0; i < dataHashes.length; i++) {
            _dataHashes[tokenId].push(dataHashes[i]);
            _dataDescriptions[tokenId].push(dataDescriptions[i]);
        }

        emit AgentMinted(tokenId, to, dataHashes, dataDescriptions);
    }

    function updateData(uint256 tokenId, bytes32[] calldata newDataHashes) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(newDataHashes.length == _dataDescriptions[tokenId].length, "Length mismatch");

        bytes32[] memory oldHashes = _dataHashes[tokenId];
        _dataHashes[tokenId] = newDataHashes;

        emit DataUpdated(tokenId, oldHashes, newDataHashes);
    }

    /// @notice ERC-7857 compatible view
    function intelligentDataOf(uint256 tokenId) external view returns (IntelligentData[] memory) {
        require(tokenId < _nextTokenId, "Token does not exist");
        bytes32[] storage hashes = _dataHashes[tokenId];
        string[] storage descriptions = _dataDescriptions[tokenId];

        IntelligentData[] memory data = new IntelligentData[](hashes.length);
        for (uint256 i = 0; i < hashes.length; i++) {
            data[i] = IntelligentData({
                dataDescription: descriptions[i],
                dataHash: hashes[i]
            });
        }
        return data;
    }

    function dataHashesOf(uint256 tokenId) external view returns (bytes32[] memory) {
        return _dataHashes[tokenId];
    }

    function dataDescriptionsOf(uint256 tokenId) external view returns (string[] memory) {
        return _dataDescriptions[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
