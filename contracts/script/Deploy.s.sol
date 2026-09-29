// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IntentRegistry} from "../src/IntentRegistry.sol";
import {StealthAnnouncerAdapter} from "../src/StealthAnnouncerAdapter.sol";
import {StealthMetaRegistryAdapter} from "../src/StealthMetaRegistryAdapter.sol";
import {AgentIdentityAdapter} from "../src/AgentIdentityAdapter.sol";
import {SimpleAgentIdentityRegistry} from "../src/SimpleAgentIdentityRegistry.sol";
import {SimpleAgentReputationRegistry} from "../src/SimpleAgentReputationRegistry.sol";
import {SimpleAgentValidationRegistry} from "../src/SimpleAgentValidationRegistry.sol";
import {FeeVault} from "../src/FeeVault.sol";
import {SettlementRouter} from "../src/SettlementRouter.sol";

/// @notice Deploys the ArbiStealth protocol contracts and wires them together.
/// @dev Requires the following env vars pointing at the canonical, already
///      deployed standard registries for the target chain — verify these on
///      the chain's block explorer before deploying, do not assume they are
///      the same across chains:
///        ERC5564_ANNOUNCER - canonical ERC-5564 stealth announcer
///        ERC6538_REGISTRY  - canonical ERC-6538 meta-address registry
///        USDG_TOKEN        - Paxos USDG token, set as FeeVault's preferred
///                            fee settlement asset
///      Plus PRIVATE_KEY for the deployer, used as the initial owner of
///      FeeVault, AgentIdentityAdapter, and SimpleAgentReputationRegistry.
///
///      The ERC-8004 agent identity/reputation/validation registries are
///      NOT read from env: the canonical ERC-8004 standard is still an
///      actively evolving draft (its Validation Registry sub-spec has no
///      deployed instance on any chain as of this writing, and its
///      Identity/Reputation registries use a considerably more complex
///      ERC-721 + feedback model than AgentIdentityAdapter assumes), so this
///      script deploys ArbiStealth's own SimpleAgent*Registry contracts
///      instead. See their NatSpec for the tradeoffs and the migration path
///      once the canonical registries stabilize.
contract Deploy is Script {
    function run() external {
        address announcer = vm.envAddress("ERC5564_ANNOUNCER");
        address metaRegistry = vm.envAddress("ERC6538_REGISTRY");
        address usdg = vm.envAddress("USDG_TOKEN");

        require(announcer != address(0), "ERC5564_ANNOUNCER not set");
        require(metaRegistry != address(0), "ERC6538_REGISTRY not set");
        require(usdg != address(0), "USDG_TOKEN not set");

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        IntentRegistry intentRegistry = new IntentRegistry();
        StealthAnnouncerAdapter stealthAnnouncer = new StealthAnnouncerAdapter(announcer);
        StealthMetaRegistryAdapter stealthMetaRegistry = new StealthMetaRegistryAdapter(metaRegistry);

        SimpleAgentIdentityRegistry identityRegistry = new SimpleAgentIdentityRegistry();
        SimpleAgentReputationRegistry reputationRegistry = new SimpleAgentReputationRegistry(deployer);
        SimpleAgentValidationRegistry validationRegistry = new SimpleAgentValidationRegistry();

        AgentIdentityAdapter agentIdentity = new AgentIdentityAdapter(
            address(identityRegistry), address(reputationRegistry), address(validationRegistry), deployer
        );
        reputationRegistry.setAdapter(address(agentIdentity));

        FeeVault feeVault = new FeeVault(deployer, usdg);

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
        console.log("SimpleAgentIdentityRegistry:", address(identityRegistry));
        console.log("SimpleAgentReputationRegistry:", address(reputationRegistry));
        console.log("SimpleAgentValidationRegistry:", address(validationRegistry));
        console.log("AgentIdentityAdapter:", address(agentIdentity));
        console.log("FeeVault:", address(feeVault));
        console.log("SettlementRouter:", address(router));
    }
}
