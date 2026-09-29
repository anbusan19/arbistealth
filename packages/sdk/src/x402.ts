import type { Account, Address, Chain, Hex, PublicClient, Transport, WalletClient } from "viem";
import { erc20Abi, feeVaultAbi } from "./abis.js";

/**
 * Pays a routing/execution fee through FeeVault's x402-style pull payment:
 * approves the vault for `amount` of `asset`, then calls payFee tied to
 * `workHash`, returning the receipt hash that can be attached to the
 * agent's ERC-8004 reputation entry. `walletClient` must already have an
 * account attached.
 */
export async function payWithX402(
  publicClient: PublicClient,
  walletClient: WalletClient<Transport, Chain | undefined, Account>,
  feeVault: Address,
  asset: Address,
  amount: bigint,
  workHash: Hex
): Promise<{ receiptHash: Hex; txHash: Hex }> {
  const account = walletClient.account;

  const approveTxHash = await walletClient.writeContract({
    address: asset,
    abi: erc20Abi,
    functionName: "approve",
    args: [feeVault, amount],
    account,
    chain: walletClient.chain,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

  const { request, result: receiptHash } = await publicClient.simulateContract({
    address: feeVault,
    abi: feeVaultAbi,
    functionName: "payFee",
    args: [asset, amount, workHash],
    account,
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return { receiptHash, txHash };
}
