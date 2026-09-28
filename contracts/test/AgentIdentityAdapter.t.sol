// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentIdentityAdapter} from "../src/AgentIdentityAdapter.sol";
import {
    MockERC8004IdentityRegistry,
    MockERC8004ReputationRegistry,
    MockERC8004ValidationRegistry
} from "./mocks/MockERC8004Registries.sol";

contract AgentIdentityAdapterTest is Test {
    AgentIdentityAdapter public adapter;
    MockERC8004IdentityRegistry public identityRegistry;
    MockERC8004ReputationRegistry public reputationRegistry;
    MockERC8004ValidationRegistry public validationRegistry;

    address internal agent = address(0xA6E47);

    function setUp() public {
        identityRegistry = new MockERC8004IdentityRegistry();
        reputationRegistry = new MockERC8004ReputationRegistry();
        validationRegistry = new MockERC8004ValidationRegistry();
        adapter =
            new AgentIdentityAdapter(address(identityRegistry), address(reputationRegistry), address(validationRegistry));
    }

    function test_IsRegisteredAgent_FalseBeforeRegistration() public view {
        assertFalse(adapter.isRegisteredAgent(agent));
    }

    function test_RequireAgentId_RevertsWhenUnregistered() public {
        vm.expectRevert(AgentIdentityAdapter.AgentNotRegistered.selector);
        adapter.requireAgentId(agent);
    }

    function test_RequireAgentId_ReturnsIdAfterRegistration() public {
        vm.prank(agent);
        uint256 agentId = identityRegistry.registerAgent("ipfs://agent-card");

        assertTrue(adapter.isRegisteredAgent(agent));
        assertEq(adapter.requireAgentId(agent), agentId);
    }

    function test_RecordSettlement_IncrementsReputationEntries() public {
        vm.prank(agent);
        uint256 agentId = identityRegistry.registerAgent("ipfs://agent-card");

        adapter.recordSettlement(agentId, keccak256("receipt"), keccak256("work"));

        assertEq(reputationRegistry.entryCountOf(agentId), 1);
    }
}
