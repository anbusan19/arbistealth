// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC8004IdentityRegistry} from "../../src/interfaces/IERC8004IdentityRegistry.sol";
import {IERC8004ReputationRegistry} from "../../src/interfaces/IERC8004ReputationRegistry.sol";
import {IERC8004ValidationRegistry} from "../../src/interfaces/IERC8004ValidationRegistry.sol";

contract MockERC8004IdentityRegistry is IERC8004IdentityRegistry {
    uint256 internal nextAgentId = 1;
    mapping(address => uint256) internal _agentIdOf;
    mapping(uint256 => address) internal _controllerOf;

    function registerAgent(string calldata agentCardURI) external returns (uint256 agentId) {
        agentId = nextAgentId++;
        _agentIdOf[msg.sender] = agentId;
        _controllerOf[agentId] = msg.sender;
        emit AgentRegistered(agentId, msg.sender, agentCardURI);
    }

    function agentIdOf(address controller) external view returns (uint256) {
        return _agentIdOf[controller];
    }

    function controllerOf(uint256 agentId) external view returns (address) {
        return _controllerOf[agentId];
    }
}

contract MockERC8004ReputationRegistry is IERC8004ReputationRegistry {
    mapping(uint256 => uint256) internal _entryCountOf;

    function submitReputationEntry(uint256 agentId, bytes32 receiptHash, bytes32 workHash) external {
        _entryCountOf[agentId] += 1;
        emit ReputationEntrySubmitted(agentId, receiptHash, workHash);
    }

    function entryCountOf(uint256 agentId) external view returns (uint256) {
        return _entryCountOf[agentId];
    }
}

contract MockERC8004ValidationRegistry is IERC8004ValidationRegistry {
    function requestValidation(uint256 agentId, bytes32 workHash) external {
        emit ValidationRequested(agentId, workHash, msg.sender);
    }
}
