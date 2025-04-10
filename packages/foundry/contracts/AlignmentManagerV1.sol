//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AlignmentV1.sol";

contract AlignmentManagerV1 is AccessControl {
    error NotEnoughEther();

    // Define role constants
    bytes32 public constant CONTRACT_MANAGER_ROLE =
        keccak256("CONTRACT_MANAGER_ROLE");
    bytes32 public constant COST_MANAGER_ROLE = keccak256("COST_MANAGER_ROLE");

    AlignmentV1 s_alignmentContract;
    uint256 s_alignmentCost;
    mapping(address entity => uint256 alignmentScore) s_alignmentScore;
    mapping(address user => address[] locations) s_userAlignments;

    constructor(
        address[] memory admins,
        address[] memory contractManagers,
        address[] memory costManagers
    ) {
        for (uint256 i = 0; i < admins.length; i++) {
            _grantRole(DEFAULT_ADMIN_ROLE, admins[i]);
        }
        for (uint256 i = 0; i < contractManagers.length; i++) {
            _grantRole(CONTRACT_MANAGER_ROLE, contractManagers[i]);
        }
        for (uint256 i = 0; i < costManagers.length; i++) {
            _grantRole(COST_MANAGER_ROLE, costManagers[i]);
        }
    }

    function setAlignmentContract(
        address alignmentContract
    ) external onlyRole(CONTRACT_MANAGER_ROLE) {
        s_alignmentContract = AlignmentV1(alignmentContract);
    }

    function setAlignmentCost(
        uint256 newCost
    ) external onlyRole(COST_MANAGER_ROLE) {
        s_alignmentCost = newCost;
    }

    function addAlignment(address entity) external payable {
        if (msg.value < s_alignmentCost) {
            revert NotEnoughEther();
        }

        s_alignmentScore[entity]++;
        s_userAlignments[msg.sender].push(entity);
        s_alignmentContract.addAlignment(entity, msg.sender);
    }

    function removeAlignment(address entity) external payable {
        s_alignmentScore[entity]--;

        address[] storage userLocations = s_userAlignments[msg.sender];
        bool found = false;
        uint256 indexToRemove;

        for (uint256 i = 0; i < userLocations.length; i++) {
            if (userLocations[i] == entity) {
                indexToRemove = i;
                found = true;
                break;
            }
        }

        if (found) {
            // Move the last element to the position we want to remove (if it's not already the last element)
            if (indexToRemove != userLocations.length - 1) {
                userLocations[indexToRemove] = userLocations[
                    userLocations.length - 1
                ];
            }
            // Remove the last element
            userLocations.pop();
        }

        s_alignmentContract.removeAlignment(entity, msg.sender);
    }

    function getIsUserAligned(
        address user
    ) external view returns (bool isAligned) {
        isAligned = s_userAlignments[user].length > 0;
    }

    function getUserAlignments(
        address user
    ) external view returns (address[] memory) {
        return s_userAlignments[user];
    }

    function getEntityAlignmentScore(
        address location
    ) external view returns (uint256) {
        return s_alignmentScore[location];
    }

    function getAlignmentContract() external view returns (address) {
        return address(s_alignmentContract);
    }

    function getAlignmentCost() external view returns (uint256 cost) {
        cost = s_alignmentCost;
    }

    function withdraw(
        address _to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        (bool sent, ) = _to.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }
}
