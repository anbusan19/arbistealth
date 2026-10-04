"use client";

import { Fragment } from "react";
import { SectionLabel } from "../components/ui/SectionLabel";
import { Reveal } from "../components/ui/Reveal";
import { Panel } from "../components/ui/Panel";

const STEPS = [
  { id: "sign", label: "01 · SIGN INTENT" },
  { id: "settle", label: "02 · AGENT SETTLES" },
  { id: "announce", label: "03 · ANNOUNCED ON-CHAIN" },
];

export function TraceFlow() {
  return (
    <section className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1600px]">
        <Reveal>
          <SectionLabel index="§4">Trace A Settlement</SectionLabel>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mt-6 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Every field below is a real event shape, not placeholder JSON.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-16 flex items-center justify-center">
            {STEPS.map((step, i) => (
              <Fragment key={step.id}>
                {i > 0 && <div className="h-px flex-1 border-t border-dashed border-white/15" />}
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 font-geist-mono text-[11px] tracking-wide text-neutral-400">
                  {step.label}
                </span>
              </Fragment>
            ))}
          </div>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Reveal delay={0.15}>
            <Panel className="h-full p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-geist-mono text-[10px] text-accent">
                  U
                </span>
                <span className="truncate font-geist-mono text-xs text-white">0x4C09…3C8a</span>
                <span className="ml-auto shrink-0 font-geist-mono text-[10px] text-neutral-500">EIP-712</span>
              </div>
              <div className="mt-5 space-y-2 font-geist-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">tokenIn</span>
                  <span className="text-white">100.00 USDG</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">tokenOut</span>
                  <span className="text-white">0.0400 WETH min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">nonce</span>
                  <span className="text-neutral-400">0x7f3a…</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="text-neutral-500">expiry</span>
                  <span className="text-accent-light">59:42</span>
                </div>
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={0.2}>
            <Panel className="h-full p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 font-geist-mono text-[10px] text-emerald-300">
                  #7
                </span>
                <span className="font-geist-mono text-xs text-white">Agent #7</span>
                <span className="ml-auto shrink-0 font-geist-mono text-[10px] text-emerald-300">212 REP</span>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-neutral-400">
                Matched <span className="text-white">0.0412 WETH</span>{" "}
                <span className="text-emerald-300">(+0.0012 above minimum)</span>
              </p>
              <div className="mt-5 w-full border border-accent/50 bg-accent/10 py-2.5 text-center font-geist-mono text-[11px] tracking-wide text-accent-light">
                EXECUTE SETTLEMENT
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={0.25}>
            <div className="h-full overflow-hidden border border-white/10 bg-[#07080a]">
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border border-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full border border-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                </div>
                <span className="font-geist-mono text-[11px] text-neutral-500">SettlementExecuted</span>
              </div>
              <pre className="overflow-x-auto p-4 font-geist-mono text-[11px] leading-relaxed text-neutral-300">
                <span className="text-neutral-500">{"{"}</span>
                {"\n  "}
                <span className="text-accent-light">&quot;agentId&quot;</span>: 7,{"\n  "}
                <span className="text-accent-light">&quot;stealthAddress&quot;</span>:{" "}
                <span className="text-white">&quot;0x9c3f…728e&quot;</span>,{"\n  "}
                <span className="text-accent-light">&quot;amountOut&quot;</span>:{" "}
                <span className="text-white">&quot;0.0412&quot;</span>,{"\n  "}
                <span className="text-accent-light">&quot;receiptHash&quot;</span>:{" "}
                <span className="text-white">&quot;0x9928…1a04&quot;</span>
                {"\n"}
                <span className="text-neutral-500">{"}"}</span>
              </pre>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <p className="mt-8 text-center font-geist-mono text-xs text-neutral-600 italic">
            {"// this intent, agent, and receipt are illustrative — the same three fields are real on every"}{" "}
            {"settlement on Arbiscan."}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
