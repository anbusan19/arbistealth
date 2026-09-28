"use client";

import { useQuery } from "@tanstack/react-query";
import { listOpenIntents } from "@/lib/relayerClient";

export function OpenIntents() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["open-intents"],
    queryFn: listOpenIntents,
    refetchInterval: 5000,
  });

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
      <h2 className="text-sm font-semibold">Open intents</h2>

      {isLoading && <p className="text-sm text-black/50">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load open intents.</p>}
      {data && data.length === 0 && <p className="text-sm text-black/50">No open intents right now.</p>}

      <ul className="flex flex-col gap-2">
        {data?.map((stored) => (
          <li key={stored.intentHash} className="rounded-md bg-black/5 p-2 text-xs font-mono">
            <div>{stored.intentHash}</div>
            <div className="text-black/60">
              {stored.intent.tokenIn} → {stored.intent.tokenOut} · amountIn {stored.intent.amountIn}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
