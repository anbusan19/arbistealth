import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPublicClient, createWalletClient, defineChain, http, keccak256, toHex, type Address, type Hex } from "viem";
import { getAgentReputation, registerAgent } from "../src/agent.js";
import { scanAnnouncements } from "../src/scan.js";
import { computeStealthOutput, generateStealthKeys } from "../src/stealth.js";
import { payWithX402 } from "../src/x402.js";
import { startAnvil, type AnvilInstance } from "./helpers/anvil.js";
import { loadArtifact, type Artifact } from "./helpers/artifacts.js";

const PORT = 8598;

const anvilChain = defineChain({
  id: 31337,
  name: "anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [`http://127.0.0.1:${PORT}`] } },
});

let anvil: AnvilInstance;
let publicClient: ReturnType<typeof createPublicClient>;
let walletClient: ReturnType<typeof createWalletClient>;
let account: Address;

let identityRegistry: Address;
let reputationRegistry: Address;
let feeVault: Address;
let token: Address;
let announcer: Address;

async function deploy(artifact: Artifact, args: unknown[] = []): Promise<Address> {
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args,
    account,
    chain: anvilChain,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error("deployment produced no contract address");
  return receipt.contractAddress;
}

const mintAbi = [
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
] as const;

beforeAll(async () => {
  anvil = await startAnvil(PORT);
  publicClient = createPublicClient({ chain: anvilChain, transport: http(anvil.rpcUrl) });
  const bootstrapClient = createWalletClient({ chain: anvilChain, transport: http(anvil.rpcUrl) });
  [account] = await bootstrapClient.getAddresses();
  walletClient = createWalletClient({ chain: anvilChain, transport: http(anvil.rpcUrl), account });

  identityRegistry = await deploy(loadArtifact("MockERC8004Registries.sol", "MockERC8004IdentityRegistry"));
  reputationRegistry = await deploy(loadArtifact("MockERC8004Registries.sol", "MockERC8004ReputationRegistry"));
  token = await deploy(loadArtifact("MockERC20.sol", "MockERC20"));
  feeVault = await deploy(loadArtifact("FeeVault.sol", "FeeVault"), [account, token]);
  announcer = await deploy(loadArtifact("MockERC5564Announcer.sol", "MockERC5564Announcer"));

  const mintHash = await walletClient.writeContract({
    address: token,
    abi: mintAbi,
    functionName: "mint",
    args: [account, 1_000n * 10n ** 18n],
    account,
    chain: anvilChain,
  });
  await publicClient.waitForTransactionReceipt({ hash: mintHash });
}, 30_000);

afterAll(async () => {
  await anvil.stop();
});

describe("agent + x402 SDK helpers against a live chain (real compiled contracts)", () => {
  it("registerAgent registers the caller on-chain and returns its agent id", async () => {
    const { agentId } = await registerAgent(publicClient, walletClient, identityRegistry, "ipfs://agent-card");
    expect(agentId).toBe(1n);
  });

  it("getAgentReputation starts at zero before any fee is paid", async () => {
    const count = await getAgentReputation(publicClient, reputationRegistry, 1n);
    expect(count).toBe(0n);
  });

  it("payWithX402 approves and pays a real fee, returning a receipt hash", async () => {
    const workHash = keccak256(toHex("settlement-1"));
    const { receiptHash } = await payWithX402(publicClient, walletClient, feeVault, token, 10n * 10n ** 18n, workHash);

    expect(receiptHash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});

const announceAbi = [
  {
    type: "function",
    name: "announce",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schemeId", type: "uint256" },
      { name: "stealthAddress", type: "address" },
      { name: "ephemeralPubKey", type: "bytes" },
      { name: "metadata", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

describe("scanAnnouncements against a live chain (real ERC-5564 announcer)", () => {
  it("finds an announcement addressed to the recipient's viewing key and ignores others", async () => {
    const recipient = generateStealthKeys();
    const stranger = generateStealthKeys();

    const output = computeStealthOutput(recipient);
    const metadata = `0x${output.viewTag.toString(16).padStart(2, "0")}` as Hex;

    const announceHash = await walletClient.writeContract({
      address: announcer,
      abi: announceAbi,
      functionName: "announce",
      args: [1n, output.stealthAddress, output.ephemeralPublicKey, metadata],
      account,
      chain: anvilChain,
    });
    await publicClient.waitForTransactionReceipt({ hash: announceHash });

    const matches = await scanAnnouncements({
      publicClient,
      announcer,
      viewingPrivateKey: recipient.viewingPrivateKey,
      spendingPublicKey: recipient.spendingPublicKey,
    });
    expect(matches).toHaveLength(1);
    expect(matches[0].stealthAddress).toBe(output.stealthAddress);

    const strangerMatches = await scanAnnouncements({
      publicClient,
      announcer,
      viewingPrivateKey: stranger.viewingPrivateKey,
      spendingPublicKey: stranger.spendingPublicKey,
    });
    expect(strangerMatches).toHaveLength(0);
  });
});
