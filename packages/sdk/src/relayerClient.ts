import type { Hex } from "viem";
import { serializeIntent, type Intent } from "./intent.js";

export interface OpenIntent {
  intentHash: Hex;
  intent: Record<string, string>;
  signature: Hex;
  status: "open" | "claimed" | "settled";
  createdAt: number;
}

export interface RelayerRuntimeConfig {
  chainId: number;
  intentRegistry: Hex;
  preferredFeeAsset: Hex | null;
}

async function parseJsonOrThrow<T>(res: Response, fallbackMessage: string): Promise<T> {
  const body = (await res.json()) as { error?: unknown } & T;
  if (!res.ok) {
    throw new Error(body?.error ? JSON.stringify(body.error) : fallbackMessage);
  }
  return body;
}

/** Thin client for the ArbiStealth relayer's HTTP API. */
export class RelayerClient {
  constructor(private readonly baseUrl: string) {}

  async submitIntent(intent: Intent, signature: Hex): Promise<OpenIntent> {
    const res = await fetch(`${this.baseUrl}/intents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: serializeIntent(intent), signature }),
    });
    return parseJsonOrThrow<OpenIntent>(res, "failed to submit intent");
  }

  async listOpenIntents(): Promise<OpenIntent[]> {
    const res = await fetch(`${this.baseUrl}/intents`);
    return parseJsonOrThrow<OpenIntent[]>(res, "failed to list open intents");
  }

  async getIntent(intentHash: Hex): Promise<OpenIntent> {
    const res = await fetch(`${this.baseUrl}/intents/${intentHash}`);
    return parseJsonOrThrow<OpenIntent>(res, "failed to fetch intent");
  }

  async claimIntent(intentHash: Hex, agent: Hex): Promise<OpenIntent> {
    const res = await fetch(`${this.baseUrl}/intents/${intentHash}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent }),
    });
    return parseJsonOrThrow<OpenIntent>(res, "failed to claim intent");
  }

  async markSettled(intentHash: Hex): Promise<OpenIntent> {
    const res = await fetch(`${this.baseUrl}/intents/${intentHash}/settled`, { method: "POST" });
    return parseJsonOrThrow<OpenIntent>(res, "failed to mark intent settled");
  }

  async getConfig(): Promise<RelayerRuntimeConfig> {
    const res = await fetch(`${this.baseUrl}/config`);
    return parseJsonOrThrow<RelayerRuntimeConfig>(res, "failed to fetch relayer config");
  }
}
