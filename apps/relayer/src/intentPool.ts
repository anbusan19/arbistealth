import type { Address, Hex } from "viem";
import { hashIntent, verifyIntentSignature } from "./intentSignature.js";
import type { Intent, IntentDomain } from "./types.js";

export type IntentStatus = "open" | "claimed" | "settled";

export interface StoredIntent {
  intentHash: Hex;
  intent: Intent;
  signature: Hex;
  status: IntentStatus;
  claimedBy?: Address;
  createdAt: number;
  /** Monotonic insertion order, for deterministic "newest first" sorting even
   *  when createdAt ties (Date.now() resolution can't be relied on). */
  seq: number;
  /** The on-chain executeSettlement tx hash, set once a solver reports success. */
  settlementTxHash?: Hex;
}

export class IntentValidationError extends Error {}

/**
 * In-memory intent pool: the relayer's half of the matching engine described
 * in the README. Verifies a signed intent's EIP-712 signature, expiry, and
 * per-user nonce off-chain before exposing it to agents for matching. This is
 * an optimistic check for UX only — IntentRegistry's on-chain check is what
 * actually prevents replay, since anyone could otherwise submit directly to
 * the contract and bypass this pool.
 */
export class IntentPool {
  private readonly domain: IntentDomain;
  private readonly intents = new Map<Hex, StoredIntent>();
  private readonly usedNonces = new Map<string, Set<bigint>>();
  private seqCounter = 0;

  constructor(domain: IntentDomain) {
    this.domain = domain;
  }

  async submit(intent: Intent, signature: Hex): Promise<StoredIntent> {
    const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
    if (intent.expiry <= nowSeconds) {
      throw new IntentValidationError("intent expired");
    }

    const userKey = intent.user.toLowerCase();
    const nonces = this.usedNonces.get(userKey);
    if (nonces?.has(intent.nonce)) {
      throw new IntentValidationError("nonce already used");
    }

    const isValid = await verifyIntentSignature(this.domain, intent, signature);
    if (!isValid) {
      throw new IntentValidationError("invalid signature");
    }

    const intentHash = hashIntent(this.domain, intent);
    if (this.intents.has(intentHash)) {
      throw new IntentValidationError("intent already submitted");
    }

    const stored: StoredIntent = {
      intentHash,
      intent,
      signature,
      status: "open",
      createdAt: Date.now(),
      seq: this.seqCounter++,
    };

    this.intents.set(intentHash, stored);
    if (nonces) {
      nonces.add(intent.nonce);
    } else {
      this.usedNonces.set(userKey, new Set([intent.nonce]));
    }

    return stored;
  }

  /** Lists open intents that have not expired, for agents to poll and match against. */
  listOpen(): StoredIntent[] {
    const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
    return [...this.intents.values()].filter(
      (stored) => stored.status === "open" && stored.intent.expiry > nowSeconds
    );
  }

  /** Lists a user's intents regardless of status, newest first — for "My Intents" UI. */
  listByUser(user: Address): StoredIntent[] {
    const userKey = user.toLowerCase();
    return [...this.intents.values()]
      .filter((stored) => stored.intent.user.toLowerCase() === userKey)
      .sort((a, b) => b.seq - a.seq);
  }

  get(intentHash: Hex): StoredIntent | undefined {
    return this.intents.get(intentHash);
  }

  /** Soft-locks an intent to a claiming agent so other agents stop matching it. */
  claim(intentHash: Hex, agent: Address): StoredIntent {
    const stored = this.intents.get(intentHash);
    if (!stored) throw new IntentValidationError("unknown intent");
    if (stored.status !== "open") throw new IntentValidationError("intent not open");

    stored.status = "claimed";
    stored.claimedBy = agent;
    return stored;
  }

  markSettled(intentHash: Hex, settlementTxHash?: Hex): StoredIntent {
    const stored = this.intents.get(intentHash);
    if (!stored) throw new IntentValidationError("unknown intent");

    stored.status = "settled";
    stored.settlementTxHash = settlementTxHash;
    return stored;
  }

  /** Reopens a claimed intent so other agents can retry it after a failed settlement attempt. */
  release(intentHash: Hex): StoredIntent {
    const stored = this.intents.get(intentHash);
    if (!stored) throw new IntentValidationError("unknown intent");
    if (stored.status !== "claimed") throw new IntentValidationError("intent not claimed");

    stored.status = "open";
    stored.claimedBy = undefined;
    return stored;
  }
}
