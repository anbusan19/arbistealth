import { describe, expect, it } from "vitest";
import request from "supertest";
import { privateKeyToAccount } from "viem/accounts";
import { createServer } from "../src/server.js";
import type { RelayerConfig } from "../src/config.js";
import type { Intent, IntentDomain } from "../src/types.js";
import { INTENT_PRIMARY_TYPE, INTENT_TYPES } from "../src/types.js";

const account = privateKeyToAccount("0x833843cfdbc5668a9928e3ad1f5ff231a6aa16fc2ceb46f4b0b09a506fbeef43");

const domain: IntentDomain = {
  name: "ArbiStealthIntentRegistry",
  version: "1",
  chainId: 421614,
  verifyingContract: "0x0000000000000000000000000000000000000001",
};

const config: RelayerConfig = {
  port: 0,
  domain,
  usdgToken: "0x0000000000000000000000000000000000000042",
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

function serializeForWire(intent: Intent) {
  return {
    ...intent,
    amountIn: intent.amountIn.toString(),
    minAmountOut: intent.minAmountOut.toString(),
    nonce: intent.nonce.toString(),
    expiry: intent.expiry.toString(),
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

describe("relayer HTTP API", () => {
  it("GET /health returns ok", async () => {
    const app = createServer(config);
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /config exposes the domain and preferred fee asset", async () => {
    const app = createServer(config);
    const res = await request(app).get("/config");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      chainId: domain.chainId,
      intentRegistry: domain.verifyingContract,
      preferredFeeAsset: config.usdgToken,
    });
  });

  it("submits an intent, lists it, and rejects a nonce replay", async () => {
    const app = createServer(config);
    const intent = buildIntent();
    const signature = await signIntent(intent);

    const submitRes = await request(app)
      .post("/intents")
      .send({ intent: serializeForWire(intent), signature });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.status).toBe("open");

    const listRes = await request(app).get("/intents");
    expect(listRes.body).toHaveLength(1);

    const replay = buildIntent({ tokenIn: "0x0000000000000000000000000000000000000009" });
    const replaySignature = await signIntent(replay);
    const replayRes = await request(app)
      .post("/intents")
      .send({ intent: serializeForWire(replay), signature: replaySignature });

    expect(replayRes.status).toBe(400);
  });

  it("rejects a malformed intent body with 400", async () => {
    const app = createServer(config);
    const res = await request(app)
      .post("/intents")
      .send({ intent: { user: "not-an-address" }, signature: "0x00" });

    expect(res.status).toBe(400);
  });

  it("claim moves an intent out of the open list", async () => {
    const app = createServer(config);
    const intent = buildIntent();
    const signature = await signIntent(intent);

    const submitRes = await request(app)
      .post("/intents")
      .send({ intent: serializeForWire(intent), signature });

    const claimRes = await request(app)
      .post(`/intents/${submitRes.body.intentHash}/claim`)
      .send({ agent: "0x0000000000000000000000000000000000000099" });

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.status).toBe("claimed");

    const listRes = await request(app).get("/intents");
    expect(listRes.body).toHaveLength(0);
  });

  it("release reopens a claimed intent", async () => {
    const app = createServer(config);
    const intent = buildIntent();
    const signature = await signIntent(intent);
    const submitRes = await request(app)
      .post("/intents")
      .send({ intent: serializeForWire(intent), signature });
    await request(app)
      .post(`/intents/${submitRes.body.intentHash}/claim`)
      .send({ agent: "0x0000000000000000000000000000000000000099" });

    const releaseRes = await request(app).post(`/intents/${submitRes.body.intentHash}/release`).send({});

    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.status).toBe("open");

    const listRes = await request(app).get("/intents");
    expect(listRes.body).toHaveLength(1);
  });

  it("GET /intents?user= returns that user's intents across all statuses", async () => {
    const app = createServer(config);
    const intent = buildIntent();
    const signature = await signIntent(intent);
    const submitRes = await request(app)
      .post("/intents")
      .send({ intent: serializeForWire(intent), signature });
    await request(app)
      .post(`/intents/${submitRes.body.intentHash}/claim`)
      .send({ agent: "0x0000000000000000000000000000000000000099" });

    const res = await request(app).get(`/intents?user=${account.address}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe("claimed");
  });

  it("GET /intents?user= rejects a malformed address", async () => {
    const app = createServer(config);
    const res = await request(app).get("/intents?user=not-an-address");
    expect(res.status).toBe(400);
  });

  it("settled accepts and stores a settlement tx hash", async () => {
    const app = createServer(config);
    const intent = buildIntent();
    const signature = await signIntent(intent);
    const submitRes = await request(app)
      .post("/intents")
      .send({ intent: serializeForWire(intent), signature });
    await request(app)
      .post(`/intents/${submitRes.body.intentHash}/claim`)
      .send({ agent: "0x0000000000000000000000000000000000000099" });

    const txHash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const settledRes = await request(app)
      .post(`/intents/${submitRes.body.intentHash}/settled`)
      .send({ txHash });

    expect(settledRes.status).toBe(200);
    expect(settledRes.body.status).toBe("settled");
    expect(settledRes.body.settlementTxHash).toBe(txHash);
  });
});
