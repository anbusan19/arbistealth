import type { Address, Hex } from "viem";

/** Mirrors IntentRegistry.Intent in contracts/src/IntentRegistry.sol field-for-field. */
export interface Intent {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  nonce: bigint;
  expiry: bigint;
}

/** EIP-712 type definition matching IntentRegistry's INTENT_TYPEHASH. */
export const INTENT_TYPES = {
  Intent: [
    { name: "user", type: "address" },
    { name: "tokenIn", type: "address" },
    { name: "tokenOut", type: "address" },
    { name: "amountIn", type: "uint256" },
    { name: "minAmountOut", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
} as const;

export const INTENT_PRIMARY_TYPE = "Intent" as const;

/** EIP-712 domain matching IntentRegistry's constructor: EIP712("ArbiStealthIntentRegistry", "1"). */
export interface IntentDomain {
  name: "ArbiStealthIntentRegistry";
  version: "1";
  chainId: number;
  verifyingContract: Address;
}

export interface SignedIntentSubmission {
  intent: Intent;
  signature: Hex;
}
