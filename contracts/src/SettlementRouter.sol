// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IntentRegistry} from "./IntentRegistry.sol";
import {StealthMetaRegistryAdapter} from "./StealthMetaRegistryAdapter.sol";
import {StealthAnnouncerAdapter} from "./StealthAnnouncerAdapter.sol";
import {AgentIdentityAdapter} from "./AgentIdentityAdapter.sol";
import {FeeVault} from "./FeeVault.sol";

/// @title SettlementRouter
/// @notice The core trust boundary of ArbiStealth: validates a user's signed
///         intent, executes the matched trade against the settling agent's
///         liquidity, sends output to a stealth address with an on-chain
///         announcement, and records the routing fee as an ERC-8004
///         reputation entry for the agent. This is the primary target for a
///         security review before any Arbitrum One deployment.
contract SettlementRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IntentRegistry public immutable intentRegistry;
    StealthMetaRegistryAdapter public immutable stealthMetaRegistry;
    StealthAnnouncerAdapter public immutable stealthAnnouncer;
    AgentIdentityAdapter public immutable agentIdentity;
    FeeVault public immutable feeVault;

    /// @notice Scheme id used for stealth meta-address lookups (1 = secp256k1, per ERC-5564).
    uint256 public constant STEALTH_SCHEME_ID = 1;

    struct SettlementParams {
        IntentRegistry.Intent intent;
        bytes signature;
        uint256 amountOut;
        address stealthAddress;
        bytes ephemeralPubKey;
        bytes viewTag;
        address feeAsset;
        uint256 feeAmount;
    }

    event SettlementExecuted(
        bytes32 indexed intentHash,
        uint256 indexed agentId,
        address indexed user,
        address stealthAddress,
        uint256 amountIn,
        uint256 amountOut,
        bytes32 receiptHash
    );

    error InsufficientOutput();
    error RecipientNotRegistered();

    constructor(
        address _intentRegistry,
        address _stealthMetaRegistry,
        address _stealthAnnouncer,
        address _agentIdentity,
        address _feeVault
    ) {
        intentRegistry = IntentRegistry(_intentRegistry);
        stealthMetaRegistry = StealthMetaRegistryAdapter(_stealthMetaRegistry);
        stealthAnnouncer = StealthAnnouncerAdapter(_stealthAnnouncer);
        agentIdentity = AgentIdentityAdapter(_agentIdentity);
        feeVault = FeeVault(_feeVault);
    }

    /// @notice Executes a matched trade for a signed user intent.
    /// @dev Caller must be a registered ERC-8004 agent. The agent supplies the
    ///      output token and receives the input token, i.e. it acts as the
    ///      trade's counterparty. The user must have approved this contract
    ///      to pull `intent.amountIn` of `intent.tokenIn`, and the agent must
    ///      have approved it to pull `amountOut` of `intent.tokenOut` plus
    ///      `feeAmount` of `feeAsset`.
    function executeSettlement(SettlementParams calldata params) external nonReentrant {
        uint256 agentId = agentIdentity.requireAgentId(msg.sender);

        if (params.amountOut < params.intent.minAmountOut) revert InsufficientOutput();
        if (!stealthMetaRegistry.isRegistered(params.intent.user, STEALTH_SCHEME_ID)) {
            revert RecipientNotRegistered();
        }

        bytes32 intentHash = intentRegistry.submitIntent(params.intent, params.signature);

        IERC20(params.intent.tokenIn).safeTransferFrom(params.intent.user, msg.sender, params.intent.amountIn);
        IERC20(params.intent.tokenOut).safeTransferFrom(msg.sender, params.stealthAddress, params.amountOut);

        stealthAnnouncer.announce(
            intentHash, STEALTH_SCHEME_ID, params.stealthAddress, params.ephemeralPubKey, params.viewTag
        );

        bytes32 receiptHash;
        if (params.feeAmount > 0) {
            IERC20(params.feeAsset).safeTransferFrom(msg.sender, address(this), params.feeAmount);
            IERC20(params.feeAsset).forceApprove(address(feeVault), params.feeAmount);
            receiptHash = feeVault.payFee(params.feeAsset, params.feeAmount, intentHash);
            agentIdentity.recordSettlement(agentId, receiptHash, intentHash);
        }

        emit SettlementExecuted(
            intentHash,
            agentId,
            params.intent.user,
            params.stealthAddress,
            params.intent.amountIn,
            params.amountOut,
            receiptHash
        );
    }
}
