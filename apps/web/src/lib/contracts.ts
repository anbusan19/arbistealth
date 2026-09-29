import type { Address } from "viem";

/** Live Arbitrum Sepolia deployment — see deployments/arbitrum-sepolia.json in the main repo. */
export const CHAIN_ID = 421614;
export const DEPLOY_BLOCK = 313_833_000n;

export const CONTRACTS = {
  intentRegistry: "0xD64d45447eac2607F42C7d4535279BC13ecB8ADC" as Address,
  stealthAnnouncer: "0x7dD7619dC9b1F4ECB2a8ef658B7e820da4009347" as Address,
  stealthMetaRegistry: "0x1444ba359aD12523c5F9B1379a935f4176539402" as Address,
  identityRegistry: "0xB85B0700c2AE0Cb61467CB1eFe331E3a80473684" as Address,
  reputationRegistry: "0x26d73f03D635815a10c8C7fFbd0737120C9d19FC" as Address,
  validationRegistry: "0x2DbcE219E8904F94791D50680bf67Dd49df1c388" as Address,
  agentIdentity: "0x95f5FBB4D5fF90b0F2FB1B539a2D307bF2c25d53" as Address,
  feeVault: "0x187f18a3752d60bc1418351933E31346Ae50EC92" as Address,
  settlementRouter: "0x6b7866727B3D10598aEC1334f939Ce942f9907c9" as Address,
} as const;

export const EXTERNAL = {
  erc5564Announcer: "0x55649E01B5Df198D18D95b5cc5051630cfD45564" as Address,
  erc6538Registry: "0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538" as Address,
  usdg: "0xFFC95faa3d63Cde504a05B567C600B78C0b41892" as Address,
} as const;

export const intentRegistryAbi = [
  {
    type: "function",
    name: "submitIntent",
    stateMutability: "nonpayable",
    inputs: [
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
    ],
    outputs: [{ name: "intentHash", type: "bytes32" }],
  },
  {
    type: "event",
    name: "IntentSubmitted",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "intentHash", type: "bytes32", indexed: true },
      { name: "tokenIn", type: "address", indexed: false },
      { name: "tokenOut", type: "address", indexed: false },
      { name: "amountIn", type: "uint256", indexed: false },
      { name: "minAmountOut", type: "uint256", indexed: false },
      { name: "nonce", type: "uint256", indexed: false },
      { name: "expiry", type: "uint256", indexed: false },
    ],
  },
] as const;

/** Standalone event descriptors for getLogs — kept outside the ABI arrays so
 *  their type isn't widened to `T | undefined` by an inline `.find()`. */
export const INTENT_SUBMITTED_EVENT = intentRegistryAbi[1];

export const settlementRouterAbi = [
  {
    type: "event",
    name: "SettlementExecuted",
    inputs: [
      { name: "intentHash", type: "bytes32", indexed: true },
      { name: "agentId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "stealthAddress", type: "address", indexed: false },
      { name: "amountIn", type: "uint256", indexed: false },
      { name: "amountOut", type: "uint256", indexed: false },
      { name: "receiptHash", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const SETTLEMENT_EXECUTED_EVENT = settlementRouterAbi[0];

export const stealthAnnouncerAbi = [
  {
    type: "event",
    name: "ArbiStealthAnnouncement",
    inputs: [
      { name: "intentHash", type: "bytes32", indexed: true },
      { name: "schemeId", type: "uint256", indexed: false },
      { name: "stealthAddress", type: "address", indexed: true },
      { name: "ephemeralPubKey", type: "bytes", indexed: false },
      { name: "metadata", type: "bytes", indexed: false },
    ],
  },
] as const;

export const ANNOUNCEMENT_EVENT = stealthAnnouncerAbi[0];

export const identityRegistryAbi = [
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "controller", type: "address", indexed: true },
      { name: "agentCardURI", type: "string", indexed: false },
    ],
  },
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

export const AGENT_REGISTERED_EVENT = identityRegistryAbi[0];

export const reputationRegistryAbi = [
  {
    type: "function",
    name: "entryCountOf",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const erc6538RegistryAbi = [
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
  {
    type: "function",
    name: "registerKeys",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schemeId", type: "uint256" },
      { name: "stealthMetaAddress", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export const feeVaultAbi = [
  {
    type: "function",
    name: "preferredAsset",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

export function arbiscanTxUrl(hash: string) {
  return `https://sepolia.arbiscan.io/tx/${hash}`;
}

export function arbiscanAddressUrl(address: string) {
  return `https://sepolia.arbiscan.io/address/${address}`;
}
