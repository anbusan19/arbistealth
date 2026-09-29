"use client";

import { Radio, ShieldOff, UserX, Link2Off } from "lucide-react";
import { SectionLabel } from "../components/ui/SectionLabel";
import { Reveal } from "../components/ui/Reveal";

const PROBLEMS = [
  {
    icon: Radio,
    title: "Every trade is a broadcast",
    body: "Intent-based DEXs leak sender, size, and timing — enough metadata to enable front-running and MEV extraction.",
  },
  {
    icon: ShieldOff,
    title: "Privacy tools have no execution logic",
    body: "Wallet-level privacy tools have no logic attached, and mixers trade UX for privacy. Neither fits an agent-driven trade flow.",
  },
  {
    icon: UserX,
    title: "Agents have no track record",
    body: "As trading agents become common, there's no standard way to prove what an agent actually executed — unless you sacrifice trade privacy entirely.",
  },
  {
    icon: Link2Off,
    title: "Reputation isn't portable",
    body: "Existing agent frameworks lack a chain-native reputation system tied to real settled payments, rather than self-reported logs.",
  },
];

export function Problem() {
  return (
    <section className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel index="§1">The Problem</SectionLabel>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mt-6 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Public settlement forces a choice between privacy and accountability.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={0.08 * i}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors duration-300 hover:border-accent/30 hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                  <p.icon size={18} strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-base font-medium text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
