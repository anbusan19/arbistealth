"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAccount, useSwitchChain } from "wagmi";
import type { Address } from "viem";
import { Panel } from "@/components/ui/Panel";
import { CHAIN_ID } from "@/lib/contracts";

function ConnectGate() {
  return (
    <Panel className="mx-auto max-w-md p-8 text-center" dither>
      <p className="text-sm text-neutral-400">Connect a wallet to continue.</p>
      <Link
        href="/login"
        className="mt-6 inline-block border border-accent/50 bg-accent/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-accent-light hover:bg-accent/20"
      >
        CONNECT WALLET
      </Link>
    </Panel>
  );
}

function NetworkGuard() {
  const { switchChain, isPending, error } = useSwitchChain();

  return (
    <Panel className="mx-auto max-w-md p-8 text-center" dither>
      <p className="text-sm text-neutral-400">
        Your wallet is connected to the wrong network. ArbiStealth runs on Arbitrum Sepolia — switch to see real
        balances and gas costs.
      </p>
      <button
        onClick={() => switchChain({ chainId: CHAIN_ID })}
        disabled={isPending}
        className="mt-6 inline-block border border-accent/50 bg-accent/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-accent-light hover:bg-accent/20 disabled:opacity-40"
      >
        {isPending ? "SWITCHING…" : "SWITCH TO ARBITRUM SEPOLIA"}
      </button>
      {error && <p className="mt-3 text-xs text-red-400">{error.message}</p>}
    </Panel>
  );
}

/** Shared gate for every app page: connect-wallet prompt, then a network-mismatch
 *  prompt, before rendering the page's real content with a guaranteed address. */
export function RequireWallet({ children }: { children: (address: Address) => ReactNode }) {
  const { address, isConnected, chainId } = useAccount();

  if (!isConnected || !address) return <ConnectGate />;
  if (chainId !== CHAIN_ID) return <NetworkGuard />;
  return <>{children(address)}</>;
}
