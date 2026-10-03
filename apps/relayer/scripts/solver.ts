/**
 * A real solver: polls the relayer's off-chain intent pool and settles
 * matched intents on-chain, continuously, without a human running anything
 * per-intent. This is the automation that was missing — see the conversation
 * that produced this for the full "seed script vs. live solver" distinction.
 *
 * Requires the dashboard to submit intents through the relayer (POST
 * /intents, signature only, no on-chain tx) rather than calling
 * IntentRegistry.submitIntent directly — IntentRegistry.submitIntent is
 * also the first thing executeSettlement does internally, so an intent
 * whose nonce was already burned by a direct on-chain submission can never
 * be settled afterward (NonceAlreadyUsed). The relayer's own intentPool.ts
 * doc comment says as much.
 *
 * Usage:
 *   SOLVER_PRIVATE_KEY=0x... pnpm --filter @arbistealth/relayer solver
 *
 * On startup this wallet is registered as an ERC-8004 agent if it isn't
 * already. It then loops forever: poll GET /intents (open ones), and for
 * each one it can actually fill (see canFill below), claim it, settle it
 * on-chain, and report the result back to the relayer.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  toHex,
  type Account,
  type Address,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

type AppPublicClient = PublicClient<Transport, typeof arbitrumSepolia>;
type AppWalletClient = WalletClient<Transport, typeof arbitrumSepolia, Account>;
import { parseMetaAddress, computeStealthOutput } from "../../../packages/sdk/src/stealth.js";

/**
 * Arbitrum Sepolia's base fee moves every block (~0.25s) and the default
 * maxFeePerGas estimate leaves no headroom above it, so a write submitted
 * even a block late reverts with "max fee per gas less than block base
 * fee" — confirmed happening in practice (see the conversation that added
 * this). Pad the estimate by 50% so a write survives a few blocks of drift.
 */
