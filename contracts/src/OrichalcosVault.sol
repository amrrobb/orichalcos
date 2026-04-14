// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./dex/OrichalcosPair.sol";

/// @title OrichalcosVault — TEE-attested autonomous trading vault
/// @dev Holds user deposits. Only the designated agent can execute trades.
///      Each trade is linked to a TEE attestation stored on 0G Storage.
contract OrichalcosVault {
    using SafeERC20 for IERC20;

    struct Trade {
        bytes32 tradeId;
        uint256 timestamp;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        bytes32 attestationRoot; // 0G Storage Merkle root
    }

    address public immutable owner;
    address public agent;
    OrichalcosPair public immutable pair;
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    Trade[] public trades;
    mapping(bytes32 => bytes32) public tradeAttestations; // tradeId => attestationRoot

    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event TradeExecuted(bytes32 indexed tradeId, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event AttestationRegistered(bytes32 indexed tradeId, bytes32 attestationRoot);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == agent, "Only agent");
        _;
    }

    constructor(address _pair, address _agent) {
        owner = msg.sender;
        agent = _agent;
        pair = OrichalcosPair(_pair);
        token0 = pair.token0();
        token1 = pair.token1();
    }

    function deposit(address token, uint256 amount) external {
        require(token == address(token0) || token == address(token1), "Invalid token");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external onlyOwner {
        require(token == address(token0) || token == address(token1), "Invalid token");
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, token, amount);
    }

    function executeTrade(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin
    ) external onlyAgent returns (bytes32 tradeId, uint256 amountOut) {
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");
        address tokenOut = tokenIn == address(token0) ? address(token1) : address(token0);

        // Approve pair to spend vault's tokens
        IERC20(tokenIn).approve(address(pair), amountIn);

        // Execute swap — output sent back to vault
        amountOut = pair.swap(tokenIn, amountIn, amountOutMin, address(this));

        // Record trade
        tradeId = keccak256(abi.encodePacked(block.timestamp, tokenIn, amountIn, trades.length));
        trades.push(Trade({
            tradeId: tradeId,
            timestamp: block.timestamp,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            attestationRoot: bytes32(0) // Set later via registerAttestation
        }));

        emit TradeExecuted(tradeId, tokenIn, tokenOut, amountIn, amountOut);
    }

    function registerAttestation(bytes32 tradeId, bytes32 attestationRoot) external onlyAgent {
        require(tradeAttestations[tradeId] == bytes32(0), "Attestation already registered");
        tradeAttestations[tradeId] = attestationRoot;

        // Update the trade record too
        for (uint256 i = 0; i < trades.length; i++) {
            if (trades[i].tradeId == tradeId) {
                trades[i].attestationRoot = attestationRoot;
                break;
            }
        }

        emit AttestationRegistered(tradeId, attestationRoot);
    }

    function setAgent(address _agent) external onlyOwner {
        emit AgentUpdated(agent, _agent);
        agent = _agent;
    }

    // View functions
    function getTradeCount() external view returns (uint256) {
        return trades.length;
    }

    function getTrade(uint256 index) external view returns (Trade memory) {
        return trades[index];
    }

    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getReserves() external view returns (uint112, uint112) {
        return pair.getReserves();
    }
}
