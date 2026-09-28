// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IntentRegistry} from "../src/IntentRegistry.sol";

contract IntentRegistryTest is Test {
    IntentRegistry public registry;

    uint256 internal userPrivateKey = 0xA11CE;
    address internal user;

    address internal constant TOKEN_IN = address(0x1111);
    address internal constant TOKEN_OUT = address(0x2222);

    function setUp() public {
        registry = new IntentRegistry();
        user = vm.addr(userPrivateKey);
    }

    function _buildIntent(uint256 nonce, uint256 expiry) internal view returns (IntentRegistry.Intent memory) {
        return IntentRegistry.Intent({
            user: user,
            tokenIn: TOKEN_IN,
            tokenOut: TOKEN_OUT,
            amountIn: 1 ether,
            minAmountOut: 0.9 ether,
            nonce: nonce,
            expiry: expiry
        });
    }

    function _sign(IntentRegistry.Intent memory intent) internal view returns (bytes memory) {
        bytes32 digest = registry.hashIntent(intent);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_SubmitIntent_Succeeds() public {
        IntentRegistry.Intent memory intent = _buildIntent(0, block.timestamp + 1 hours);
        bytes memory sig = _sign(intent);

        bytes32 intentHash = registry.submitIntent(intent, sig);

        assertEq(intentHash, registry.hashIntent(intent));
        assertTrue(registry.usedNonces(user, 0));
    }

    function test_SubmitIntent_RevertsOnReplay() public {
        IntentRegistry.Intent memory intent = _buildIntent(0, block.timestamp + 1 hours);
        bytes memory sig = _sign(intent);

        registry.submitIntent(intent, sig);

        vm.expectRevert(IntentRegistry.NonceAlreadyUsed.selector);
        registry.submitIntent(intent, sig);
    }

    function test_SubmitIntent_RevertsOnExpiry() public {
        IntentRegistry.Intent memory intent = _buildIntent(0, block.timestamp);
        bytes memory sig = _sign(intent);

        vm.warp(block.timestamp + 1);

        vm.expectRevert(IntentRegistry.IntentExpired.selector);
        registry.submitIntent(intent, sig);
    }

    function test_SubmitIntent_RevertsOnBadSignature() public {
        IntentRegistry.Intent memory intent = _buildIntent(0, block.timestamp + 1 hours);

        uint256 wrongKey = 0xB0B;
        bytes32 digest = registry.hashIntent(intent);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, digest);
        bytes memory badSig = abi.encodePacked(r, s, v);

        vm.expectRevert(IntentRegistry.InvalidSignature.selector);
        registry.submitIntent(intent, badSig);
    }

    function test_SubmitIntent_RevertsOnZeroAmount() public {
        IntentRegistry.Intent memory intent = _buildIntent(0, block.timestamp + 1 hours);
        intent.amountIn = 0;
        bytes memory sig = _sign(intent);

        vm.expectRevert(IntentRegistry.ZeroAmount.selector);
        registry.submitIntent(intent, sig);
    }

    function test_SubmitIntent_AllowsIndependentNonces() public {
        IntentRegistry.Intent memory intent0 = _buildIntent(0, block.timestamp + 1 hours);
        IntentRegistry.Intent memory intent1 = _buildIntent(1, block.timestamp + 1 hours);

        registry.submitIntent(intent0, _sign(intent0));
        registry.submitIntent(intent1, _sign(intent1));

        assertTrue(registry.usedNonces(user, 0));
        assertTrue(registry.usedNonces(user, 1));
    }
}
