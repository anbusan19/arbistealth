"use client";

import { EyeOff, Fingerprint, Zap } from "lucide-react";
import { SectionLabel } from "../components/ui/SectionLabel";
import { Reveal } from "../components/ui/Reveal";
import GlareHover from "../components/ui/GlareHover";

const PILLARS = [
  {
    icon: EyeOff,
    tag: "PRIVACY",
    standard: "ERC-5564 + ERC-6538",
    body: "One-time stealth addresses for trade output, announced on-chain but unlinkable without the recipient's viewing key.",
  },
  {
    icon: Fingerprint,
    tag: "AGENT IDENTITY",
    standard: "ERC-8004",
    body: "A portable on-chain identity, reputation history, and validation trail for the agent executing the trade.",
  },
  {
    icon: Zap,
    tag: "SETTLEMENT",
    standard: "x402",
    body: "Routing and execution fees settled as real, verifiable on-chain payments — attached as proof to the agent's reputation entry.",
  },
];

export function Solution() {
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

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.tag} delay={0.08 * i}>
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
                className="group h-full p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-8"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                  <pillar.icon size={18} strokeWidth={1.75} />
                </div>
                <div className="mt-5 font-geist-mono text-[10px] tracking-[0.2em] text-accent/80">{pillar.tag}</div>
                <div className="mt-2 font-geist-mono text-sm text-white">{pillar.standard}</div>
                <p className="mt-4 text-sm leading-relaxed text-neutral-400">{pillar.body}</p>
              </GlareHover>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
