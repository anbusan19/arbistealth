// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StealthAnnouncerAdapter} from "../src/StealthAnnouncerAdapter.sol";
import {MockERC5564Announcer} from "./mocks/MockERC5564Announcer.sol";

contract StealthAnnouncerAdapterTest is Test {
    StealthAnnouncerAdapter public adapter;
    MockERC5564Announcer public announcer;

    event ArbiStealthAnnouncement(
        bytes32 indexed intentHash,
        uint256 schemeId,
        address indexed stealthAddress,
        bytes ephemeralPubKey,
        bytes metadata
    );

    function setUp() public {
        announcer = new MockERC5564Announcer();
        adapter = new StealthAnnouncerAdapter(address(announcer));
    }

    function test_Announce_EmitsTaggedEvent() public {
        bytes32 intentHash = keccak256("intent");
        address stealthAddress = address(0xBEEF);
        bytes memory ephemeralPubKey = hex"0102";
        bytes memory metadata = hex"03";

        vm.expectEmit(true, true, false, true);
        emit ArbiStealthAnnouncement(intentHash, 0, stealthAddress, ephemeralPubKey, metadata);

        adapter.announce(intentHash, 0, stealthAddress, ephemeralPubKey, metadata);
    }
}
