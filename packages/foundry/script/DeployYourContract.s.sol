//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/YourContract.sol";
import "../contracts/YourContractManager.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./DeployHelpers.s.sol";

contract DeployYourContract is ScaffoldETHDeploy {
    // use `deployer` from `ScaffoldETHDeploy`
    function run() external ScaffoldEthDeployerRunner {
        address admin = 0xCbEbcc04B4A5fA18089695AB357fD149c7862Cce;

        (, address _deployer, ) = vm.readCallers();

        YourContractManager yourContractManager = new YourContractManager(
            _deployer,
            .1 ether
        );

        YourContract yourContract = new YourContract(
            address(yourContractManager)
        );

        yourContractManager.setYourContract(address(yourContract));

        yourContractManager.grantRole(0x00, admin);
        yourContractManager.revokeRole(0x00, _deployer);

        console.logString(
            string.concat(
                "YourContract deployed at: ",
                vm.toString(address(yourContract))
            )
        );
    }
}
