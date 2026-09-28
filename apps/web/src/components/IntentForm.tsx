"use client";

import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { parseUnits, type Address, type Hex } from "viem";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INTENT_PRIMARY_TYPE, INTENT_TYPES, intentDomain, type Intent } from "@/lib/intent";
import { submitIntent } from "@/lib/relayerClient";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 421614);
const INTENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS as Address | undefined;

function randomNonce(): bigint {
  return BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000));
}

export function IntentForm() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const queryClient = useQueryClient();

  const [tokenIn, setTokenIn] = useState("");
  const [tokenOut, setTokenOut] = useState("");
  const [amountIn, setAmountIn] = useState("");
  const [minAmountOut, setMinAmountOut] = useState("");
  const [expiryMinutes, setExpiryMinutes] = useState("60");

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("connect a wallet first");
      if (!INTENT_REGISTRY_ADDRESS) throw new Error("NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS is not set");

      const intent: Intent = {
        user: address,
        tokenIn: tokenIn as Address,
        tokenOut: tokenOut as Address,
        amountIn: parseUnits(amountIn, 18),
        minAmountOut: parseUnits(minAmountOut, 18),
        nonce: randomNonce(),
        expiry: BigInt(Math.floor(Date.now() / 1000) + Number(expiryMinutes) * 60),
      };

      const domain = intentDomain(CHAIN_ID, INTENT_REGISTRY_ADDRESS);
      const signature = (await signTypedDataAsync({
        domain,
        types: INTENT_TYPES,
        primaryType: INTENT_PRIMARY_TYPE,
        message: intent,
      })) as Hex;

      return submitIntent(intent, signature);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-intents"] });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate();
      }}
      className="flex flex-col gap-3 rounded-lg border border-black/10 p-4"
    >
      <h2 className="text-sm font-semibold">New trade intent</h2>

      <label className="flex flex-col gap-1 text-sm">
        Token in (address)
        <input
          value={tokenIn}
          onChange={(e) => setTokenIn(e.target.value)}
          placeholder="0x…"
          className="rounded-md border border-black/10 px-2 py-1 font-mono text-xs"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Token out (address)
        <input
          value={tokenOut}
          onChange={(e) => setTokenOut(e.target.value)}
          placeholder="0x…"
          className="rounded-md border border-black/10 px-2 py-1 font-mono text-xs"
          required
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Amount in
          <input
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="1.0"
            className="rounded-md border border-black/10 px-2 py-1"
            required
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Min amount out
          <input
            value={minAmountOut}
            onChange={(e) => setMinAmountOut(e.target.value)}
            placeholder="0.95"
            className="rounded-md border border-black/10 px-2 py-1"
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Expires in (minutes)
        <input
          value={expiryMinutes}
          onChange={(e) => setExpiryMinutes(e.target.value)}
          type="number"
          min="1"
          className="rounded-md border border-black/10 px-2 py-1"
        />
      </label>

      <button
        type="submit"
        disabled={!address || isPending}
        className="mt-2 rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80 disabled:opacity-50"
      >
        {isPending ? "Signing & submitting…" : "Sign & submit intent"}
      </button>

      {error && <p className="text-sm text-red-600">{error.message}</p>}
      {isSuccess && <p className="text-sm text-green-700">Intent submitted to the relayer.</p>}
    </form>
  );
}
