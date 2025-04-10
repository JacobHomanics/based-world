//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./YourContract.sol";

contract YourContractManager is AccessControl {
    error NotEnoughEther();

    YourContract s_yourContract;
    uint256 s_alignmentCost;
    mapping(address location => uint256 alignmentScore) s_locationAlignmentScore;
    mapping(address user => address[] locations) s_userLocations;

    function getUserLocations(
        address user
    ) external view returns (address[] memory) {
        return s_userLocations[user];
    }

    constructor(address admin, uint256 alignmentCost) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        s_alignmentCost = alignmentCost;
    }

    function setYourContract(
        address yourContract
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        s_yourContract = YourContract(yourContract);
    }

    function addAlignment(address country) external payable {
        if (msg.value < s_alignmentCost) {
            revert NotEnoughEther();
        }

        s_locationAlignmentScore[country]++;
        s_yourContract.addAlignment(country, msg.sender);
        s_userLocations[msg.sender].push(country);
    }

    function getIsUserAligned(
        address user
    ) external view returns (bool isAligned) {
        isAligned = s_userLocations[user].length > 0;
    }

    function removeAlignment(address country) external payable {
        address[] storage userLocations = s_userLocations[msg.sender];
        bool found = false;
        uint256 indexToRemove;

        for (uint256 i = 0; i < userLocations.length; i++) {
            if (userLocations[i] == country) {
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

        s_locationAlignmentScore[country]--;
        s_yourContract.removeAlignment(country, msg.sender);
    }

    function getLocationAlignmentScore(
        address location
    ) external view returns (uint256) {
        return s_locationAlignmentScore[location];
    }

    function withdraw(
        address _to
    ) external payable onlyRole(DEFAULT_ADMIN_ROLE) {
        (bool sent, ) = _to.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
    }

    function getAlignmentCost() external view returns (uint256 cost) {
        cost = s_alignmentCost;
    }

    function getUserAlignmentWithCountry(
        address country,
        address user
    ) external view returns (bool isAligned) {
        isAligned = s_yourContract.getUserAlignmentWithCountry(country, user);
    }
}
