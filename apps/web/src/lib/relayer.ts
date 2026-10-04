import type { Address, Hex } from "viem";
import type { Intent } from "./intent";

/** Base URL of the off-chain relayer (apps/relayer) — defaults to its local dev port. */
export const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL ?? "http://localhost:8787";

export type IntentStatus = "open" | "claimed" | "settled";

export interface RelayerIntent {
  intentHash: Hex;
  intent: Intent;
  signature: Hex;
  status: IntentStatus;
  claimedBy?: Address;
  createdAt: number;
  settlementTxHash?: Hex;
}

interface WireIntent {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  minAmountOut: string;
  nonce: string;
  expiry: string;
}

function toWireIntent(intent: Intent): WireIntent {
  return {
    ...intent,
    amountIn: intent.amountIn.toString(),
    minAmountOut: intent.minAmountOut.toString(),
    nonce: intent.nonce.toString(),
    expiry: intent.expiry.toString(),
  };
}

function fromWireIntent(wire: WireIntent & RelayerIntent): RelayerIntent {
  return {
    ...wire,
    intent: {
      user: wire.intent.user,
      tokenIn: wire.intent.tokenIn,
      tokenOut: wire.intent.tokenOut,
      amountIn: BigInt(wire.intent.amountIn as unknown as string),
      minAmountOut: BigInt(wire.intent.minAmountOut as unknown as string),
      nonce: BigInt(wire.intent.nonce as unknown as string),
      expiry: BigInt(wire.intent.expiry as unknown as string),
    },
  };
}

/** Submits a signed intent to the relayer's off-chain pool — no on-chain tx, gasless for the user.
 *  It only becomes an on-chain IntentRegistry.submitIntent call once a solver settles it, since
 *  that call also burns the intent's nonce (submitting it on-chain directly first would make it
 *  un-settleable — see apps/relayer's intentPool.ts doc comment). */
export async function submitIntentToRelayer(intent: Intent, signature: Hex): Promise<RelayerIntent> {
  const res = await fetch(`${RELAYER_URL}/intents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent: toWireIntent(intent), signature }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error ? JSON.stringify(body.error) : `Relayer returned ${res.status}`);
  }
  return fromWireIntent(body);
}

/** Fetches a user's intents from the relayer, across all statuses (open/claimed/settled). */
export async function fetchMyRelayerIntents(user: Address): Promise<RelayerIntent[]> {
  const res = await fetch(`${RELAYER_URL}/intents?user=${user}`);
  if (!res.ok) throw new Error(`Relayer returned ${res.status}`);
  const body = (await res.json()) as (WireIntent & RelayerIntent)[];
  return body.map(fromWireIntent);
}

/** Registers interest in the mainnet launch. */
export async function joinMainnetWaitlist(email: string): Promise<void> {
  const res = await fetch(`${RELAYER_URL}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ? JSON.stringify(body.error) : `Relayer returned ${res.status}`);
  }
}
