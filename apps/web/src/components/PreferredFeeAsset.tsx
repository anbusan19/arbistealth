"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRelayerConfig } from "@/lib/relayerClient";

export function PreferredFeeAsset() {
  const { data } = useQuery({
    queryKey: ["relayer-config"],
    queryFn: fetchRelayerConfig,
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.preferredFeeAsset) return null;

  return (
    <p className="text-xs text-black/50">
      Routing fees settle preferentially in{" "}
      <span className="font-mono">USDG ({data.preferredFeeAsset.slice(0, 6)}…{data.preferredFeeAsset.slice(-4)})</span>
    </p>
  );
}
