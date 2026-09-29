// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SimpleAgentIdentityRegistry} from "../src/SimpleAgentIdentityRegistry.sol";
import {SimpleAgentReputationRegistry} from "../src/SimpleAgentReputationRegistry.sol";
import {SimpleAgentValidationRegistry} from "../src/SimpleAgentValidationRegistry.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleAgentIdentityRegistryTest is Test {
    SimpleAgentIdentityRegistry public registry;
    address internal agent = address(0xA6E47);

    function setUp() public {
        registry = new SimpleAgentIdentityRegistry();
    }

    function test_RegisterAgent_RevertsOnSecondRegistration() public {
        vm.startPrank(agent);
        registry.registerAgent("ipfs://first");

        vm.expectRevert(SimpleAgentIdentityRegistry.AlreadyRegistered.selector);
        registry.registerAgent("ipfs://second");
        vm.stopPrank();
    }

    function test_RegisterAgent_AssignsSequentialIds() public {
        vm.prank(address(0x1));
        uint256 id1 = registry.registerAgent("ipfs://one");
        vm.prank(address(0x2));
        uint256 id2 = registry.registerAgent("ipfs://two");

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(registry.controllerOf(id1), address(0x1));
        assertEq(registry.controllerOf(id2), address(0x2));
    }
}

contract SimpleAgentReputationRegistryTest is Test {
    SimpleAgentReputationRegistry public registry;
    address internal owner = address(0x0AA0);
    address internal adapter = address(0xADA9);

    function setUp() public {
        registry = new SimpleAgentReputationRegistry(owner);
        vm.prank(owner);
        registry.setAdapter(adapter);
    }

    function test_SubmitReputationEntry_RevertsForNonAdapter() public {
        vm.expectRevert(SimpleAgentReputationRegistry.OnlyAdapter.selector);
        registry.submitReputationEntry(1, keccak256("receipt"), keccak256("work"));
    }

    function test_SubmitReputationEntry_SucceedsForAdapter() public {
        vm.prank(adapter);
        registry.submitReputationEntry(1, keccak256("receipt"), keccak256("work"));

        assertEq(registry.entryCountOf(1), 1);
    }

    function test_SetAdapter_RevertsForNonOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        registry.setAdapter(address(0x1234));
    }
}

contract SimpleAgentValidationRegistryTest is Test {
    SimpleAgentValidationRegistry public registry;

    event ValidationRequested(uint256 indexed agentId, bytes32 indexed workHash, address indexed requester);

    function setUp() public {
        registry = new SimpleAgentValidationRegistry();
    }

    function test_RequestValidation_EmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit ValidationRequested(1, keccak256("work"), address(this));

        registry.requestValidation(1, keccak256("work"));
    }
}
