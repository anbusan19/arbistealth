// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title DemoToken
/// @notice Unrestricted-mint ERC20 used only to seed a real settlement on
///         Arbitrum Sepolia for demo purposes. `mint` has no access control,
///         so this contract must never be deployed to Arbitrum One — on
///         mainnet, tokenIn/tokenOut are real assets the user and agent
///         already hold, not supply conjured by a script.
contract DemoToken is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
