"use client";

import Link from "next/link";
import { Layers, ShieldCheck, BadgeCheck, Coins, CheckCircle2, ArrowUpRight, Sparkles } from "lucide-react";
import Dither from "@/components/ui/Dither";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";
import GlareHover from "@/components/ui/GlareHover";
import { Problem } from "@/sections/Problem";
import { Solution } from "@/sections/Solution";
import { Architecture } from "@/sections/Architecture";
import { LiveDeployment } from "@/sections/LiveDeployment";
import { CTAFooter } from "@/sections/CTAFooter";

const WHY = [
  {
    icon: Layers,
    title: "Standards, not new cryptography",
    body: "Composes ERC-5564 + ERC-6538 (stealth), ERC-8004 (agent identity), and x402 (settlement) instead of inventing new primitives — composable with the wider ecosystem, and a smaller audit surface.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy and accountability, not one or the other",
    body: "Most tools force a choice. Here the trade destination stays private via stealth addresses, while what the agent executed stays fully auditable.",
  },
  {
    icon: BadgeCheck,
    title: "Reputation backed by real payment",
    body: "Every reputation entry references the x402 receipt that paid for that settlement — a track record you can verify, not a self-reported log.",
  },
  {
    icon: Coins,
    title: "USDG-denominated fees",
    body: "Routing fees settle in Paxos USDG, the explicit judging bonus called out for both the Overall and Promising Products tracks.",
  },
];

const ROADMAP = [
  {
    status: "DONE",
    icon: CheckCircle2,
    title: "Phase 1 — Arbitrum Sepolia",
    body: "Core protocol working end to end: intent, match, stealth settlement, agent identity, fee payment. 9 contracts deployed, 31/31 tests passing.",
  },
  {
    status: "NEXT",
    icon: ArrowUpRight,
    title: "Phase 2 — Arbitrum One",
    body: "Mainnet deployment once SettlementRouter and FeeVault — the protocol's core trust boundary — have been reviewed.",
  },
  {
    status: "STRETCH",
    icon: Sparkles,
    title: "Phase 3 — Robinhood Chain",
    body: "Port the settlement router and adapters to compete for the reserved prize track, once Phases 1 and 2 are solid.",
  },
];

function Slide({
  children,
  dither,
  className = "",
}: {
  children: React.ReactNode;
  dither?: boolean;
  className?: string;
}) {
  return (
    <section
      className={`relative flex h-screen w-full shrink-0 snap-start snap-always flex-col justify-center overflow-hidden px-6 sm:px-10 lg:px-16 ${className}`}
    >
      {dither && (
        <>
          <div className="absolute inset-0 z-0">
            <Dither
              waveColor={[0.43529411764705883, 0.6509803921568628, 0.8235294117647058]}
              disableAnimation={false}
              enableMouseInteraction={true}
              mouseRadius={0.3}
              colorNum={4}
              waveAmplitude={0.3}
              waveFrequency={3}
              waveSpeed={0.2}
            />
          </div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#040508]/30 via-[#040508]/55 to-[#040508]/95" />
        </>
      )}
      <div className="relative z-10 mx-auto w-full max-w-[1600px]">{children}</div>
    </section>
  );
}

export default function Pitch() {
  return (
    <div className="h-screen w-full snap-y snap-mandatory overflow-y-scroll bg-[#040508] text-white">
      <Slide dither className="items-start justify-end pb-24">
        <p className="font-geist-mono text-xs tracking-[0.3em] text-accent-light uppercase">
          Arbitrum Open House Singapore &middot; Buildathon
        </p>
        <h1 className="mt-6 text-6xl font-medium tracking-tight text-white sm:text-8xl">ArbiStealth</h1>
        <p className="mt-6 max-w-xl text-lg text-neutral-300 sm:text-xl">
          Private trade execution with verifiable agent accountability.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6 font-geist-mono text-xs tracking-wide text-neutral-400">
          <span>github.com/anbusan19/arbistealth</span>
          <span className="h-3 w-px bg-white/20" />
          <span>Built on Arbitrum</span>
        </div>
      </Slide>

      <Slide>
        <Problem />
      </Slide>

      <Slide>
        <Solution />
      </Slide>

      <Slide>
        <Architecture />
      </Slide>

      <Slide>
        <LiveDeployment />
      </Slide>

      <Slide>
        <div className="px-6 py-24 sm:px-10 lg:px-16">
          <Reveal>
            <SectionLabel index="§5">Why ArbiStealth</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Not a demo — a protocol built to be depended on.
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={0.08 * i}>
                <GlareHover
                  width="100%"
                  height="100%"
                  background="rgba(255,255,255,0.02)"
                  borderColor="rgba(255,255,255,0.1)"
                  borderRadius="1rem"
                  glareColor="#6fa6d2"
                  glareOpacity={0.2}
                  glareAngle={-30}
                  glareSize={300}
                  transitionDuration={600}
                  className="group h-full p-6 sm:p-8"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                    <w.icon size={18} strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 text-base font-medium text-white">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">{w.body}</p>
                </GlareHover>
              </Reveal>
            ))}
          </div>
        </div>
      </Slide>

      <Slide>
        <div className="px-6 py-24 sm:px-10 lg:px-16">
          <Reveal>
            <SectionLabel index="§6">Roadmap</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Sepolia today, Arbitrum One once it&apos;s reviewed.
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {ROADMAP.map((r, i) => (
              <Reveal key={r.title} delay={0.08 * i}>
                <div className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                  <span className="flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-geist-mono text-[10px] tracking-wide text-accent-light">
                    <r.icon size={12} />
                    {r.status}
                  </span>
                  <h3 className="text-base font-medium text-white">{r.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-400">{r.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <p className="mt-10 font-geist-mono text-xs tracking-wide text-neutral-500">
              Submitting to both the Buildathon and a direct Founder House application — not mutually exclusive.
            </p>
          </Reveal>
        </div>
      </Slide>

      <Slide dither>
        <CTAFooter />
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="font-geist-mono text-xs tracking-wide text-neutral-400 hover:text-white"
          >
            Back to arbistealth.xyz
          </Link>
        </div>
      </Slide>
    </div>
  );
}
