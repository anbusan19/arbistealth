// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC5564Announcer} from "../../src/interfaces/IERC5564Announcer.sol";

contract MockERC5564Announcer is IERC5564Announcer {
    function announce(uint256 schemeId, address stealthAddress, bytes memory ephemeralPubKey, bytes memory metadata)
        external
    {
        emit Announcement(schemeId, stealthAddress, msg.sender, ephemeralPubKey, metadata);
    }
}
