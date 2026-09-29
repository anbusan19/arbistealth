import { describe, expect, it } from "vitest";
import { privateKeyToAddress } from "viem/accounts";
import {
  checkStealthOutput,
  computeStealthOutput,
  generateStealthKeys,
  parseMetaAddress,
  recoverStealthPrivateKey,
} from "../src/stealth.js";

describe("stealth address scheme (ERC-5564, secp256k1)", () => {
  it("generateStealthKeys produces a meta-address that round-trips through parseMetaAddress", () => {
    const keys = generateStealthKeys();
    const parsed = parseMetaAddress(keys.metaAddress);

    expect(parsed.spendingPublicKey).toBe(keys.spendingPublicKey);
    expect(parsed.viewingPublicKey).toBe(keys.viewingPublicKey);
  });

  it("full round trip: sender computes an address the recipient can detect and recover", () => {
    const recipient = generateStealthKeys();

    const output = computeStealthOutput(recipient);

    const scan = checkStealthOutput({
      ephemeralPublicKey: output.ephemeralPublicKey,
      viewTag: output.viewTag,
      viewingPrivateKey: recipient.viewingPrivateKey,
      spendingPublicKey: recipient.spendingPublicKey,
    });

    expect(scan.isForMe).toBe(true);
    expect(scan.stealthAddress).toBe(output.stealthAddress);

    const stealthPrivateKey = recoverStealthPrivateKey({
      ephemeralPublicKey: output.ephemeralPublicKey,
      spendingPrivateKey: recipient.spendingPrivateKey,
      viewingPrivateKey: recipient.viewingPrivateKey,
    });

    expect(privateKeyToAddress(stealthPrivateKey)).toBe(output.stealthAddress);
  });

  it("a scanner using a different viewing key does not match", () => {
    const recipient = generateStealthKeys();
    const stranger = generateStealthKeys();

    const output = computeStealthOutput(recipient);

    const scan = checkStealthOutput({
      ephemeralPublicKey: output.ephemeralPublicKey,
      viewTag: output.viewTag,
      viewingPrivateKey: stranger.viewingPrivateKey,
      spendingPublicKey: recipient.spendingPublicKey,
    });

    expect(scan.isForMe).toBe(false);
  });

  it("produces a fresh, unlinkable stealth address for every output to the same recipient", () => {
    const recipient = generateStealthKeys();

    const first = computeStealthOutput(recipient);
    const second = computeStealthOutput(recipient);

    expect(first.stealthAddress).not.toBe(second.stealthAddress);
    expect(first.ephemeralPublicKey).not.toBe(second.ephemeralPublicKey);
  });
});
