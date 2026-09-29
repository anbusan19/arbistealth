// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC8004ReputationRegistry} from "./interfaces/IERC8004ReputationRegistry.sol";

/// @title SimpleAgentReputationRegistry
/// @notice ArbiStealth's own implementation of IERC8004ReputationRegistry.
///         See SimpleAgentIdentityRegistry's NatSpec for why this isn't the
///         canonical ERC-8004 registry.
/// @dev Restricted to a single authorized adapter, the same way FeeVault's
///      reputation writes were restricted at the AgentIdentityAdapter layer:
///      without this, anyone could call submitReputationEntry directly on
///      this registry with a fabricated receipt hash, bypassing the
///      adapter's check that the receipt came from a real FeeVault payment.
contract SimpleAgentReputationRegistry is IERC8004ReputationRegistry, Ownable {
    /// @notice The only address permitted to submit reputation entries.
    address public adapter;

    mapping(uint256 agentId => uint256 count) private _entryCountOf;

    event AdapterSet(address indexed adapter);

    error OnlyAdapter();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Wires up the AgentIdentityAdapter allowed to submit entries.
    function setAdapter(address _adapter) external onlyOwner {
        adapter = _adapter;
        emit AdapterSet(_adapter);
    }

    function submitReputationEntry(uint256 agentId, bytes32 receiptHash, bytes32 workHash) external {
        if (msg.sender != adapter) revert OnlyAdapter();

        _entryCountOf[agentId] += 1;
        emit ReputationEntrySubmitted(agentId, receiptHash, workHash);
    }

    function entryCountOf(uint256 agentId) external view returns (uint256) {
        return _entryCountOf[agentId];
    }
}
