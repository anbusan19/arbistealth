// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC6538Registry} from "../../src/interfaces/IERC6538Registry.sol";

contract MockERC6538Registry is IERC6538Registry {
    mapping(address => mapping(uint256 => bytes)) internal _metaAddresses;

    function stealthMetaAddressOf(address registrant, uint256 schemeId) external view returns (bytes memory) {
        return _metaAddresses[registrant][schemeId];
    }

    function registerKeys(uint256 schemeId, bytes memory stealthMetaAddress) external {
        _metaAddresses[msg.sender][schemeId] = stealthMetaAddress;
        emit StealthMetaAddressSet(msg.sender, schemeId, stealthMetaAddress);
    }

    function registerKeysOnBehalf(
        address registrant,
        uint256 schemeId,
        bytes memory, /* signature */
        bytes memory stealthMetaAddress
    ) external {
        _metaAddresses[registrant][schemeId] = stealthMetaAddress;
        emit StealthMetaAddressSet(registrant, schemeId, stealthMetaAddress);
    }
}
