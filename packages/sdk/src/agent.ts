import type { Account, Address, Chain, Hex, PublicClient, Transport, WalletClient } from "viem";
import { erc8004IdentityRegistryAbi, erc8004ReputationRegistryAbi } from "./abis.js";

/**
 * Registers the caller as an ERC-8004 agent. Calls the canonical identity
 * registry directly (not through AgentIdentityAdapter) since registration is
 * scoped to msg.sender and can't be proxied through another contract.
 * `walletClient` must already have an account attached.
 */
export async function registerAgent(
  publicClient: PublicClient,
  walletClient: WalletClient<Transport, Chain | undefined, Account>,
  identityRegistry: Address,
  agentCardURI: string
): Promise<{ agentId: bigint; txHash: Hex }> {
  const account = walletClient.account;

  const txHash = await walletClient.writeContract({
    address: identityRegistry,
    abi: erc8004IdentityRegistryAbi,
    functionName: "registerAgent",
    args: [agentCardURI],
    account,
    chain: walletClient.chain,
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  const agentId = await publicClient.readContract({
    address: identityRegistry,
    abi: erc8004IdentityRegistryAbi,
    functionName: "agentIdOf",
    args: [account.address],
  });

  return { agentId, txHash };
}

/** Reads an agent's current ERC-8004 identity id, or 0 if unregistered. */
export function getAgentId(publicClient: PublicClient, identityRegistry: Address, controller: Address): Promise<bigint> {
  return publicClient.readContract({
    address: identityRegistry,
    abi: erc8004IdentityRegistryAbi,
    functionName: "agentIdOf",
    args: [controller],
  });
}

/** Reads how many reputation entries (real, fee-backed settlements) an agent has. */
export function getAgentReputation(
  publicClient: PublicClient,
  reputationRegistry: Address,
  agentId: bigint
): Promise<bigint> {
  return publicClient.readContract({
    address: reputationRegistry,
    abi: erc8004ReputationRegistryAbi,
    functionName: "entryCountOf",
    args: [agentId],
  });
}
