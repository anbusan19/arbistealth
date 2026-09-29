import { afterEach, describe, expect, it, vi } from "vitest";
import { RelayerClient } from "../src/relayerClient.js";
import type { Intent } from "../src/intent.js";

const BASE_URL = "https://relayer.example";

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

const intent: Intent = {
  user: "0x0000000000000000000000000000000000000001",
  tokenIn: "0x0000000000000000000000000000000000000002",
  tokenOut: "0x0000000000000000000000000000000000000003",
  amountIn: 1_000_000_000_000_000_000n,
  minAmountOut: 900_000_000_000_000_000n,
  nonce: 0n,
  expiry: 9_999_999_999n,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RelayerClient", () => {
  it("submitIntent posts a JSON-serialized intent and returns the stored intent", async () => {
    const stored = { intentHash: "0xabc", intent: {}, signature: "0xsig", status: "open", createdAt: 1 };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(stored));
    vi.stubGlobal("fetch", fetchMock);

    const client = new RelayerClient(BASE_URL);
    const result = await client.submitIntent(intent, "0xsig");

    expect(result).toEqual(stored);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/intents`,
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.intent.amountIn).toBe("1000000000000000000");
  });

  it("throws with the server's error message on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "nonce already used" }, false)));

    const client = new RelayerClient(BASE_URL);
    await expect(client.submitIntent(intent, "0xsig")).rejects.toThrow("nonce already used");
  });

  it("getConfig returns the relayer's runtime config", async () => {
    const config = { chainId: 421614, intentRegistry: "0xreg", preferredFeeAsset: "0xusdg" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(config)));

    const client = new RelayerClient(BASE_URL);
    await expect(client.getConfig()).resolves.toEqual(config);
  });

  it("listOpenIntents GETs /intents", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    const client = new RelayerClient(BASE_URL);
    await client.listOpenIntents();

    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/intents`);
  });
});
