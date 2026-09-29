import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, hexToBytes, publicKeyToAddress } from "viem/utils";
import type { Address, Hex } from "viem";

/**
 * ERC-5564 stealth address scheme, secp256k1 variant (scheme id 1). Verified
 * against a hand-rolled reference run of the full generate → announce → scan
 * → recover-private-key round trip before being wired into this module.
 */
export const SECP256K1_SCHEME_ID = 1;

const Point = secp256k1.Point;
const CURVE_ORDER = Point.Fn.ORDER;

export interface StealthMetaAddress {
  /** Compressed secp256k1 public key, 33 bytes. */
  spendingPublicKey: Hex;
  /** Compressed secp256k1 public key, 33 bytes. */
  viewingPublicKey: Hex;
  /** spendingPublicKey || viewingPublicKey, the format ERC-6538's registry stores. */
  metaAddress: Hex;
}

export interface StealthKeys extends StealthMetaAddress {
  spendingPrivateKey: Hex;
  viewingPrivateKey: Hex;
}

export interface StealthOutput {
  stealthAddress: Address;
  ephemeralPublicKey: Hex;
  /** First byte of the shared-secret hash; lets a scanner skip most announcements cheaply. */
  viewTag: number;
}

function randomPrivateKeyHex(): Hex {
  return bytesToHex(secp256k1.utils.randomSecretKey());
}

function sharedSecretScalar(sharedSecretPoint: Uint8Array): bigint {
  const hash = keccak_256(sharedSecretPoint);
  return BigInt(bytesToHex(hash)) % CURVE_ORDER;
}

function addressFromPublicKeyPoint(point: InstanceType<typeof Point>): Address {
  return publicKeyToAddress(bytesToHex(point.toBytes(false)));
}

/** Generates a fresh spending/viewing key pair and the meta-address derived from it. */
export function generateStealthKeys(): StealthKeys {
  const spendingPrivateKey = randomPrivateKeyHex();
  const viewingPrivateKey = randomPrivateKeyHex();
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

/** Splits a stored ERC-6538 meta-address (spendingPublicKey || viewingPublicKey) back into its two keys. */
export function parseMetaAddress(metaAddress: Hex): StealthMetaAddress {
  const bytes = hexToBytes(metaAddress);
  if (bytes.length !== 66) throw new Error("expected a 66-byte stealth meta-address");

  return {
    spendingPublicKey: bytesToHex(bytes.slice(0, 33)),
    viewingPublicKey: bytesToHex(bytes.slice(33)),
    metaAddress,
  };
}

/**
 * Sender side: given a recipient's stealth meta-address, derives a fresh
 * one-time stealth address, the ephemeral public key to announce alongside
 * it, and a view tag for cheap scanning.
 */
export function computeStealthOutput(recipient: StealthMetaAddress): StealthOutput {
  const ephemeralPrivateKey = secp256k1.utils.randomSecretKey();
  const ephemeralPublicKey = secp256k1.getPublicKey(ephemeralPrivateKey, true);

  const sharedSecretPoint = secp256k1.getSharedSecret(
    ephemeralPrivateKey,
    hexToBytes(recipient.viewingPublicKey),
    true
  );
  const viewTag = keccak_256(sharedSecretPoint)[0];
  const sh = sharedSecretScalar(sharedSecretPoint);

  const spendingPoint = Point.fromBytes(hexToBytes(recipient.spendingPublicKey));
  const stealthPoint = spendingPoint.add(Point.BASE.multiply(sh));

  return {
    stealthAddress: addressFromPublicKeyPoint(stealthPoint),
    ephemeralPublicKey: bytesToHex(ephemeralPublicKey),
    viewTag,
  };
}

export interface ScanParams {
  ephemeralPublicKey: Hex;
  viewTag: number;
  viewingPrivateKey: Hex;
  spendingPublicKey: Hex;
}

/**
 * Recipient side: checks whether an announcement was addressed to this
 * viewing key, and if so returns the resulting stealth address to compare
 * against the announcement's on-chain `stealthAddress`.
 */
export function checkStealthOutput(params: ScanParams): { isForMe: boolean; stealthAddress?: Address } {
  const sharedSecretPoint = secp256k1.getSharedSecret(
    hexToBytes(params.viewingPrivateKey),
    hexToBytes(params.ephemeralPublicKey),
    true
  );
  const hash = keccak_256(sharedSecretPoint);
  if (hash[0] !== params.viewTag) {
    return { isForMe: false };
  }

  const sh = BigInt(bytesToHex(hash)) % CURVE_ORDER;
  const spendingPoint = Point.fromBytes(hexToBytes(params.spendingPublicKey));
  const stealthPoint = spendingPoint.add(Point.BASE.multiply(sh));

  return { isForMe: true, stealthAddress: addressFromPublicKeyPoint(stealthPoint) };
}

export interface RecoverPrivateKeyParams {
  ephemeralPublicKey: Hex;
  spendingPrivateKey: Hex;
  viewingPrivateKey: Hex;
}

/** Recipient side: derives the private key that controls a matched stealth address. */
export function recoverStealthPrivateKey(params: RecoverPrivateKeyParams): Hex {
  const sharedSecretPoint = secp256k1.getSharedSecret(
    hexToBytes(params.viewingPrivateKey),
    hexToBytes(params.ephemeralPublicKey),
    true
  );
  const sh = sharedSecretScalar(sharedSecretPoint);

  const spendingScalar = BigInt(params.spendingPrivateKey);
  const stealthScalar = (spendingScalar + sh) % CURVE_ORDER;

  return `0x${stealthScalar.toString(16).padStart(64, "0")}` as Hex;
}
