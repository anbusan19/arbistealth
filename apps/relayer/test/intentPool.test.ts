import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { IntentPool, IntentValidationError } from "../src/intentPool.js";
import type { Intent, IntentDomain } from "../src/types.js";
import { INTENT_PRIMARY_TYPE, INTENT_TYPES } from "../src/types.js";

const account = privateKeyToAccount("0x833843cfdbc5668a9928e3ad1f5ff231a6aa16fc2ceb46f4b0b09a506fbeef43");

const domain: IntentDomain = {
  name: "ArbiStealthIntentRegistry",
  version: "1",
  chainId: 421614,
  verifyingContract: "0x0000000000000000000000000000000000000001",
};

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

async function signIntent(intent: Intent) {
  return account.signTypedData({
    domain,
    types: INTENT_TYPES,
    primaryType: INTENT_PRIMARY_TYPE,
    message: intent,
  });
}

describe("IntentPool", () => {
  it("accepts a validly signed intent and lists it as open", async () => {
    const pool = new IntentPool(domain);
    const intent = buildIntent();
    const signature = await signIntent(intent);

    const stored = await pool.submit(intent, signature);

    expect(stored.status).toBe("open");
    expect(pool.listOpen()).toHaveLength(1);
    expect(pool.get(stored.intentHash)).toEqual(stored);
  });

  it("rejects a signature that does not match the intent's user", async () => {
    const pool = new IntentPool(domain);
    const intent = buildIntent();
    const badSignature = await signIntent(buildIntent({ nonce: 1n }));

    await expect(pool.submit(intent, badSignature)).rejects.toThrow(IntentValidationError);
  });

  it("rejects an expired intent", async () => {
    const pool = new IntentPool(domain);
    const intent = buildIntent({ expiry: BigInt(Math.floor(Date.now() / 1000) - 10) });
    const signature = await signIntent(intent);

    await expect(pool.submit(intent, signature)).rejects.toThrow("intent expired");
  });

  it("rejects a replayed nonce for the same user", async () => {
    const pool = new IntentPool(domain);
    const intent = buildIntent();
    const signature = await signIntent(intent);
    await pool.submit(intent, signature);

    const replay = buildIntent({ tokenIn: "0x0000000000000000000000000000000000000009" });
    const replaySignature = await signIntent(replay);

    await expect(pool.submit(replay, replaySignature)).rejects.toThrow("nonce already used");
  });

  it("claim soft-locks an intent and excludes it from listOpen", async () => {
    const pool = new IntentPool(domain);
    const intent = buildIntent();
    const signature = await signIntent(intent);
    const stored = await pool.submit(intent, signature);

    const agent = "0x0000000000000000000000000000000000000099";
    const claimed = pool.claim(stored.intentHash, agent);

    expect(claimed.status).toBe("claimed");
    expect(claimed.claimedBy).toBe(agent);
    expect(pool.listOpen()).toHaveLength(0);
  });

  it("markSettled transitions a claimed intent to settled", async () => {
    const pool = new IntentPool(domain);
    const intent = buildIntent();
    const signature = await signIntent(intent);
    const stored = await pool.submit(intent, signature);
    pool.claim(stored.intentHash, "0x0000000000000000000000000000000000000099");

    const settled = pool.markSettled(stored.intentHash);

    expect(settled.status).toBe("settled");
  });

  it("release reopens a claimed intent after a failed settlement attempt", async () => {
    const pool = new IntentPool(domain);
    const intent = buildIntent();
    const signature = await signIntent(intent);
    const stored = await pool.submit(intent, signature);
    pool.claim(stored.intentHash, "0x0000000000000000000000000000000000000099");

    const released = pool.release(stored.intentHash);

    expect(released.status).toBe("open");
    expect(released.claimedBy).toBeUndefined();
    expect(pool.listOpen()).toHaveLength(1);
  });

  it("listByUser returns a user's intents across all statuses, newest first", async () => {
    const pool = new IntentPool(domain);
    const first = buildIntent({ nonce: 0n });
    const second = buildIntent({ nonce: 1n });
    const firstStored = await pool.submit(first, await signIntent(first));
    const secondStored = await pool.submit(second, await signIntent(second));
    pool.claim(firstStored.intentHash, "0x0000000000000000000000000000000000000099");

    const byUser = pool.listByUser(account.address);

    expect(byUser.map((s) => s.intentHash)).toEqual([secondStored.intentHash, firstStored.intentHash]);
  });
});
