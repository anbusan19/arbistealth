// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC6538Registry
/// @notice Interface for the canonical ERC-6538 stealth meta-address registry.
interface IERC6538Registry {
    event StealthMetaAddressSet(address indexed registrant, uint256 indexed schemeId, bytes stealthMetaAddress);

    function stealthMetaAddressOf(address registrant, uint256 schemeId) external view returns (bytes memory);

    function registerKeys(uint256 schemeId, bytes memory stealthMetaAddress) external;

    function registerKeysOnBehalf(
        address registrant,
        uint256 schemeId,
        bytes memory signature,
        bytes memory stealthMetaAddress
    ) external;
}
