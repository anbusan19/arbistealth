// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IntentRegistry} from "../src/IntentRegistry.sol";
import {StealthAnnouncerAdapter} from "../src/StealthAnnouncerAdapter.sol";
import {StealthMetaRegistryAdapter} from "../src/StealthMetaRegistryAdapter.sol";
import {AgentIdentityAdapter} from "../src/AgentIdentityAdapter.sol";
import {FeeVault} from "../src/FeeVault.sol";
import {SettlementRouter} from "../src/SettlementRouter.sol";

/// @notice Deploys the ArbiStealth protocol contracts and wires them together.
/// @dev Requires the following env vars pointing at the canonical, already
///      deployed standard registries for the target chain — verify these on
///      the chain's block explorer before deploying, do not assume they are
///      the same across chains:
///        ERC5564_ANNOUNCER          - canonical ERC-5564 stealth announcer
///        ERC6538_REGISTRY           - canonical ERC-6538 meta-address registry
///        ERC8004_IDENTITY_REGISTRY  - ERC-8004 identity registry
///        ERC8004_REPUTATION_REGISTRY - ERC-8004 reputation registry
///        ERC8004_VALIDATION_REGISTRY - ERC-8004 validation registry
///      Plus PRIVATE_KEY for the deployer, used as the initial owner of
///      FeeVault and AgentIdentityAdapter.
contract Deploy is Script {
    function run() external {
        address announcer = vm.envAddress("ERC5564_ANNOUNCER");
        address metaRegistry = vm.envAddress("ERC6538_REGISTRY");
        address identityRegistry = vm.envAddress("ERC8004_IDENTITY_REGISTRY");
        address reputationRegistry = vm.envAddress("ERC8004_REPUTATION_REGISTRY");
        address validationRegistry = vm.envAddress("ERC8004_VALIDATION_REGISTRY");

        require(announcer != address(0), "ERC5564_ANNOUNCER not set");
        require(metaRegistry != address(0), "ERC6538_REGISTRY not set");
        require(identityRegistry != address(0), "ERC8004_IDENTITY_REGISTRY not set");
        require(reputationRegistry != address(0), "ERC8004_REPUTATION_REGISTRY not set");
        require(validationRegistry != address(0), "ERC8004_VALIDATION_REGISTRY not set");

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        IntentRegistry intentRegistry = new IntentRegistry();
        StealthAnnouncerAdapter stealthAnnouncer = new StealthAnnouncerAdapter(announcer);
        StealthMetaRegistryAdapter stealthMetaRegistry = new StealthMetaRegistryAdapter(metaRegistry);
        AgentIdentityAdapter agentIdentity =
            new AgentIdentityAdapter(identityRegistry, reputationRegistry, validationRegistry, deployer);
        FeeVault feeVault = new FeeVault(deployer);

        SettlementRouter router = new SettlementRouter(
            address(intentRegistry),
            address(stealthMetaRegistry),
            address(stealthAnnouncer),
            address(agentIdentity),
            address(feeVault)
        );

        agentIdentity.setRouter(address(router));

        vm.stopBroadcast();

        console.log("IntentRegistry:", address(intentRegistry));
        console.log("StealthAnnouncerAdapter:", address(stealthAnnouncer));
        console.log("StealthMetaRegistryAdapter:", address(stealthMetaRegistry));
        console.log("AgentIdentityAdapter:", address(agentIdentity));
        console.log("FeeVault:", address(feeVault));
        console.log("SettlementRouter:", address(router));
    }
}
