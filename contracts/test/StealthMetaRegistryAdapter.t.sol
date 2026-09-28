// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StealthMetaRegistryAdapter} from "../src/StealthMetaRegistryAdapter.sol";
import {MockERC6538Registry} from "./mocks/MockERC6538Registry.sol";

contract StealthMetaRegistryAdapterTest is Test {
    StealthMetaRegistryAdapter public adapter;
    MockERC6538Registry public registry;

    address internal user = address(0xCAFE);

    function setUp() public {
        registry = new MockERC6538Registry();
        adapter = new StealthMetaRegistryAdapter(address(registry));
    }

    function test_IsRegistered_FalseByDefault() public view {
        assertFalse(adapter.isRegistered(user, 0));
    }

    function test_RegisterKeys_ThenIsRegisteredTrue() public {
        // Registration is msg.sender-scoped on the canonical registry, so the
        // user registers directly against it, not through the adapter.
        vm.prank(user);
        registry.registerKeys(0, hex"aabbcc");

        assertTrue(adapter.isRegistered(user, 0));
        assertEq(adapter.metaAddressOf(user, 0), hex"aabbcc");
    }
}
