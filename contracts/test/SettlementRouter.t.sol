// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SettlementRouter} from "../src/SettlementRouter.sol";
import {IntentRegistry} from "../src/IntentRegistry.sol";
import {StealthMetaRegistryAdapter} from "../src/StealthMetaRegistryAdapter.sol";
import {StealthAnnouncerAdapter} from "../src/StealthAnnouncerAdapter.sol";
import {AgentIdentityAdapter} from "../src/AgentIdentityAdapter.sol";
import {FeeVault} from "../src/FeeVault.sol";

import {MockERC20} from "./mocks/MockERC20.sol";
import {MockERC5564Announcer} from "./mocks/MockERC5564Announcer.sol";
import {MockERC6538Registry} from "./mocks/MockERC6538Registry.sol";
import {
    MockERC8004IdentityRegistry,
    MockERC8004ReputationRegistry,
    MockERC8004ValidationRegistry
} from "./mocks/MockERC8004Registries.sol";

contract SettlementRouterTest is Test {
    SettlementRouter public router;
    IntentRegistry public intentRegistry;
    StealthMetaRegistryAdapter public stealthMetaRegistry;
    StealthAnnouncerAdapter public stealthAnnouncer;
    AgentIdentityAdapter public agentIdentity;
    FeeVault public feeVault;

    MockERC6538Registry public metaRegistry;
    MockERC5564Announcer public announcer;
    MockERC8004IdentityRegistry public identityRegistry;
    MockERC8004ReputationRegistry public reputationRegistry;
    MockERC8004ValidationRegistry public validationRegistry;

    MockERC20 public tokenIn;
    MockERC20 public tokenOut;
    MockERC20 public feeToken;

    uint256 internal userPrivateKey = 0xA11CE;
    address internal user;
    address internal agent = address(0xA6E47);
    address internal stealthAddress = address(0xBEEF);

    function setUp() public {
        user = vm.addr(userPrivateKey);

        intentRegistry = new IntentRegistry();
        metaRegistry = new MockERC6538Registry();
        stealthMetaRegistry = new StealthMetaRegistryAdapter(address(metaRegistry));
        announcer = new MockERC5564Announcer();
        stealthAnnouncer = new StealthAnnouncerAdapter(address(announcer));

        identityRegistry = new MockERC8004IdentityRegistry();
        reputationRegistry = new MockERC8004ReputationRegistry();
        validationRegistry = new MockERC8004ValidationRegistry();
        agentIdentity = new AgentIdentityAdapter(
            address(identityRegistry), address(reputationRegistry), address(validationRegistry), address(this)
        );

        feeVault = new FeeVault(address(this));

        router = new SettlementRouter(
            address(intentRegistry),
            address(stealthMetaRegistry),
            address(stealthAnnouncer),
            address(agentIdentity),
            address(feeVault)
        );
        agentIdentity.setRouter(address(router));

        tokenIn = new MockERC20();
        tokenOut = new MockERC20();
        feeToken = new MockERC20();

        tokenIn.mint(user, 10 ether);
        tokenOut.mint(agent, 10 ether);
        feeToken.mint(agent, 10 ether);

        vm.prank(user);
        tokenIn.approve(address(router), type(uint256).max);
        vm.startPrank(agent);
        tokenOut.approve(address(router), type(uint256).max);
        feeToken.approve(address(router), type(uint256).max);
        vm.stopPrank();

        uint256 schemeId = router.STEALTH_SCHEME_ID();
        vm.prank(user);
        metaRegistry.registerKeys(schemeId, hex"aabbcc");

        vm.prank(agent);
        identityRegistry.registerAgent("ipfs://agent-card");
    }

    function _buildParams(uint256 amountOut, uint256 feeAmount)
        internal
        view
        returns (SettlementRouter.SettlementParams memory)
    {
        IntentRegistry.Intent memory intent = IntentRegistry.Intent({
            user: user,
            tokenIn: address(tokenIn),
            tokenOut: address(tokenOut),
            amountIn: 1 ether,
            minAmountOut: 0.9 ether,
            nonce: 0,
            expiry: block.timestamp + 1 hours
        });

        bytes32 digest = intentRegistry.hashIntent(intent);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        return SettlementRouter.SettlementParams({
            intent: intent,
            signature: signature,
            amountOut: amountOut,
            stealthAddress: stealthAddress,
            ephemeralPubKey: hex"0102",
            viewTag: hex"03",
            feeAsset: address(feeToken),
            feeAmount: feeAmount
        });
    }

    function test_ExecuteSettlement_MovesTokensAndAnnounces() public {
        SettlementRouter.SettlementParams memory params = _buildParams(0.95 ether, 0.01 ether);

        vm.prank(agent);
        router.executeSettlement(params);

        assertEq(tokenIn.balanceOf(agent), 1 ether);
        assertEq(tokenIn.balanceOf(user), 9 ether);
        assertEq(tokenOut.balanceOf(stealthAddress), 0.95 ether);
        assertEq(feeToken.balanceOf(address(feeVault)), 0.01 ether);
        assertTrue(intentRegistry.usedNonces(user, 0));
        assertEq(reputationRegistry.entryCountOf(identityRegistry.agentIdOf(agent)), 1);
    }

    function test_ExecuteSettlement_RevertsWhenOutputBelowMin() public {
        SettlementRouter.SettlementParams memory params = _buildParams(0.5 ether, 0);

        vm.prank(agent);
        vm.expectRevert(SettlementRouter.InsufficientOutput.selector);
        router.executeSettlement(params);
    }

    function test_ExecuteSettlement_RevertsWhenRecipientUnregistered() public {
        address unregisteredUser = vm.addr(0xB0B);
        // Deliberately no registerKeys call for this user.

        IntentRegistry.Intent memory intent = IntentRegistry.Intent({
            user: unregisteredUser,
            tokenIn: address(tokenIn),
            tokenOut: address(tokenOut),
            amountIn: 1 ether,
            minAmountOut: 0.9 ether,
            nonce: 0,
            expiry: block.timestamp + 1 hours
        });
        bytes32 digest = intentRegistry.hashIntent(intent);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xB0B, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        SettlementRouter.SettlementParams memory params = SettlementRouter.SettlementParams({
            intent: intent,
            signature: signature,
            amountOut: 0.95 ether,
            stealthAddress: stealthAddress,
            ephemeralPubKey: hex"0102",
            viewTag: hex"03",
            feeAsset: address(feeToken),
            feeAmount: 0
        });

        vm.prank(agent);
        vm.expectRevert(SettlementRouter.RecipientNotRegistered.selector);
        router.executeSettlement(params);
    }

    function test_ExecuteSettlement_RevertsForUnregisteredAgent() public {
        SettlementRouter.SettlementParams memory params = _buildParams(0.95 ether, 0);

        vm.prank(address(0xD00D));
        vm.expectRevert(AgentIdentityAdapter.AgentNotRegistered.selector);
        router.executeSettlement(params);
    }
}
