import type { IntentDomain } from "./types.js";

export interface RelayerConfig {
  port: number;
  domain: IntentDomain;
  /** Paxos USDG address, the protocol's preferred fee settlement asset. Informational only. */
  usdgToken?: `0x${string}`;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/** Reads relayer configuration from environment variables. */
export function loadConfig(): RelayerConfig {
  const chainId = Number(requireEnv("CHAIN_ID"));
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error("CHAIN_ID must be a positive integer");
  }

  return {
    port: Number(process.env.PORT ?? 8787),
    domain: {
      name: "ArbiStealthIntentRegistry",
      version: "1",
      chainId,
      verifyingContract: requireEnv("INTENT_REGISTRY_ADDRESS") as `0x${string}`,
    },
    usdgToken: process.env.USDG_TOKEN as `0x${string}` | undefined,
  };
}
