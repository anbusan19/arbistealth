// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title FeeVault
/// @notice Holds and distributes routing fees, settled through an x402-style
///         pull payment: the payer approves the vault, then pays a fee tied
///         to a specific piece of settled work. Each payment produces a
///         receipt hash that can be attached to an agent's ERC-8004
///         reputation entry as proof the fee was actually paid on-chain.
contract FeeVault is Ownable {
    using SafeERC20 for IERC20;

    struct Receipt {
        address payer;
        address asset;
        uint256 amount;
        bytes32 workHash;
        uint256 timestamp;
    }

    /// @notice Receipt data keyed by receipt hash, for on-chain lookup/verification.
    mapping(bytes32 receiptHash => Receipt) public receipts;

    /// @notice Monotonic counter used to guarantee receipt hash uniqueness
    ///         even for repeated (payer, asset, amount, workHash) tuples.
    uint256 public receiptNonce;

    event FeePaid(
        bytes32 indexed receiptHash, address indexed payer, address indexed asset, uint256 amount, bytes32 workHash
    );

    event FeesWithdrawn(address indexed asset, address indexed to, uint256 amount);

    error ZeroAmount();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Pays a routing/execution fee in `asset`, tied to `workHash`
    ///         (e.g. the settled intent hash). Requires the caller to have
    ///         approved this contract for at least `amount` beforehand.
    /// @return receiptHash A unique reference to this payment, suitable for
    ///         attaching to an agent's reputation entry.
    function payFee(address asset, uint256 amount, bytes32 workHash) external returns (bytes32 receiptHash) {
        if (amount == 0) revert ZeroAmount();

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        receiptHash = keccak256(abi.encode(msg.sender, asset, amount, workHash, block.timestamp, receiptNonce++));
        receipts[receiptHash] =
            Receipt({payer: msg.sender, asset: asset, amount: amount, workHash: workHash, timestamp: block.timestamp});

        emit FeePaid(receiptHash, msg.sender, asset, amount, workHash);
    }

    /// @notice Withdraws accumulated fees for `asset` to `to`. Owner-only.
    function withdraw(address asset, address to, uint256 amount) external onlyOwner {
        IERC20(asset).safeTransfer(to, amount);
        emit FeesWithdrawn(asset, to, amount);
    }
}
