"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { motion } from "motion/react";
import { PortalFieldCollection } from "@/shaders/portal-field/PortalFieldCollection";
import { Panel } from "@/components/ui/Panel";

export default function Login() {
  const { isConnected } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.replace("/dashboard");
  }, [isConnected, router]);

  const connector = connectors[0];

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#040508] p-6">
      <div className="absolute inset-0 z-0 opacity-40">
        <PortalFieldCollection variant="stream-convergence" speed={0.6} opacity={0.5} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <Panel className="p-8 text-center">
          <div className="font-geist-mono text-sm tracking-wide text-white">
            ARBI<span className="text-accent">STEALTH</span>
          </div>
          <p className="mt-3 text-sm text-neutral-400">
            Connect a wallet to submit intents, register a stealth meta-address, and settle privately on Arbitrum
            Sepolia.
          </p>

          <button
            onClick={() => connector && connect({ connector })}
            disabled={!connector || isPending}
            className="mt-8 w-full border border-accent/50 bg-accent/10 py-3 font-geist-mono text-xs tracking-wide text-accent-light transition-colors hover:bg-accent/20 disabled:opacity-40"
          >
            {isPending ? "CONNECTING…" : "CONNECT WALLET"}
          </button>

          {error && <p className="mt-4 text-xs text-red-400">{error.message}</p>}

          <p className="mt-6 font-geist-mono text-[10px] tracking-wide text-neutral-600">
            ARBITRUM SEPOLIA · TESTNET ONLY
          </p>
        </Panel>
      </motion.div>
    </div>
  );
}
