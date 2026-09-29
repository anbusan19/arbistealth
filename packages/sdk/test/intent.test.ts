import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { hashIntent, intentDomain, verifyIntentSignature, type Intent } from "../src/intent.js";
import { INTENT_PRIMARY_TYPE, INTENT_TYPES } from "../src/intent.js";

const account = privateKeyToAccount("0x833843cfdbc5668a9928e3ad1f5ff231a6aa16fc2ceb46f4b0b09a506fbeef43");
const domain = intentDomain(421614, "0x0000000000000000000000000000000000000001");

function buildIntent(overrides: Partial<Intent> = {}): Intent {
  return {
    user: account.address,
    tokenIn: "0x0000000000000000000000000000000000000002",
    tokenOut: "0x0000000000000000000000000000000000000003",
    amountIn: 1_000_000_000_000_000_000n,
    minAmountOut: 900_000_000_000_000_000n,
    nonce: 0n,
    expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
    ...overrides,
  };
}

describe("intent signing", () => {
  it("verifyIntentSignature accepts a signature produced over the same domain/types", async () => {
    const intent = buildIntent();
    const signature = await account.signTypedData({
      domain,
      types: INTENT_TYPES,
      primaryType: INTENT_PRIMARY_TYPE,
      message: intent,
    });

    await expect(verifyIntentSignature(domain, intent, signature)).resolves.toBe(true);
  });

  it("verifyIntentSignature rejects a signature over a different intent", async () => {
    const intent = buildIntent();
    const otherSignature = await account.signTypedData({
      domain,
      types: INTENT_TYPES,
      primaryType: INTENT_PRIMARY_TYPE,
      message: buildIntent({ nonce: 1n }),
    });

    await expect(verifyIntentSignature(domain, intent, otherSignature)).resolves.toBe(false);
  });

  it("hashIntent is deterministic for the same intent and domain", () => {
    const intent = buildIntent();
    expect(hashIntent(domain, intent)).toBe(hashIntent(domain, intent));
  });

  it("hashIntent changes when the verifying contract (domain) changes", () => {
    const intent = buildIntent();
    const otherDomain = intentDomain(421614, "0x0000000000000000000000000000000000000099");

    expect(hashIntent(domain, intent)).not.toBe(hashIntent(otherDomain, intent));
  });
});
