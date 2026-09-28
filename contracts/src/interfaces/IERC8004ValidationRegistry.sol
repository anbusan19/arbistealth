// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC8004ValidationRegistry
/// @notice Interface for the ERC-8004 trustless agent validation registry.
/// @dev Modeled on the ERC-8004 draft's Validation Registry: any party can
///      request that a piece of an agent's work be validated, referenced by
///      its work hash.
interface IERC8004ValidationRegistry {
    event ValidationRequested(uint256 indexed agentId, bytes32 indexed workHash, address indexed requester);

    function requestValidation(uint256 agentId, bytes32 workHash) external;
}
