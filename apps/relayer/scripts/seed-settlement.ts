/**
 * Seeds ONE real settlement on Arbitrum Sepolia so the Explorer page has a
 * genuine SettlementExecuted + stealth announcement to show before a demo —
 * see the conversation that produced this for why the live UI can't trigger
 * one itself (no funded counterparty agent, no stealth-math UI).
 *
 * This script plays BOTH roles with a single wallet: the "user" submitting
 * the intent and the "agent" settling it. That's a testnet-only shortcut —
 * see README-DEMO.md in this folder for what each step maps to on mainnet.
 *
 * Usage:
 *   DEMO_PRIVATE_KEY=0x... pnpm --filter @arbistealth/relayer seed-settlement
 *
 * DEMO_PRIVATE_KEY must be the SAME wallet you used in the browser to:
 *   1. Register as an ERC-8004 agent (Dashboard)
 *   2. Generate + register ERC-5564 stealth keys (Settings)
 * Both are read from chain here, not re-done by this script.
 */
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { parseMetaAddress, computeStealthOutput } from "../../../packages/sdk/src/stealth.js";
import { intentDomain, INTENT_TYPES, INTENT_PRIMARY_TYPE, type Intent } from "../../../packages/sdk/src/intent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const deployment = JSON.parse(
  readFileSync(path.join(REPO_ROOT, "deployments/arbitrum-sepolia.json"), "utf8")
) as {
  contracts: Record<string, Address>;
  externalRegistries: Record<string, Address>;
  externalTokens: Record<string, Address>;
};

const demoTokenArtifact = JSON.parse(
  readFileSync(path.join(REPO_ROOT, "contracts/out/DemoToken.sol/DemoToken.json"), "utf8")
) as { abi: unknown[]; bytecode: { object: Hex } };

const CONTRACTS = {
  intentRegistry: deployment.contracts.IntentRegistry,
  settlementRouter: deployment.contracts.SettlementRouter,
  identityRegistry: deployment.contracts.SimpleAgentIdentityRegistry,
};
const ERC6538_REGISTRY = deployment.externalRegistries.erc6538Registry;
const USDG = deployment.externalTokens.usdg;

const erc20Abi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const erc6538RegistryAbi = [
  {
    type: "function",
    name: "stealthMetaAddressOf",
    stateMutability: "view",
    inputs: [
      { name: "registrant", type: "address" },
      { name: "schemeId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes" }],
  },
] as const;

