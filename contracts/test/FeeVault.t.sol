// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FeeVault} from "../src/FeeVault.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FeeVaultTest is Test {
    FeeVault public vault;
    MockERC20 public token;
    MockERC20 public usdg;

    address internal owner = address(0x0AA0);
    address internal payer = address(0xBEEF);

    function setUp() public {
        usdg = new MockERC20();
        vault = new FeeVault(owner, address(usdg));
        token = new MockERC20();
        token.mint(payer, 100 ether);

        vm.prank(payer);
        token.approve(address(vault), type(uint256).max);
    }

    function test_Constructor_SetsPreferredAsset() public view {
        assertEq(vault.preferredAsset(), address(usdg));
    }

    function test_Constructor_RevertsOnZeroPreferredAsset() public {
        vm.expectRevert(FeeVault.ZeroAddress.selector);
        new FeeVault(owner, address(0));
    }

    function test_PayFee_TransfersTokensAndStoresReceipt() public {
        bytes32 workHash = keccak256("work");

        vm.prank(payer);
        bytes32 receiptHash = vault.payFee(address(token), 1 ether, workHash);

        (address recPayer, address recAsset, uint256 recAmount, bytes32 recWorkHash,) = vault.receipts(receiptHash);
        assertEq(recPayer, payer);
        assertEq(recAsset, address(token));
        assertEq(recAmount, 1 ether);
        assertEq(recWorkHash, workHash);
        assertEq(token.balanceOf(address(vault)), 1 ether);
        assertEq(token.balanceOf(payer), 99 ether);
    }

    function test_PayFee_RevertsOnZeroAmount() public {
        vm.prank(payer);
        vm.expectRevert(FeeVault.ZeroAmount.selector);
        vault.payFee(address(token), 0, keccak256("work"));
    }

    function test_PayFee_ProducesUniqueReceiptsForRepeatedPayments() public {
        vm.startPrank(payer);
        bytes32 r1 = vault.payFee(address(token), 1 ether, keccak256("work"));
        bytes32 r2 = vault.payFee(address(token), 1 ether, keccak256("work"));
        vm.stopPrank();

        assertTrue(r1 != r2);
    }

    function test_Withdraw_OnlyOwner() public {
        vm.prank(payer);
        vault.payFee(address(token), 1 ether, keccak256("work"));

        vm.prank(owner);
        vault.withdraw(address(token), owner, 1 ether);
        assertEq(token.balanceOf(owner), 1 ether);
    }

    function test_Withdraw_RevertsForNonOwner() public {
        vm.prank(payer);
        vault.payFee(address(token), 1 ether, keccak256("work"));

        vm.prank(payer);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, payer));
        vault.withdraw(address(token), payer, 1 ether);
    }
}
