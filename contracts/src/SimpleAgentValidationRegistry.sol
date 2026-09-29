// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC8004ValidationRegistry} from "./interfaces/IERC8004ValidationRegistry.sol";

/// @title SimpleAgentValidationRegistry
/// @notice ArbiStealth's own implementation of IERC8004ValidationRegistry.
///         See SimpleAgentIdentityRegistry's NatSpec for why this isn't the
///         canonical ERC-8004 registry — fittingly, the real Validation
///         Registry sub-spec has no deployed instance on any chain yet
///         either, since it's still under active discussion in the standard.
/// @dev Left open to any caller, matching ERC-8004's semantics that any party
///      may request validation of an agent's work; this only records a
///      request, it doesn't write authoritative reputation data.
contract SimpleAgentValidationRegistry is IERC8004ValidationRegistry {
    function requestValidation(uint256 agentId, bytes32 workHash) external {
        emit ValidationRequested(agentId, workHash, msg.sender);
    }
}
