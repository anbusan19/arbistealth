"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton({ className = "" }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className={`group flex items-center gap-2 border border-white/10 bg-white/[0.02] px-3 py-1.5 font-geist-mono text-xs text-neutral-300 hover:border-cyan-400/40 hover:text-white ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        {address.slice(0, 6)}…{address.slice(-4)}
        <span className="text-neutral-600 group-hover:text-neutral-400">disconnect</span>
      </button>
    );
  }

  const connector = connectors[0];

  return (
    <button
      onClick={() => connector && connect({ connector })}
      disabled={!connector || isPending}
      className={`border border-cyan-400/40 bg-cyan-400/5 px-3 py-1.5 font-geist-mono text-xs tracking-wide text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-40 ${className}`}
    >
      {isPending ? "CONNECTING…" : "CONNECT WALLET"}
    </button>
  );
}
