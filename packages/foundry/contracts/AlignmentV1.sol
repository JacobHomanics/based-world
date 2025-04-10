//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AlignmentV1 is AccessControl {
    mapping(address entity => mapping(address user => bool isAligned)) s_isUserAlignedToLocation;

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function addAlignment(
        address entity,
        address user
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        s_isUserAlignedToLocation[entity][user] = true;
    }

    function removeAlignment(
        address entity,
        address user
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        s_isUserAlignedToLocation[entity][user] = false;
    }

    function getUserAlignmentWithEntity(
        address entity,
        address user
    ) external view returns (bool isAligned) {
        isAligned = s_isUserAlignedToLocation[entity][user];
    }
}
