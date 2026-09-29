// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC8004IdentityRegistry} from "./interfaces/IERC8004IdentityRegistry.sol";

/// @title SimpleAgentIdentityRegistry
/// @notice ArbiStealth's own implementation of the IERC8004IdentityRegistry
///         interface.
/// @dev The canonical ERC-8004 standard is still an actively evolving draft
///      (its Validation Registry sub-spec has no deployed instance on any
///      chain as of this writing, and its Identity/Reputation registries use
///      a considerably more complex ERC-721 + feedback model), so ArbiStealth
///      operates its own registry against this simpler interface rather than
///      depending on an external contract that could change incompatibly.
///      Swapping in the canonical registry later only requires redeploying
///      AgentIdentityAdapter against it — existing agents would need to
///      re-register there, since the two are independent identity spaces.
contract SimpleAgentIdentityRegistry is IERC8004IdentityRegistry {
    uint256 private nextAgentId = 1;
    mapping(address controller => uint256 agentId) private _agentIdOf;
    mapping(uint256 agentId => address controller) private _controllerOf;

    error AlreadyRegistered();

    /// @notice Registers the caller as an agent. Each address may register once.
    function registerAgent(string calldata agentCardURI) external returns (uint256 agentId) {
        if (_agentIdOf[msg.sender] != 0) revert AlreadyRegistered();

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
