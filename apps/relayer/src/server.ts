import express, { type Express } from "express";
import type { Hex } from "viem";
import { IntentPool, IntentValidationError, type StoredIntent } from "./intentPool.js";
import type { Intent, IntentDomain } from "./types.js";
import { claimSchema, submitIntentSchema } from "./schema.js";

function serializeIntent(intent: Intent) {
  return {
    ...intent,
    amountIn: intent.amountIn.toString(),
    minAmountOut: intent.minAmountOut.toString(),
    nonce: intent.nonce.toString(),
    expiry: intent.expiry.toString(),
  };
}

function serializeStored(stored: StoredIntent) {
  return {
    intentHash: stored.intentHash,
    intent: serializeIntent(stored.intent),
    signature: stored.signature,
    status: stored.status,
    claimedBy: stored.claimedBy,
    createdAt: stored.createdAt,
  };
}

/** Builds the relayer's HTTP API around a fresh IntentPool for the given domain. */
export function createServer(domain: IntentDomain): Express {
  const pool = new IntentPool(domain);
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/intents", async (req, res) => {
    const parsed = submitIntentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      const stored = await pool.submit(parsed.data.intent as Intent, parsed.data.signature as Hex);
      res.status(201).json(serializeStored(stored));
    } catch (err) {
      if (err instanceof IntentValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  app.get("/intents", (_req, res) => {
    res.json(pool.listOpen().map(serializeStored));
  });

  app.get("/intents/:hash", (req, res) => {
    const stored = pool.get(req.params.hash as Hex);
    if (!stored) {
      res.status(404).json({ error: "unknown intent" });
      return;
    }
    res.json(serializeStored(stored));
  });

  app.post("/intents/:hash/claim", (req, res) => {
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      const stored = pool.claim(req.params.hash as Hex, parsed.data.agent as `0x${string}`);
      res.json(serializeStored(stored));
    } catch (err) {
      if (err instanceof IntentValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  app.post("/intents/:hash/settled", (req, res) => {
    try {
      const stored = pool.markSettled(req.params.hash as Hex);
      res.json(serializeStored(stored));
    } catch (err) {
      if (err instanceof IntentValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  return app;
}
