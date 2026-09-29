import type { Address } from "viem";
import { CHAIN_ID, CONTRACTS } from "./contracts";

/** Mirrors IntentRegistry.Intent field-for-field. */
export interface Intent {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  nonce: bigint;
  expiry: bigint;
}

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

export const INTENT_DOMAIN = {
  name: "ArbiStealthIntentRegistry",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: CONTRACTS.intentRegistry,
} as const;

export function randomNonce(): bigint {
  return BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000));
}
