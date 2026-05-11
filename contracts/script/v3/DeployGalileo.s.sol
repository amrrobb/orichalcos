// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../../src/v3/StrategyINFT.sol";
import "../../src/v3/InsurancePool.sol";
import "../../src/v3/TradeAttestation.sol";
import "../../src/legacy/tokens/MockUSDC.sol";

/// @title DeployGalileo — deploys v3 contract suite to 0G Galileo testnet
/// @notice Deploys MockUSDC + StrategyINFT + InsurancePool + TradeAttestation,
///         wires set-once addresses, then mints USDC to demo actors so the
///         frontend has something to interact with on first load.
///
/// @dev Run with:
///   PRIVATE_KEY=0x... forge script script/v3/DeployGalileo.s.sol \
///     --rpc-url https://evmrpc-testnet.0g.ai \
///     --broadcast \
///     --legacy
contract DeployGalileo is Script {
    // Demo actor addresses — funded with test USDC so frontend can demo flows.
    // Trader is the deployer (same EOA), allocators + LPs are deterministic test addrs.
    // Checksummed deterministic test addresses (vanity for clarity in chainscan)
    address constant ALLOCATOR_A = 0x000000000000000000000000000000000000bEEF;
    address constant ALLOCATOR_B = 0x000000000000000000000000000000000000BEe9;
    address constant LP1         = 0x000000000000000000000000000000000000c0DE;
    address constant LP2         = 0x000000000000000000000000000000000000C0d3;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        // 1. MockUSDC (already exists in legacy/tokens; redeploy fresh for clean state)
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed:", address(usdc));

        // 2. StrategyINFT
        StrategyINFT strategy = new StrategyINFT(address(usdc));
        console.log("StrategyINFT deployed:", address(strategy));

        // 3. InsurancePool
        InsurancePool pool = new InsurancePool(address(usdc), address(strategy));
        console.log("InsurancePool deployed:", address(pool));

        // 4. TradeAttestation
        TradeAttestation attestation = new TradeAttestation(address(strategy));
        console.log("TradeAttestation deployed:", address(attestation));

        // 5. Wire set-once addresses
        strategy.setTradeAttestation(address(attestation));
        strategy.setInsurancePool(address(pool));
        // Operator = deployer for v3 demo (the agent runner uses this key)
        attestation.setOperator(deployer);
        console.log("Wired: tradeAttestation, insurancePool, operator");

        // 6. Fund demo actors
        usdc.mint(deployer,    50_000e6);  // trader (deployer)
        usdc.mint(ALLOCATOR_A, 10_000e6);
        usdc.mint(ALLOCATOR_B, 10_000e6);
        usdc.mint(LP1,         20_000e6);
        usdc.mint(LP2,         20_000e6);
        console.log("Minted USDC to deployer + allocators + LPs");

        vm.stopBroadcast();

        // Summary handled by the deploy-summary helper to avoid stack-too-deep
        _printSummary(deployer, address(usdc), address(strategy), address(pool), address(attestation));
    }

    function _printSummary(
        address deployer,
        address usdc,
        address strategy,
        address pool,
        address attestation
    ) internal view {
        console.log("===== DEPLOYMENT SUMMARY =====");
        console.log("Network: 0G Galileo (16602)");
        console.log("Deployer:        ", deployer);
        console.log("MockUSDC:        ", usdc);
        console.log("StrategyINFT:    ", strategy);
        console.log("InsurancePool:   ", pool);
        console.log("TradeAttestation:", attestation);
        console.log("AllocA (10K):    ", ALLOCATOR_A);
        console.log("AllocB (10K):    ", ALLOCATOR_B);
        console.log("LP1 (20K):       ", LP1);
        console.log("LP2 (20K):       ", LP2);
    }
}
