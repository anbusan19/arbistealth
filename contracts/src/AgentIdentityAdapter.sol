// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC8004IdentityRegistry} from "./interfaces/IERC8004IdentityRegistry.sol";
import {IERC8004ReputationRegistry} from "./interfaces/IERC8004ReputationRegistry.sol";
import {IERC8004ValidationRegistry} from "./interfaces/IERC8004ValidationRegistry.sol";

/// @title AgentIdentityAdapter
/// @notice Reads and writes against the ERC-8004 Identity, Reputation, and
///         Validation registries on behalf of the ArbiStealth protocol.
/// @dev An agent must hold a registered ERC-8004 identity before the
///      settlement router will execute trades on its behalf. Reputation
///      entries are only accepted alongside a real x402 payment receipt hash,
///      so an agent's track record is backed by settled fees, not self-reports.
///      `recordSettlement` is restricted to the SettlementRouter: without that
///      restriction, anyone could submit a fabricated receipt hash and inflate
///      an agent's reputation without ever paying a real fee.
contract AgentIdentityAdapter is Ownable {
    IERC8004IdentityRegistry public immutable identityRegistry;
    IERC8004ReputationRegistry public immutable reputationRegistry;
    IERC8004ValidationRegistry public immutable validationRegistry;

    /// @notice The only address permitted to record reputation entries.
    ///         Set once by the owner after the SettlementRouter is deployed,
    ///         since the router's constructor requires this adapter's address.
    address public router;

    event RouterSet(address indexed router);

    error AgentNotRegistered();
    error OnlyRouter();

    constructor(
        address _identityRegistry,
        address _reputationRegistry,
        address _validationRegistry,
        address initialOwner
    ) Ownable(initialOwner) {
        identityRegistry = IERC8004IdentityRegistry(_identityRegistry);
        reputationRegistry = IERC8004ReputationRegistry(_reputationRegistry);
        validationRegistry = IERC8004ValidationRegistry(_validationRegistry);
    }

    /// @notice Wires up the SettlementRouter allowed to record reputation entries.
    function setRouter(address _router) external onlyOwner {
        router = _router;
        emit RouterSet(_router);
    }

    /// @notice True if `controller` has a registered ERC-8004 agent identity.
    function isRegisteredAgent(address controller) public view returns (bool) {
        return identityRegistry.agentIdOf(controller) != 0;
    }

    /// @notice Returns the agent id for `controller`, reverting if unregistered.
    function requireAgentId(address controller) external view returns (uint256 agentId) {
        agentId = identityRegistry.agentIdOf(controller);
        if (agentId == 0) revert AgentNotRegistered();
    }

    /// @notice Records a reputation entry for an agent, backed by the x402
    ///         receipt hash of the fee it paid to settle `workHash`. Callable
    ///         only by the SettlementRouter, which has already verified the
    ///         receipt came from a real FeeVault payment.
    function recordSettlement(uint256 agentId, bytes32 receiptHash, bytes32 workHash) external {
        if (msg.sender != router) revert OnlyRouter();
        reputationRegistry.submitReputationEntry(agentId, receiptHash, workHash);
    }

    /// @notice Requests third-party validation of a settled trade.
    function requestValidation(uint256 agentId, bytes32 workHash) external {
        validationRegistry.requestValidation(agentId, workHash);
    }
}
