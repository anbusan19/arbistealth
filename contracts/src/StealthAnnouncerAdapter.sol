// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC5564Announcer} from "./interfaces/IERC5564Announcer.sol";

/// @title StealthAnnouncerAdapter
/// @notice Thin wrapper around the canonical ERC-5564 announcer that tags
///         announcements with the ArbiStealth intent they settle, so a user
///         scanning for output can correlate it back to the intent they signed.
contract StealthAnnouncerAdapter {
    IERC5564Announcer public immutable announcer;

    event ArbiStealthAnnouncement(
        bytes32 indexed intentHash,
        uint256 schemeId,
        address indexed stealthAddress,
        bytes ephemeralPubKey,
        bytes metadata
    );

    constructor(address _announcer) {
        announcer = IERC5564Announcer(_announcer);
    }

    /// @notice Emits a canonical ERC-5564 announcement and a protocol-tagged
    ///         announcement referencing the settled intent.
    function announce(
        bytes32 intentHash,
        uint256 schemeId,
        address stealthAddress,
        bytes calldata ephemeralPubKey,
        bytes calldata metadata
    ) external {
        announcer.announce(schemeId, stealthAddress, ephemeralPubKey, metadata);
        emit ArbiStealthAnnouncement(intentHash, schemeId, stealthAddress, ephemeralPubKey, metadata);
    }
}
