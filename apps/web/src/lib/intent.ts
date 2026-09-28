import type { Address } from "viem";

/** Mirrors IntentRegistry.Intent (contracts) and Intent (relayer) field-for-field. */
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

export interface IntentDomain {
  name: "ArbiStealthIntentRegistry";
  version: "1";
  chainId: number;
  verifyingContract: Address;
}

export function intentDomain(chainId: number, verifyingContract: Address): IntentDomain {
  return { name: "ArbiStealthIntentRegistry", version: "1", chainId, verifyingContract };
}

/** JSON-safe wire representation of an Intent (bigints as decimal strings). */
export function serializeIntent(intent: Intent) {
  return {
    ...intent,
    amountIn: intent.amountIn.toString(),
    minAmountOut: intent.minAmountOut.toString(),
    nonce: intent.nonce.toString(),
    expiry: intent.expiry.toString(),
  };
}
