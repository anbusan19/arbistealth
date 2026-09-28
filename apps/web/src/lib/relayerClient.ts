import type { Hex } from "viem";
import { serializeIntent, type Intent } from "./intent";

function relayerUrl(): string {
  const url = process.env.NEXT_PUBLIC_RELAYER_URL;
  if (!url) throw new Error("NEXT_PUBLIC_RELAYER_URL is not set");
  return url;
}

export interface OpenIntent {
  intentHash: Hex;
  intent: Record<string, string>;
  signature: Hex;
  status: "open" | "claimed" | "settled";
  createdAt: number;
}

export async function submitIntent(intent: Intent, signature: Hex): Promise<OpenIntent> {
  const res = await fetch(`${relayerUrl()}/intents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent: serializeIntent(intent), signature }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error ? JSON.stringify(body.error) : "failed to submit intent");
  }
  return body as OpenIntent;
}

export async function listOpenIntents(): Promise<OpenIntent[]> {
  const res = await fetch(`${relayerUrl()}/intents`);
  if (!res.ok) throw new Error("failed to list intents");
  return res.json();
}
