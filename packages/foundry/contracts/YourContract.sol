//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract YourContract is AccessControl {
    mapping(address location => mapping(address user => bool isAligned)) s_isUserAlignedToLocation;

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function addAlignment(
        address country,
        address user
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        s_isUserAlignedToLocation[country][user] = true;
    }

    function removeAlignment(
        address country,
        address user
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        s_isUserAlignedToLocation[country][user] = false;
    }

    function getUserAlignmentWithCountry(
        address country,
        address user
    ) external view returns (bool isAligned) {
        isAligned = s_isUserAlignedToLocation[country][user];
    }
}
