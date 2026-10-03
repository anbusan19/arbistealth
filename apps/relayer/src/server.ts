import express, { type Express } from "express";
import type { Hex } from "viem";
import type { RelayerConfig } from "./config.js";
import { IntentPool, IntentValidationError, type StoredIntent } from "./intentPool.js";
import type { Intent } from "./types.js";
import { claimSchema, settledSchema, submitIntentSchema } from "./schema.js";

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
    settlementTxHash: stored.settlementTxHash,
  };
}

/** Builds the relayer's HTTP API around a fresh IntentPool for the given config. */
export function createServer(config: RelayerConfig): Express {
  const { domain } = config;
  const pool = new IntentPool(domain);
  const app = express();
  app.use(express.json());

  // Minimal hand-rolled CORS: the web app (a different origin in dev and prod)
  // needs to POST/GET here directly from the browser.
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });
  app.options(/.*/, (_req, res) => res.sendStatus(204));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/config", (_req, res) => {
    res.json({
      chainId: domain.chainId,
      intentRegistry: domain.verifyingContract,
      preferredFeeAsset: config.usdgToken ?? null,
    });
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

  app.get("/intents", (req, res) => {
    const user = req.query.user;
    if (typeof user === "string") {
      if (!/^0x[0-9a-fA-F]{40}$/.test(user)) {
        res.status(400).json({ error: "user must be a 20-byte hex address" });
        return;
      }
      res.json(pool.listByUser(user as `0x${string}`).map(serializeStored));
      return;
    }
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
    const parsed = settledSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      const stored = pool.markSettled(req.params.hash as Hex, parsed.data.txHash as Hex | undefined);
      res.json(serializeStored(stored));
    } catch (err) {
      if (err instanceof IntentValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  app.post("/intents/:hash/release", (req, res) => {
    try {
      const stored = pool.release(req.params.hash as Hex);
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
