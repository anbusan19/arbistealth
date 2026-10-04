"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { SectionLabel } from "../components/ui/SectionLabel";
import { Reveal } from "../components/ui/Reveal";
import { Panel } from "../components/ui/Panel";

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="border border-white/10 bg-white/[0.02] px-3 py-1.5 font-geist-mono text-[10px] tracking-wide text-neutral-400 uppercase">
      {children}
    </span>
  );
}

function PrivacyMock() {
  return (
    <Panel className="w-full max-w-sm p-6">
      <div className="font-geist-mono text-[10px] tracking-wide text-accent/80 uppercase">
        Stealth Meta-Address
      </div>
      <div className="mt-4 font-geist-mono text-[10px] tracking-wide text-neutral-500">LOCAL META-ADDRESS</div>
      <div className="mt-1 truncate font-geist-mono text-xs text-white">
        0x03d6ddcd454b05ce15533d7e6b23410…
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <span className="font-geist-mono text-[10px] tracking-wide text-neutral-500">VIEWING KEY</span>
          <span className="border border-red-900/50 bg-red-950/40 px-1.5 py-0.5 font-geist-mono text-[9px] tracking-wide text-red-400 uppercase">
            Sensitive
          </span>
        </div>
        <span className="font-geist-mono text-[10px] text-accent">REVEAL</span>
      </div>
      <div className="mt-2 truncate border border-white/10 bg-black/20 p-2.5 font-geist-mono text-[11px] text-neutral-600 italic">
        •••••••••••••••••••••••••••••••••
      </div>
    </Panel>
  );
}

function AgentMock() {
  return (
    <Panel className="w-full max-w-sm p-6">
      <div className="flex items-center gap-2 font-geist-mono text-[10px] tracking-wide text-emerald-300 uppercase">
        <span>✓</span>
        ERC-8004 Registered Agent
      </div>
      <div className="mt-4 font-geist-mono text-4xl text-white">#7</div>
      <div className="mt-5 border border-white/10 bg-white/[0.02] p-3">
        <div className="font-geist-mono text-[10px] tracking-wide text-neutral-500">REPUTATION ENTRIES</div>
        <div className="mt-1 font-geist-mono text-lg text-white">212</div>
      </div>
    </Panel>
  );
}

function SettlementMock() {
  return (
    <Panel className="w-full max-w-sm p-6">
      <div className="font-geist-mono text-[10px] tracking-wide text-accent/80 uppercase">
        Submit A Trade Intent
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="border border-white/10 bg-black/20 px-3 py-2 font-geist-mono text-[11px] text-neutral-400">
          100 USDG
        </div>
        <div className="border border-white/10 bg-black/20 px-3 py-2 font-geist-mono text-[11px] text-neutral-400">
          0.05 ETH
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 font-geist-mono text-[10px] text-neutral-500">
        <span>ROUTING FEE</span>
        <span className="text-accent-light">1.00 USDG</span>
      </div>
      <div className="mt-4 w-full border border-accent/50 bg-accent/10 py-2.5 text-center font-geist-mono text-[11px] tracking-wide text-accent-light">
        SIGN &amp; SUBMIT INTENT
      </div>
    </Panel>
  );
}

const PILLARS = [
  {
    tag: "PRIVACY",
    standard: "ERC-5564 + ERC-6538",
    title: "Trade output only you can identify.",
    body: "One-time stealth addresses for trade output, announced on-chain but unlinkable without the recipient's viewing key.",
    tags: ["ONE-TIME ADDRESSES", "VIEWING-KEY SCAN", "ON-CHAIN ANNOUNCEMENT"],
    mock: <PrivacyMock />,
  },
  {
    tag: "AGENT IDENTITY",
    standard: "ERC-8004",
    title: "A track record the agent can't fake.",
    body: "A portable on-chain identity, reputation history, and validation trail for the agent executing the trade.",
    tags: ["ON-CHAIN IDENTITY", "REPUTATION ENTRIES", "VALIDATION TRAIL"],
    mock: <AgentMock />,
  },
  {
    tag: "SETTLEMENT",
    standard: "x402-style fees",
    title: "Fees as proof, not promises.",
    body: "Routing and execution fees settled as real, verifiable on-chain payments — attached as proof to the agent's reputation entry.",
    tags: ["SIGNED INTENTS", "ROUTING FEE", "USDG SETTLEMENT"],
    mock: <SettlementMock />,
  },
];

