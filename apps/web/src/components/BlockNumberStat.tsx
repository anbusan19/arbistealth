"use client";

import { useBlockNumber } from "wagmi";
import { motion, AnimatePresence } from "motion/react";
import { CHAIN_ID } from "@/lib/contracts";

/** Live-ticking block number, the "big number" anchor of the bento dashboard. */
export function BlockNumberStat() {
  const { data: blockNumber } = useBlockNumber({ watch: true, chainId: CHAIN_ID });
  const digits = blockNumber ? blockNumber.toString() : null;

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <span className="font-geist-mono text-[10px] tracking-[0.2em] text-accent/80 uppercase">
          Arbitrum Sepolia · Live Block
        </span>
        <span className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-geist-mono text-[10px] tracking-wide text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          LIVE
        </span>
      </div>

      <div className="mt-6 flex items-baseline gap-1 font-geist-mono text-4xl font-medium text-white tabular-nums sm:text-6xl">
        {digits ? (
          <AnimatePresence mode="popLayout">
            {digits.split("").map((d, i) => (
              <motion.span
                key={`${i}-${digits.length}`}
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {d}
              </motion.span>
            ))}
          </AnimatePresence>
        ) : (
          <span className="text-neutral-600">——————</span>
        )}
      </div>

      <p className="mt-4 max-w-sm text-xs leading-relaxed text-neutral-500">
        Ticks on every new block, read directly from the chain — no indexer, no cache.
      </p>
    </div>
  );
}
