import { hashTypedData, verifyTypedData, type Hex } from "viem";
import { INTENT_PRIMARY_TYPE, INTENT_TYPES, type Intent, type IntentDomain } from "./types.js";

/** Recomputes the same digest IntentRegistry.hashIntent produces on-chain. */
export function hashIntent(domain: IntentDomain, intent: Intent): Hex {
  return hashTypedData({
    domain,
    types: INTENT_TYPES,
    primaryType: INTENT_PRIMARY_TYPE,
    message: intent,
  });
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
