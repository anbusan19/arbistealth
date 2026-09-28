// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC5564Announcer
/// @notice Interface for the canonical ERC-5564 stealth address announcer.
interface IERC5564Announcer {
    event Announcement(
        uint256 indexed schemeId,
        address indexed stealthAddress,
        address indexed caller,
        bytes ephemeralPubKey,
        bytes metadata
    );

    function announce(uint256 schemeId, address stealthAddress, bytes memory ephemeralPubKey, bytes memory metadata)
        external;
}
