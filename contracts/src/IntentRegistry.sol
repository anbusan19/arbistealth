// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title IntentRegistry
/// @notice Stores and validates signed user trade intents for the ArbiStealth protocol.
///         Enforces per-user nonce replay protection and intent expiry.
contract IntentRegistry is EIP712 {
    using ECDSA for bytes32;

    struct Intent {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 nonce;
        uint256 expiry;
    }

    bytes32 private constant INTENT_TYPEHASH = keccak256(
        "Intent(address user,address tokenIn,address tokenOut,uint256 amountIn,uint256 minAmountOut,uint256 nonce,uint256 expiry)"
    );

    /// @notice Tracks used nonces per user to prevent intent replay.
    mapping(address user => mapping(uint256 nonce => bool used)) public usedNonces;

    event IntentSubmitted(
        address indexed user,
        bytes32 indexed intentHash,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 nonce,
        uint256 expiry
    );

    error IntentExpired();
    error NonceAlreadyUsed();
    error InvalidSignature();
    error ZeroAmount();

    constructor() EIP712("ArbiStealthIntentRegistry", "1") {}

    /// @notice Validates a signed intent and marks its nonce as used. Reverts on any failure.
    /// @dev Callable by anyone submitting on the user's behalf (e.g. the relayer or the agent),
    ///      since validity rests entirely on the user's signature, not the caller's identity.
    function submitIntent(Intent calldata intent, bytes calldata signature) external returns (bytes32 intentHash) {
        if (intent.amountIn == 0) revert ZeroAmount();
        if (block.timestamp > intent.expiry) revert IntentExpired();
        if (usedNonces[intent.user][intent.nonce]) revert NonceAlreadyUsed();

        intentHash = hashIntent(intent);
        address signer = intentHash.recover(signature);
        if (signer != intent.user) revert InvalidSignature();

        usedNonces[intent.user][intent.nonce] = true;

        emit IntentSubmitted(
            intent.user,
            intentHash,
            intent.tokenIn,
            intent.tokenOut,
            intent.amountIn,
            intent.minAmountOut,
            intent.nonce,
            intent.expiry
        );
    }

    /// @notice Returns the EIP-712 digest a user must sign to authorize an intent.
    function hashIntent(Intent calldata intent) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                INTENT_TYPEHASH,
                intent.user,
                intent.tokenIn,
                intent.tokenOut,
                intent.amountIn,
                intent.minAmountOut,
                intent.nonce,
                intent.expiry
            )
        );
        return _hashTypedDataV4(structHash);
    }
}