function StagePanel({ pillar }: { pillar: (typeof PILLARS)[number] }) {
  const path = `~/arbistealth/${pillar.tag.toLowerCase().replace(/\s+/g, "-")}.sh`;

  return (
    <div className="overflow-hidden border border-white/10 bg-[#07080a]">
      <div className="flex items-center gap-4 border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-white/20" />
          <span className="h-2.5 w-2.5 rounded-full border border-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
        </div>
        <span className="font-geist-mono text-[11px] text-neutral-500">
          {path}
          <span className="ml-0.5 inline-block w-[7px] animate-pulse bg-accent/70 align-middle text-transparent">
            |
          </span>
        </span>
      </div>
      <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden p-10">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
          }}
        />
        <div className="relative">{pillar.mock}</div>
      </div>
    </div>
  );
}

export function Solution() {
  const [active, setActive] = useState(0);

  return (
    <section className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1600px]">
        <Reveal>
          <SectionLabel index="§2">The Solution</SectionLabel>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-end">
          <Reveal delay={0.05}>
            <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Three existing standards, one settlement flow.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-sm leading-relaxed text-neutral-400">
              A user submits a signed intent once. From there, the agent takes over: it finds a match, executes
              through the settlement router, pays the routing fee via x402, and the output lands in a stealth
              address only the user can identify.
            </p>
          </Reveal>
        </div>

        {/* Desktop: single sticky visual on the left, crossfading as the right-hand
         *  narrative scrolls past. Mobile: falls back to a simple per-pillar stack,
         *  since a pinned-visual scroll effect doesn't translate to small screens. */}
        <div className="mt-20 hidden lg:grid lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="sticky top-32 h-fit self-start">
            {/* Absolute-stacked crossfade, not AnimatePresence: `active` can jump
             *  by more than one step in a single fast scroll (onViewportEnter
             *  firing for several blocks in one paint), which left mode="wait"
             *  stuck mid-exit at ~0 opacity. Animating each layer's opacity
             *  independently can't get stuck regardless of how active changes. */}
            <div className="relative">
              {PILLARS.map((pillar, i) => (
                <motion.div
                  key={pillar.tag}
                  animate={{ opacity: active === i ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={active === i ? "relative" : "pointer-events-none absolute inset-0"}
                  aria-hidden={active !== i}
                >
                  <StagePanel pillar={pillar} />
                  <div className="mt-5 flex flex-wrap gap-2">
                    {pillar.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.tag}
                onViewportEnter={() => setActive(i)}
                viewport={{ amount: 0.6, margin: "-10% 0px -10% 0px" }}
                className="flex min-h-[60vh] flex-col justify-center py-12 first:pt-0 last:min-h-[40vh]"
              >
                <span className="font-geist-mono text-[10px] tracking-[0.2em] text-accent/80">{pillar.tag}</span>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <h3 className="text-2xl font-medium tracking-tight text-white sm:text-3xl">{pillar.title}</h3>
                  <span className="shrink-0 border border-accent/30 bg-accent/5 px-4 py-2 font-geist-mono text-[11px] tracking-wide text-accent-light">
                    {pillar.standard}
                  </span>
                </div>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-400">{pillar.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile fallback */}
        <div className="mt-20 flex flex-col gap-20 lg:hidden">
          {PILLARS.map((pillar) => (
            <div key={pillar.tag}>
              <Reveal>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-2xl font-medium tracking-tight text-white">{pillar.title}</h3>
                  <span className="shrink-0 border border-accent/30 bg-accent/5 px-4 py-2 font-geist-mono text-[11px] tracking-wide text-accent-light">
                    {pillar.standard}
                  </span>
                </div>
              </Reveal>
              <Reveal delay={0.05}>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">{pillar.body}</p>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="mt-8">
                  <StagePanel pillar={pillar} />
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="mt-5 flex flex-wrap gap-2">
                  {pillar.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
