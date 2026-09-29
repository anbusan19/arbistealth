"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { SectionLabel } from "../components/ui/SectionLabel";
import { Reveal } from "../components/ui/Reveal";
import CountUp from "../components/ui/CountUp";
import { CONTRACTS, arbiscanAddressUrl } from "../lib/contracts";

const LABELS: Record<keyof typeof CONTRACTS, string> = {
  intentRegistry: "IntentRegistry",
  stealthAnnouncer: "StealthAnnouncerAdapter",
  stealthMetaRegistry: "StealthMetaRegistryAdapter",
  identityRegistry: "SimpleAgentIdentityRegistry",
  reputationRegistry: "SimpleAgentReputationRegistry",
  validationRegistry: "SimpleAgentValidationRegistry",
  agentIdentity: "AgentIdentityAdapter",
  feeVault: "FeeVault",
  settlementRouter: "SettlementRouter",
};

const KEYS = Object.keys(CONTRACTS) as (keyof typeof CONTRACTS)[];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="rounded-md p-1.5 text-neutral-500 hover:bg-white/5 hover:text-white"
      aria-label="Copy address"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}

export function LiveDeployment() {
  return (
    <section className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1600px]">
        <Reveal>
          <SectionLabel index="§4">Live On Arbitrum Sepolia</SectionLabel>
        </Reveal>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Reveal delay={0.05}>
            <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Not a mockup — every contract below is deployed and verifiable.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <span className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-geist-mono text-[10px] tracking-wide text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <CountUp to={KEYS.length} duration={1.2} /> CONTRACTS LIVE
            </span>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-12 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {KEYS.map((key) => (
              <a
                key={key}
                href={arbiscanAddressUrl(CONTRACTS[key])}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col justify-between gap-2 px-6 py-4 transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center sm:px-8"
              >
                <span className="text-sm text-white">{LABELS[key]}</span>
                <div className="flex items-center gap-2">
                  <span className="font-geist-mono text-xs text-neutral-500 group-hover:text-accent">
                    {CONTRACTS[key]}
                  </span>
                  <CopyButton value={CONTRACTS[key]} />
                  <ExternalLink size={13} className="text-neutral-600 group-hover:text-accent" />
                </div>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
