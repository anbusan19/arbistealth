// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC8004ReputationRegistry
/// @notice Interface for the ERC-8004 trustless agent reputation registry.
/// @dev Modeled on the ERC-8004 draft's Reputation Registry: each entry ties
///      an agent's completed work to a real payment receipt hash rather than
///      a self-reported score, so reputation is backed by settled payments.
interface IERC8004ReputationRegistry {
    event ReputationEntrySubmitted(uint256 indexed agentId, bytes32 indexed receiptHash, bytes32 workHash);

    function submitReputationEntry(uint256 agentId, bytes32 receiptHash, bytes32 workHash) external;

    function entryCountOf(uint256 agentId) external view returns (uint256);
}
