"use client";

import { motion } from "motion/react";
import { SectionLabel } from "../components/ui/SectionLabel";
import { Reveal } from "../components/ui/Reveal";
import { ArchitectureDiagram } from "../components/ArchitectureDiagram";

const STEPS = [
  "User generates a stealth meta-address and registers it once via the meta-address registry.",
  "User signs an intent (asset in, asset out, min output, expiry) and hands it to their agent.",
  "Agent registers or reuses its ERC-8004 identity, then submits the intent to the relayer network.",
  "The matching engine finds a counterparty or route; the settlement router executes the trade.",
  "Output lands in a freshly derived stealth address, announced on-chain so the user can scan and claim it.",
  "The agent pays the routing fee through x402 — the receipt is attached to its reputation entry.",
];

export function Architecture() {
  return (
    <section className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1600px]">
        <Reveal>
          <SectionLabel index="§3">How It Works</SectionLabel>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mt-6 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
            From signed intent to private settlement.
          </h2>
        </Reveal>

        <ArchitectureDiagram />

        <div className="relative mt-16">
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top" }}
            className="absolute top-5 bottom-5 left-5 hidden w-px bg-gradient-to-b from-accent/40 via-white/10 to-transparent sm:block"
          />
          <ol className="flex flex-col gap-10">
            {STEPS.map((step, i) => (
              <Reveal key={i} delay={0.06 * i}>
                <li className="relative flex items-start gap-6">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.06 * i + 0.1, ease: "backOut" }}
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-[#040508] font-geist-mono text-xs text-accent"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </motion.span>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300 sm:text-base">{step}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
