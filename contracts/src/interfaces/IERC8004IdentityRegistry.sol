// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC8004IdentityRegistry
/// @notice Interface for the ERC-8004 trustless agent identity registry.
/// @dev Modeled on the ERC-8004 draft's Identity Registry: agents register
///      once and get back a stable numeric id tied to their controller address
///      and an off-chain metadata URI (agent card).
interface IERC8004IdentityRegistry {
    event AgentRegistered(uint256 indexed agentId, address indexed controller, string agentCardURI);

    function registerAgent(string calldata agentCardURI) external returns (uint256 agentId);

    function agentIdOf(address controller) external view returns (uint256 agentId);

    function controllerOf(uint256 agentId) external view returns (address controller);
}
