//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Alignment.sol";

contract AlignmentManager is AccessControl {
    error NotEnoughEther();

    Alignment s_alignment;
    uint256 s_alignmentCost;
    mapping(address entity => uint256 alignmentScore) s_alignmentScore;
    mapping(address user => address[] locations) s_userAlignments;

    function getUserAlignments(
        address user
    ) external view returns (address[] memory) {
        return s_userAlignments[user];
    }

    constructor(address admin, uint256 alignmentCost) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        s_alignmentCost = alignmentCost;
    }

    function setAlignmentContract(
        address alignmentContract
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        s_alignment = Alignment(alignmentContract);
    }

    function addAlignment(address entity) external payable {
        if (msg.value < s_alignmentCost) {
            revert NotEnoughEther();
        }

        s_alignmentScore[entity]++;
        s_alignment.addAlignment(entity, msg.sender);
        s_userAlignments[msg.sender].push(entity);
    }

    function getIsUserAligned(
        address user
    ) external view returns (bool isAligned) {
        isAligned = s_userAlignments[user].length > 0;
    }

    function removeAlignment(address entity) external payable {
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

        s_alignmentScore[entity]--;
        s_alignment.removeAlignment(entity, msg.sender);
    }

    function getEntityAlignmentScore(
        address location
    ) external view returns (uint256) {
        return s_alignmentScore[location];
    }

    function setAlignmentCost(
        uint256 newCost
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        s_alignmentCost = newCost;
    }

    function getAlignmentCost() external view returns (uint256 cost) {
        cost = s_alignmentCost;
    }

    function getUserAlignmentWithEntity(
        address entity,
        address user
    ) external view returns (bool isAligned) {
        isAligned = s_alignment.getUserAlignmentWithEntity(entity, user);
    }

    function withdraw(
        address _to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        (bool sent, ) = _to.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }
}
