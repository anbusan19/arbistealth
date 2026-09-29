import { hashTypedData, verifyTypedData } from "viem/utils";
import type { Address, Hex } from "viem";

/** Mirrors IntentRegistry.Intent (contracts/src/IntentRegistry.sol) field-for-field. */
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

export function intentDomain(chainId: number, verifyingContract: Address): IntentDomain {
  return { name: "ArbiStealthIntentRegistry", version: "1", chainId, verifyingContract };
}

/** Recomputes the same digest IntentRegistry.hashIntent produces on-chain. */
export function hashIntent(domain: IntentDomain, intent: Intent): Hex {
  return hashTypedData({ domain, types: INTENT_TYPES, primaryType: INTENT_PRIMARY_TYPE, message: intent });
}

/** True if `signature` is a valid EIP-712 signature by `intent.user` over `intent`. */
export function verifyIntentSignature(domain: IntentDomain, intent: Intent, signature: Hex): Promise<boolean> {
  return verifyTypedData({
    address: intent.user,
    domain,
    types: INTENT_TYPES,
    primaryType: INTENT_PRIMARY_TYPE,
    message: intent,
    signature,
  });
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
