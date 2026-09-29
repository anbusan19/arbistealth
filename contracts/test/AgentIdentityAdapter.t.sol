// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentIdentityAdapter} from "../src/AgentIdentityAdapter.sol";
import {SimpleAgentIdentityRegistry} from "../src/SimpleAgentIdentityRegistry.sol";
import {SimpleAgentReputationRegistry} from "../src/SimpleAgentReputationRegistry.sol";
import {SimpleAgentValidationRegistry} from "../src/SimpleAgentValidationRegistry.sol";

contract AgentIdentityAdapterTest is Test {
    AgentIdentityAdapter public adapter;
    SimpleAgentIdentityRegistry public identityRegistry;
    SimpleAgentReputationRegistry public reputationRegistry;
    SimpleAgentValidationRegistry public validationRegistry;

    address internal agent = address(0xA6E47);
    address internal router = address(0x1234);

    function setUp() public {
        identityRegistry = new SimpleAgentIdentityRegistry();
        reputationRegistry = new SimpleAgentReputationRegistry(address(this));
        validationRegistry = new SimpleAgentValidationRegistry();
        adapter = new AgentIdentityAdapter(
            address(identityRegistry), address(reputationRegistry), address(validationRegistry), address(this)
        );
        adapter.setRouter(router);
        reputationRegistry.setAdapter(address(adapter));
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

        vm.prank(router);
        adapter.recordSettlement(agentId, keccak256("receipt"), keccak256("work"));

        assertEq(reputationRegistry.entryCountOf(agentId), 1);
    }

    function test_RecordSettlement_RevertsWhenNotRouter() public {
        vm.prank(agent);
        uint256 agentId = identityRegistry.registerAgent("ipfs://agent-card");

        vm.expectRevert(AgentIdentityAdapter.OnlyRouter.selector);
        adapter.recordSettlement(agentId, keccak256("receipt"), keccak256("work"));
    }
}