const identityRegistryAbi = [
  {
    type: "function",
    name: "agentIdOf",
    stateMutability: "view",
    inputs: [{ name: "controller", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const settlementRouterAbi = [
  {
    type: "function",
    name: "executeSettlement",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          {
            name: "intent",
            type: "tuple",
            components: [
              { name: "user", type: "address" },
              { name: "tokenIn", type: "address" },
              { name: "tokenOut", type: "address" },
              { name: "amountIn", type: "uint256" },
              { name: "minAmountOut", type: "uint256" },
              { name: "nonce", type: "uint256" },
              { name: "expiry", type: "uint256" },
            ],
          },
          { name: "signature", type: "bytes" },
          { name: "amountOut", type: "uint256" },
          { name: "stealthAddress", type: "address" },
          { name: "ephemeralPubKey", type: "bytes" },
          { name: "viewTag", type: "bytes" },
          { name: "feeAsset", type: "address" },
          { name: "feeAmount", type: "uint256" },
        ],
      },
    ],
    outputs: [],
  },
] as const;

function randomNonce(): bigint {
  return BigInt(toHex(randomBytes(32)));
}

async function main() {
  const pk = process.env.DEMO_PRIVATE_KEY as Hex | undefined;
  if (!pk) throw new Error("Set DEMO_PRIVATE_KEY to the wallet you used in the browser demo.");

  const account = privateKeyToAccount(pk);
  const rpcUrl = process.env.RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc";
  const publicClient = createPublicClient({ chain: arbitrumSepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport: http(rpcUrl) });

  console.log(`Using wallet ${account.address}`);

  const agentId = await publicClient.readContract({
    address: CONTRACTS.identityRegistry,
    abi: identityRegistryAbi,
    functionName: "agentIdOf",
    args: [account.address],
  });
  if (agentId === 0n) {
    throw new Error(
      `${account.address} is not a registered agent — register it from the Dashboard first.`
    );
  }
  console.log(`Confirmed registered agent #${agentId}`);

  const storedMeta = await publicClient.readContract({
    address: ERC6538_REGISTRY,
    abi: erc6538RegistryAbi,
    functionName: "stealthMetaAddressOf",
    args: [account.address, 1n],
  });
  if (!storedMeta || storedMeta.length <= 2) {
    throw new Error(
      `${account.address} has no registered stealth meta-address — register it from Settings first.`
    );
  }
  const recipientMeta = parseMetaAddress(storedMeta as Hex);
  const stealthOutput = computeStealthOutput(recipientMeta);
  console.log(`Derived stealth output address ${stealthOutput.stealthAddress}`);

  // --- Deploy two demo tokens (testnet only — see this file's header) ---
  const deployToken = async (name: string, symbol: string) => {
    const hash = await walletClient.deployContract({
      abi: demoTokenArtifact.abi,
      bytecode: demoTokenArtifact.bytecode.object,
      args: [name, symbol],
      account,
      chain: arbitrumSepolia,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (!receipt.contractAddress) throw new Error(`${name} deployment produced no address`);
    console.log(`Deployed ${symbol} at ${receipt.contractAddress}`);
    return receipt.contractAddress;
  };

  const tokenIn = await deployToken("Demo USD", "DUSD");
  const tokenOut = await deployToken("Demo ETH", "DETH");

  const amountIn = parseUnits("100", 18);
  const minAmountOut = parseUnits("0.04", 18);
  const amountOut = parseUnits("0.05", 18);
  // USDG has 6 decimals (Paxos token, not our 18-decimal DemoTokens).
  const feeAmount = parseUnits("1", 6);

  // --- Mint + approve the two demo tokens (testnet only — real tokenIn/
  //     tokenOut on mainnet already exist with real balances; nothing here
  //     is minted there) ---
  const mintAndApprove = async (token: Address, mintAmount: bigint) => {
    await publicClient.waitForTransactionReceipt({
      hash: await walletClient.writeContract({
        address: token,
        abi: erc20Abi,
        functionName: "mint",
        args: [account.address, mintAmount],
        account,
        chain: arbitrumSepolia,
      }),
    });
    await publicClient.waitForTransactionReceipt({
      hash: await walletClient.writeContract({
        address: token,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACTS.settlementRouter, mintAmount],
        account,
        chain: arbitrumSepolia,
      }),
    });
  };

  await mintAndApprove(tokenIn, amountIn);
  await mintAndApprove(tokenOut, amountOut);
  console.log("Minted + approved both demo tokens for SettlementRouter");

  // --- Pay the routing fee in real USDG (not a demo token) — requires the
  //     wallet to already hold some, e.g. from https://faucet.paxos.com ---
  const usdgBalance = await publicClient.readContract({
    address: USDG,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });
  if (usdgBalance < feeAmount) {
    throw new Error(
      `${account.address} holds ${usdgBalance} USDG units but needs ${feeAmount} — ` +
        `get test USDG from https://faucet.paxos.com (select Arbitrum Sepolia).`
    );
  }
  await publicClient.waitForTransactionReceipt({
    hash: await walletClient.writeContract({
      address: USDG,
      abi: erc20Abi,
      functionName: "approve",
      args: [CONTRACTS.settlementRouter, feeAmount],
      account,
      chain: arbitrumSepolia,
    }),
  });
  console.log("Approved real USDG for the routing fee");

  // --- Sign the intent as the "user" ---
  const intent: Intent = {
    user: account.address,
    tokenIn,
    tokenOut,
    amountIn,
    minAmountOut,
    nonce: randomNonce(),
    expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
  };

  const domain = intentDomain(arbitrumSepolia.id, CONTRACTS.intentRegistry);
  const signature = await walletClient.signTypedData({
    account,
    domain,
    types: INTENT_TYPES,
    primaryType: INTENT_PRIMARY_TYPE,
    message: intent,
  });
  console.log("Signed intent as the user");

  // --- Settle it as the "agent" (same wallet, acting as the counterparty) ---
  const settleHash = await walletClient.writeContract({
    address: CONTRACTS.settlementRouter,
    abi: settlementRouterAbi,
    functionName: "executeSettlement",
    args: [
      {
        intent,
        signature,
        amountOut,
        stealthAddress: stealthOutput.stealthAddress,
        ephemeralPubKey: stealthOutput.ephemeralPublicKey,
        viewTag: toHex(new Uint8Array([stealthOutput.viewTag])),
        feeAsset: USDG,
        feeAmount,
      },
    ],
    account,
    chain: arbitrumSepolia,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: settleHash });
  console.log(`\nSettled (fee paid in real USDG). tx: https://sepolia.arbiscan.io/tx/${receipt.transactionHash}`);
  console.log("Reload /explorer — this should show a Settlement Executed and a Stealth Announcement.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
