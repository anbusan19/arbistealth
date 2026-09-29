/** Minimal ABIs for the on-chain calls the SDK makes directly. */

export const erc20Abi = [
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
] as const;

export const feeVaultAbi = [
  {
    type: "function",
    name: "payFee",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "workHash", type: "bytes32" },
    ],
    outputs: [{ name: "receiptHash", type: "bytes32" }],
  },
] as const;

export const erc8004IdentityRegistryAbi = [
  {
    type: "function",
    name: "registerAgent",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentCardURI", type: "string" }],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    type: "function",
    name: "agentIdOf",
    stateMutability: "view",
    inputs: [{ name: "controller", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "controller", type: "address", indexed: true },
      { name: "agentCardURI", type: "string", indexed: false },
    ],
  },
] as const;

export const erc8004ReputationRegistryAbi = [
  {
    type: "function",
    name: "entryCountOf",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
