import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex, hexToBytes } from "viem/utils";
import type { Hex } from "viem";

/**
 * ERC-5564 stealth address scheme (secp256k1 variant), ported from
 * packages/sdk/src/stealth.ts in the main ArbiStealth repo — verified there
 * against a full generate/announce/scan/recover round trip. Only the parts
 * needed for the Settings page (generate + register) live here, so this app
 * stays standalone and doesn't depend on the other package.
 */

export interface StealthMetaAddress {
  spendingPublicKey: Hex;
  viewingPublicKey: Hex;
  metaAddress: Hex;
}

export interface StealthKeys extends StealthMetaAddress {
  spendingPrivateKey: Hex;
  viewingPrivateKey: Hex;
}

export function generateStealthKeys(): StealthKeys {
  const spendingPrivateKey = bytesToHex(secp256k1.utils.randomSecretKey());
  const viewingPrivateKey = bytesToHex(secp256k1.utils.randomSecretKey());
  const spendingPublicKey = bytesToHex(secp256k1.getPublicKey(hexToBytes(spendingPrivateKey), true));
  const viewingPublicKey = bytesToHex(secp256k1.getPublicKey(hexToBytes(viewingPrivateKey), true));

  return {
    spendingPrivateKey,
    viewingPrivateKey,
    spendingPublicKey,
    viewingPublicKey,
    metaAddress: `${spendingPublicKey}${viewingPublicKey.slice(2)}` as Hex,
  };
}

const STORAGE_KEY = "arbistealth.stealthKeys";

/** Demo-only persistence: browser localStorage, per-viewer, never sent anywhere. */
export function loadStoredStealthKeys(): StealthKeys | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StealthKeys) : null;
  } catch {
    return null;
  }
}

export function saveStealthKeys(keys: StealthKeys): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // ignore — private/incognito mode or storage disabled
  }
}
