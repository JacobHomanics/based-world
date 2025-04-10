//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/Alignment.sol";
import "../contracts/AlignmentManager.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./DeployHelpers.s.sol";

contract DeployYourContract is ScaffoldETHDeploy {
    // use `deployer` from `ScaffoldETHDeploy`
    function run() external ScaffoldEthDeployerRunner {
        address admin = 0xCbEbcc04B4A5fA18089695AB357fD149c7862Cce;

        (, address _deployer, ) = vm.readCallers();

        AlignmentManager alignmentManager = new AlignmentManager(
            _deployer,
            0.00086 ether
        );

        Alignment alignment = new Alignment(address(alignmentManager));

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
