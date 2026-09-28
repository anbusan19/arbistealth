// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC6538Registry} from "./interfaces/IERC6538Registry.sol";

/// @title StealthMetaRegistryAdapter
/// @notice Thin read wrapper around the canonical ERC-6538 stealth meta-address
///         registry, adding a registration check used by the settlement router
///         before it derives a stealth output address for a user.
/// @dev Registration itself is msg.sender-scoped on the canonical registry, so
///      users register their keys directly against `registry`, not through this
///      adapter, and query registration status here.
contract StealthMetaRegistryAdapter {
    IERC6538Registry public immutable registry;

    constructor(address _registry) {
        registry = IERC6538Registry(_registry);
    }

    /// @notice Returns the registrant's stealth meta-address for a given scheme,
    ///         or empty bytes if they have not registered one.
    function metaAddressOf(address registrant, uint256 schemeId) public view returns (bytes memory) {
        return registry.stealthMetaAddressOf(registrant, schemeId);
    }

    /// @notice True if the registrant has a stealth meta-address registered for the scheme.
    function isRegistered(address registrant, uint256 schemeId) external view returns (bool) {
        return metaAddressOf(registrant, schemeId).length != 0;
    }
}