async function bufferedFees(publicClient: AppPublicClient) {
  const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas();
  return {
    maxFeePerGas: ((maxFeePerGas ?? 0n) * 150n) / 100n,
    maxPriorityFeePerGas,
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const deployment = JSON.parse(
  readFileSync(path.join(REPO_ROOT, "deployments/arbitrum-sepolia.json"), "utf8")
) as {
  contracts: Record<string, Address>;
  externalRegistries: Record<string, Address>;
  externalTokens: Record<string, Address>;
};

const CONTRACTS = {
  intentRegistry: deployment.contracts.IntentRegistry,
  settlementRouter: deployment.contracts.SettlementRouter,
  identityRegistry: deployment.contracts.SimpleAgentIdentityRegistry,
};
const ERC6538_REGISTRY = deployment.externalRegistries.erc6538Registry;
const USDG = deployment.externalTokens.usdg;

const RELAYER_URL = process.env.RELAYER_URL ?? "http://localhost:8787";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 5000);
const FLAT_FEE = parseUnits("0.1", 6); // 0.1 USDG, only charged if the solver holds enough

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
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
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
  {
    type: "function",
    name: "registerAgent",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentCardURI", type: "string" }],
    outputs: [{ name: "agentId", type: "uint256" }],
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

interface WireIntent {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  minAmountOut: string;
  nonce: string;
  expiry: string;
}

interface StoredIntent {
  intentHash: Hex;
  intent: WireIntent;
  signature: Hex;
  status: "open" | "claimed" | "settled";
}

function toIntent(wire: WireIntent) {
  return {
    user: wire.user,
    tokenIn: wire.tokenIn,
    tokenOut: wire.tokenOut,
    amountIn: BigInt(wire.amountIn),
    minAmountOut: BigInt(wire.minAmountOut),
    nonce: BigInt(wire.nonce),
    expiry: BigInt(wire.expiry),
  };
}

async function main() {
  const pk = process.env.SOLVER_PRIVATE_KEY as Hex | undefined;
  if (!pk) throw new Error("Set SOLVER_PRIVATE_KEY.");

  const account = privateKeyToAccount(pk);
  const rpcUrl = process.env.RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc";
  const publicClient = createPublicClient({ chain: arbitrumSepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport: http(rpcUrl) });

  console.log(`Solver wallet: ${account.address}`);
  console.log(`Polling ${RELAYER_URL} every ${POLL_INTERVAL_MS}ms`);

  let agentId = await publicClient.readContract({
    address: CONTRACTS.identityRegistry,
    abi: identityRegistryAbi,
    functionName: "agentIdOf",
    args: [account.address],
  });

  if (agentId === 0n) {
    console.log("Not yet a registered agent — registering...");
    const hash = await walletClient.writeContract({
      address: CONTRACTS.identityRegistry,
      abi: identityRegistryAbi,
      functionName: "registerAgent",
      args: ["ipfs://arbistealth-solver-card"],
      account,
      chain: arbitrumSepolia,
      ...(await bufferedFees(publicClient)),
    });
    await publicClient.waitForTransactionReceipt({ hash });
    agentId = await publicClient.readContract({
      address: CONTRACTS.identityRegistry,
      abi: identityRegistryAbi,
      functionName: "agentIdOf",
      args: [account.address],
    });
    console.log(`Registered as agent #${agentId}`);
  } else {
    console.log(`Already a registered agent #${agentId}`);
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await pollOnce(publicClient, walletClient, account.address);
    } catch (err) {
      console.error("Poll iteration failed:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

async function pollOnce(
  publicClient: AppPublicClient,
  walletClient: AppWalletClient,
  solver: Address
) {
  const res = await fetch(`${RELAYER_URL}/intents`);
  if (!res.ok) {
    console.error(`GET /intents failed: ${res.status}`);
    return;
  }
  const open = (await res.json()) as StoredIntent[];
  if (open.length === 0) return;

  console.log(`${open.length} open intent(s)`);

  for (const stored of open) {
    await tryFill(publicClient, walletClient, solver, stored);
  }
}

async function tryFill(
  publicClient: AppPublicClient,
  walletClient: AppWalletClient,
  solver: Address,
  stored: StoredIntent
) {
  const intent = toIntent(stored.intent);

  // Only settle for a recipient who has actually registered a stealth
  // meta-address — executeSettlement reverts (RecipientNotRegistered)
  // otherwise, so check first rather than waste a claim + failed tx.
  const storedMeta = await publicClient.readContract({
    address: ERC6538_REGISTRY,
    abi: erc6538RegistryAbi,
    functionName: "stealthMetaAddressOf",
    args: [intent.user, 1n],
  });
  if (!storedMeta || storedMeta.length <= 2) {
    console.log(`${stored.intentHash}: recipient has no stealth meta-address, skipping`);
    return;
  }

  // Inventory check: this solver can only fill intent.tokenOut if it holds
  // (or, for a testnet DemoToken-style contract, can mint) enough of it.
  // Real mainnet tokens never have a permissionless mint, so this falls
  // through to the balance check there — see README-DEMO.md.
  const amountOut = intent.minAmountOut; // simplest valid fill: exactly the user's floor
  const haveBalance = async () =>
    publicClient.readContract({
      address: intent.tokenOut,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [solver],
    });

  let balance = await haveBalance();
  if (balance < amountOut) {
    try {
      const mintHash = await walletClient.writeContract({
        address: intent.tokenOut,
        abi: erc20Abi,
        functionName: "mint",
        args: [solver, amountOut],
        account: walletClient.account,
        chain: arbitrumSepolia,
        ...(await bufferedFees(publicClient)),
      });
      await publicClient.waitForTransactionReceipt({ hash: mintHash });
      balance = await haveBalance();
    } catch (err) {
      // Could be "not a mintable test token" (expected for any real asset)
      // or a real failure (bad gas estimate, RPC hiccup, etc.) — log it so
      // a real failure doesn't masquerade as "insufficient inventory".
      console.log(`${stored.intentHash}: mint() on ${intent.tokenOut} failed: ${(err as Error).message}`);
    }
  }
  if (balance < amountOut) {
    console.log(`${stored.intentHash}: insufficient ${intent.tokenOut} inventory, skipping`);
    return;
  }

  const claimRes = await fetch(`${RELAYER_URL}/intents/${stored.intentHash}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent: solver }),
  });
  if (!claimRes.ok) {
    console.log(`${stored.intentHash}: claim failed (${claimRes.status}), likely taken by another solver`);
    return;
  }

  console.log(`${stored.intentHash}: claimed, settling...`);

  try {
    const recipientMeta = parseMetaAddress(storedMeta as Hex);
    const stealthOutput = computeStealthOutput(recipientMeta);

    const allowance = await publicClient.readContract({
      address: intent.tokenOut,
      abi: erc20Abi,
      functionName: "allowance",
      args: [solver, CONTRACTS.settlementRouter],
    });
    if (allowance < amountOut) {
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract({
          address: intent.tokenOut,
          abi: erc20Abi,
          functionName: "approve",
          args: [CONTRACTS.settlementRouter, amountOut],
          account: walletClient.account,
          chain: arbitrumSepolia,
          ...(await bufferedFees(publicClient)),
        }),
      });
    }

    // Charge a flat fee in real USDG only if the solver can actually afford
    // it — otherwise settle with feeAmount 0 (no reputation entry gets
    // recorded for a zero fee, per AgentIdentityAdapter, but the trade and
    // stealth payout still happen).
    const usdgBalance = await publicClient.readContract({
      address: USDG,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [solver],
    });
    let feeAmount = 0n;
    if (usdgBalance >= FLAT_FEE) {
      const usdgAllowance = await publicClient.readContract({
        address: USDG,
        abi: erc20Abi,
        functionName: "allowance",
        args: [solver, CONTRACTS.settlementRouter],
      });
      if (usdgAllowance < FLAT_FEE) {
        await publicClient.waitForTransactionReceipt({
          hash: await walletClient.writeContract({
            address: USDG,
            abi: erc20Abi,
            functionName: "approve",
            args: [CONTRACTS.settlementRouter, FLAT_FEE],
            account: walletClient.account,
            chain: arbitrumSepolia,
            ...(await bufferedFees(publicClient)),
          }),
        });
      }
      feeAmount = FLAT_FEE;
    }

    const settleHash = await walletClient.writeContract({
      address: CONTRACTS.settlementRouter,
      abi: settlementRouterAbi,
      functionName: "executeSettlement",
      args: [
        {
          intent,
          signature: stored.signature,
          amountOut,
          stealthAddress: stealthOutput.stealthAddress,
          ephemeralPubKey: stealthOutput.ephemeralPublicKey,
          viewTag: toHex(new Uint8Array([stealthOutput.viewTag])),
          feeAsset: USDG,
          feeAmount,
        },
      ],
      account: walletClient.account,
      chain: arbitrumSepolia,
      ...(await bufferedFees(publicClient)),
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: settleHash });

    await fetch(`${RELAYER_URL}/intents/${stored.intentHash}/settled`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash: receipt.transactionHash }),
    });
    console.log(`${stored.intentHash}: settled — tx https://sepolia.arbiscan.io/tx/${receipt.transactionHash}`);
  } catch (err) {
    console.error(`${stored.intentHash}: settlement failed, releasing claim`, err);
    await fetch(`${RELAYER_URL}/intents/${stored.intentHash}/release`, { method: "POST" }).catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
