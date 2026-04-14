// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title OrichalcosPair — Minimal constant-product AMM pool
/// @dev Uniswap V2-style x*y=k pool. Simplified for hackathon demo.
contract OrichalcosPair is ERC20 {
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint112 public reserve0;
    uint112 public reserve1;

    event Sync(uint112 reserve0, uint112 reserve1);
    event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to);
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);

    constructor(address _token0, address _token1) ERC20("Orichalcos LP", "ORI-LP") {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    function getReserves() external view returns (uint112, uint112) {
        return (reserve0, reserve1);
    }

    function addLiquidity(uint256 amount0, uint256 amount1) external returns (uint256 liquidity) {
        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);

        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = _sqrt(amount0 * amount1);
        } else {
            liquidity = _min(
                (amount0 * _totalSupply) / reserve0,
                (amount1 * _totalSupply) / reserve1
            );
        }
        require(liquidity > 0, "Insufficient liquidity minted");
        _mint(msg.sender, liquidity);

        reserve0 = uint112(token0.balanceOf(address(this)));
        reserve1 = uint112(token1.balanceOf(address(this)));
        emit Mint(msg.sender, amount0, amount1);
        emit Sync(reserve0, reserve1);
    }

    function removeLiquidity(uint256 liquidity) external returns (uint256 amount0, uint256 amount1) {
        uint256 _totalSupply = totalSupply();
        amount0 = (liquidity * reserve0) / _totalSupply;
        amount1 = (liquidity * reserve1) / _totalSupply;
        require(amount0 > 0 && amount1 > 0, "Insufficient liquidity burned");

        _burn(msg.sender, liquidity);
        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);

        reserve0 = uint112(token0.balanceOf(address(this)));
        reserve1 = uint112(token1.balanceOf(address(this)));
        emit Burn(msg.sender, amount0, amount1, msg.sender);
        emit Sync(reserve0, reserve1);
    }

    /// @notice Swap exact input amount for output. 0.3% fee.
    function swap(address tokenIn, uint256 amountIn, uint256 amountOutMin, address to) external returns (uint256 amountOut) {
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");
        require(amountIn > 0, "Zero input");

        bool isToken0 = tokenIn == address(token0);
        (IERC20 _tokenIn, IERC20 _tokenOut, uint112 _reserveIn, uint112 _reserveOut) = isToken0
            ? (token0, token1, reserve0, reserve1)
            : (token1, token0, reserve1, reserve0);

        _tokenIn.transferFrom(msg.sender, address(this), amountIn);

        // x * y = k with 0.3% fee
        uint256 amountInWithFee = amountIn * 997;
        amountOut = (amountInWithFee * _reserveOut) / (_reserveIn * 1000 + amountInWithFee);
        require(amountOut >= amountOutMin, "Slippage exceeded");
        require(amountOut > 0, "Zero output");

        _tokenOut.transfer(to, amountOut);

        reserve0 = uint112(token0.balanceOf(address(this)));
        reserve1 = uint112(token1.balanceOf(address(this)));

        emit Swap(
            msg.sender,
            isToken0 ? amountIn : 0,
            isToken0 ? 0 : amountIn,
            isToken0 ? 0 : amountOut,
            isToken0 ? amountOut : 0,
            to
        );
        emit Sync(reserve0, reserve1);
    }

    /// @notice Get expected output for a given input amount
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");
        bool isToken0 = tokenIn == address(token0);
        (uint112 _reserveIn, uint112 _reserveOut) = isToken0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);

        uint256 amountInWithFee = amountIn * 997;
        return (amountInWithFee * _reserveOut) / (_reserveIn * 1000 + amountInWithFee);
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
