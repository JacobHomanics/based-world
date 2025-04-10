//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/AlignmentV1.sol";
import "../contracts/AlignmentManagerV1.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./DeployHelpers.s.sol";

contract DeployYourContract is ScaffoldETHDeploy {
    // use `deployer` from `ScaffoldETHDeploy`
    function run() external ScaffoldEthDeployerRunner {
        // Get the chain ID to determine which network we're on
        uint256 chainId = block.chainid;
        address admin;

        // Set admin address based on the network
        if (chainId == 8453) {
            // Base Mainnet
            admin = 0xc0f0E1512D6A0A77ff7b9C172405D1B0d73565Bf;
        } else if (chainId == 84531) {
            // Base Sepolia (testnet)
            admin = 0xc0f0E1512D6A0A77ff7b9C172405D1B0d73565Bf; // You can change this to a different testnet address
        } else {
            // Local development chain or other networks
            admin = 0xCbEbcc04B4A5fA18089695AB357fD149c7862Cce; // Default anvil account
        }

        // Log which network and admin we're using
        console.logString(
            string.concat("Deploying on chain ID: ", vm.toString(chainId))
        );
        console.logString(
            string.concat("Using admin address: ", vm.toString(admin))
        );

        (, address _deployer, ) = vm.readCallers();

        AlignmentManagerV1 alignmentManager = new AlignmentManagerV1(
            _deployer,
            0.00086 ether
        );

        AlignmentV1 alignment = new AlignmentV1(address(alignmentManager));

        alignmentManager.setAlignmentContract(address(alignment));

        alignmentManager.grantRole(0x00, admin);
        alignmentManager.revokeRole(0x00, _deployer);

        console.logString(
            string.concat(
                "Alignment deployed at: ",
                vm.toString(address(alignment))
            )
        );

        console.logString(
            string.concat(
                "AlignmentManager deployed at: ",
                vm.toString(address(alignmentManager))
            )
        );
    }
}
