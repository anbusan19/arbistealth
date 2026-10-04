"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";
import { Panel } from "@/components/ui/Panel";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { CONTRACTS, CONTRACT_LABELS, EXTERNAL, arbiscanAddressUrl } from "@/lib/contracts";

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "contracts", label: "Contracts" },
  { id: "intent-flow", label: "Intent Flow" },
  { id: "sdk", label: "SDK" },
  { id: "relayer-api", label: "Relayer API" },
  { id: "security", label: "Security" },
  { id: "getting-started", label: "Getting Started" },
];

const CONTRACT_KEYS = Object.keys(CONTRACTS) as (keyof typeof CONTRACTS)[];

function DocSection({ id, index, title, children }: { id: string; index: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 border-t border-white/10 py-14 first:border-t-0 first:pt-0">
      <Reveal>
        <SectionLabel index={index}>{title}</SectionLabel>
      </Reveal>
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-3xl text-sm leading-relaxed text-neutral-400">{children}</p>;
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-medium tracking-tight text-white">{children}</h3>;
}

export default function DocsPage() {
  return (
    <AppLayout>
      {/* Docs is mostly plain paragraph text directly over the animated
       *  PixelBlast background (unlike dashboard/explorer, which keep text
       *  inside opaque Panel cards), so it needs its own dimming scrim to
       *  stay legible. */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[#040508]/75" aria-hidden="true" />
      <div className="relative z-[2] mx-auto max-w-[1400px]">
        <Reveal>
          <SectionLabel index="DOCS">ArbiStealth Protocol Documentation</SectionLabel>
          <h1 className="mt-6 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Private trade execution with verifiable agent accountability.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400">
            A reference for how ArbiStealth is built: the three standards it combines, every deployed contract,
            the intent lifecycle, and the SDK and relayer API surfaces other teams can build against.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr]">
          {/* Sidebar nav */}
          <aside className="hidden lg:block">
            <nav className="sticky top-32 flex flex-col gap-1 border-l border-white/10 pl-4">
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="py-1.5 font-geist-mono text-xs tracking-wide text-neutral-500 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="https://github.com/anbusan19/arbistealth"
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-1.5 py-1.5 font-geist-mono text-xs tracking-wide text-accent-light hover:text-white"
              >
                GitHub <ExternalLink size={11} />
              </a>
            </nav>
          </aside>

          {/* Content */}
          <div>
            <DocSection id="overview" index="§1" title="Overview">
              <P>
                Most DEX activity on public chains leaks two things: who is trading, and what an autonomous agent
                acting on a user&apos;s behalf actually did. ArbiStealth separates these concerns instead of trying
                to hide everything or reveal everything.
              </P>
              <ul className="max-w-3xl space-y-2 text-sm leading-relaxed text-neutral-400">
                <li>
                  <span className="text-white">Trade destination stays private</span> — stealth addresses
                  (ERC-5564 + ERC-6538) mean a trade can&apos;t be trivially linked back to a user&apos;s known
                  wallet.
                </li>
                <li>
                  <span className="text-white">What the agent did stays fully verifiable</span> — an on-chain
                  agent identity, reputation, and validation layer (ERC-8004), backed by real payment receipts
                  (x402).
                </li>
              </ul>
              <p className="font-geist-mono text-xs tracking-wide text-accent-light italic">
                {"// private settlement, public accountability."}
              </p>
            </DocSection>

            <DocSection id="architecture" index="§2" title="Architecture">
              <P>
                A user submits a signed intent once. From there, the agent takes over: it finds a match, executes
                through the settlement router, pays the routing fee via x402, and the output lands in a stealth
                address only the user can identify.
              </P>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Panel className="p-5">
                  <span className="font-geist-mono text-[10px] tracking-[0.2em] text-accent/80 uppercase">
                    Privacy Layer
                  </span>
                  <H3>ERC-5564 + ERC-6538</H3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                    One-time stealth addresses for trade output, announced on-chain but unlinkable without the
                    recipient&apos;s viewing key.
                  </p>
                </Panel>
                <Panel className="p-5">
                  <span className="font-geist-mono text-[10px] tracking-[0.2em] text-accent/80 uppercase">
                    Agent Identity Layer
                  </span>
                  <H3>ERC-8004</H3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                    A portable on-chain identity, reputation history, and validation trail for the agent executing
                    the trade.
                  </p>
                </Panel>
                <Panel className="p-5">
                  <span className="font-geist-mono text-[10px] tracking-[0.2em] text-accent/80 uppercase">
                    Payment Layer
                  </span>
                  <H3>x402-style fees</H3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                    Routing and execution fees settled as real, verifiable on-chain payments, attached as proof to
                    the agent&apos;s reputation entry.
                  </p>
                </Panel>
              </div>

              <div className="mt-8">
                <H3>Flow summary</H3>
                <ol className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-neutral-400">
                  <li>
                    <span className="font-geist-mono text-accent-light">01.</span> User generates a stealth
                    meta-address and registers it once via the ERC-6538 meta-address registry.
                  </li>
                  <li>
                    <span className="font-geist-mono text-accent-light">02.</span> User signs an intent (asset in,
                    asset out, min output, expiry) and hands it to their agent.
                  </li>
                  <li>
                    <span className="font-geist-mono text-accent-light">03.</span> Agent registers or reuses its
                    ERC-8004 identity, then submits the intent to the relayer network.
                  </li>
                  <li>
                    <span className="font-geist-mono text-accent-light">04.</span> The settlement router executes
                    the matched trade on-chain.
                  </li>
                  <li>
                    <span className="font-geist-mono text-accent-light">05.</span> Trade output is sent to a
                    freshly derived stealth address, with an announcement event emitted on-chain so the user can
                    scan and claim it.
                  </li>
                  <li>
                    <span className="font-geist-mono text-accent-light">06.</span> The agent pays the routing fee
                    through x402. The receipt is attached to the agent&apos;s reputation entry, so its track record
                    is auditable without revealing who it traded for.
                  </li>
                </ol>
              </div>
            </DocSection>

            <DocSection id="contracts" index="§3" title="Deployed Contracts">
              <P>
                Live on Arbitrum Sepolia (chain id <span className="text-white">421614</span>), verified on both
                Sourcify and Arbiscan.
              </P>
              <div className="divide-y divide-white/10 border border-white/10 bg-white/[0.02]">
                {CONTRACT_KEYS.map((key) => (
                  <a
                    key={key}
                    href={arbiscanAddressUrl(CONTRACTS[key])}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col justify-between gap-2 px-6 py-4 transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center sm:px-8"
                  >
                    <span className="text-sm text-white">{CONTRACT_LABELS[key]}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-geist-mono text-xs text-neutral-500 group-hover:text-accent">
                        {CONTRACTS[key]}
                      </span>
                      <ExternalLink size={13} className="text-neutral-600 group-hover:text-accent" />
                    </div>
                  </a>
                ))}
              </div>
              <div>
                <H3>External, canonical registries</H3>
                <p className="mt-2 max-w-3xl text-xs leading-relaxed text-neutral-400">
                  ArbiStealth integrates with the already-deployed ERC-5564 announcer and ERC-6538 registry rather
                  than redeploying its own copies, keeping the protocol composable with other tools built on those
                  standards.
                </p>
                <div className="mt-4 divide-y divide-white/10 border border-white/10 bg-white/[0.02]">
                  <a
                    href={arbiscanAddressUrl(EXTERNAL.erc5564Announcer)}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col justify-between gap-2 px-6 py-4 transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center sm:px-8"
                  >
                    <span className="text-sm text-white">ERC-5564 Announcer (canonical)</span>
                    <span className="font-geist-mono text-xs text-neutral-500 group-hover:text-accent">
                      {EXTERNAL.erc5564Announcer}
                    </span>
                  </a>
                  <a
                    href={arbiscanAddressUrl(EXTERNAL.erc6538Registry)}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col justify-between gap-2 px-6 py-4 transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center sm:px-8"
                  >
                    <span className="text-sm text-white">ERC-6538 Registry (canonical)</span>
                    <span className="font-geist-mono text-xs text-neutral-500 group-hover:text-accent">
                      {EXTERNAL.erc6538Registry}
                    </span>
                  </a>
                  <a
                    href={arbiscanAddressUrl(EXTERNAL.usdg)}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col justify-between gap-2 px-6 py-4 transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center sm:px-8"
                  >
                    <span className="text-sm text-white">USDG (Paxos, preferred fee asset)</span>
                    <span className="font-geist-mono text-xs text-neutral-500 group-hover:text-accent">
                      {EXTERNAL.usdg}
                    </span>
                  </a>
                </div>
              </div>
            </DocSection>

            <DocSection id="intent-flow" index="§4" title="Intent Flow">
              <P>
                An intent is an EIP-712 typed message, signed off-chain by the user and only ever submitted
                on-chain once — inside <code className="text-accent-light">SettlementRouter.executeSettlement</code>,
                which internally calls <code className="text-accent-light">IntentRegistry.submitIntent</code>.
              </P>
              <CodeBlock path="~/arbistealth/intent.ts">
                <span className="text-neutral-500">{"type Intent = {"}</span>
                {"\n  "}
                <span className="text-accent-light">user</span>: address;{"\n  "}
                <span className="text-accent-light">tokenIn</span>: address;{"\n  "}
                <span className="text-accent-light">tokenOut</span>: address;{"\n  "}
                <span className="text-accent-light">amountIn</span>: uint256;{"\n  "}
                <span className="text-accent-light">minAmountOut</span>: uint256;{"\n  "}
                <span className="text-accent-light">nonce</span>: uint256;{"\n  "}
                <span className="text-accent-light">expiry</span>: uint256;
                {"\n"}
                <span className="text-neutral-500">{"}"}</span>
              </CodeBlock>
              <ol className="max-w-3xl space-y-3 text-sm leading-relaxed text-neutral-400">
                <li>
                  <span className="font-geist-mono text-accent-light">01.</span> User signs the intent with EIP-712
                  against the <code className="text-accent-light">IntentRegistry</code> domain and hands the
                  signature to their agent (directly, or via the relayer&apos;s open intent pool).
                </li>
                <li>
                  <span className="font-geist-mono text-accent-light">02.</span> An agent with a registered
                  ERC-8004 identity claims the intent and calls{" "}
                  <code className="text-accent-light">SettlementRouter.executeSettlement</code>, which validates
                  the signature, registers the intent, and executes the trade.
                </li>
                <li>
                  <span className="font-geist-mono text-accent-light">03.</span> The router derives a stealth
                  output address from the user&apos;s registered meta-address and emits an{" "}
                  <code className="text-accent-light">ArbiStealthAnnouncement</code> event.
                </li>
                <li>
                  <span className="font-geist-mono text-accent-light">04.</span> The agent pays the routing fee
                  (preferentially in USDG) to the <code className="text-accent-light">FeeVault</code>, and the
                  receipt is attached to its reputation entry.
                </li>
                <li>
                  <span className="font-geist-mono text-accent-light">05.</span> The user scans announcement events
                  with their viewing key to find and claim stealth outputs addressed to them.
                </li>
              </ol>
            </DocSection>

            <DocSection id="sdk" index="§5" title="SDK — @arbistealth/sdk">
              <P>
                A TypeScript package in <code className="text-accent-light">packages/sdk</code> wrapping stealth
                address derivation, intent signing, agent identity, x402 fee payment, and a client for the relayer
                API — the same functions this app&apos;s dashboard and explorer pages are built on.
              </P>
              <CodeBlock path="~/arbistealth/packages/sdk/src/index.ts">
                <span className="text-neutral-500">{"// stealth.ts"}</span>
                {"\n"}
                generateStealthKeys(): StealthKeys{"\n"}
                parseMetaAddress(metaAddress: Hex): StealthMetaAddress{"\n"}
                computeStealthOutput(recipient: StealthMetaAddress): StealthOutput{"\n"}
                checkStealthOutput(params: ScanParams): {"{ isForMe, stealthAddress? }"}
                {"\n"}
                recoverStealthPrivateKey(params): Hex{"\n\n"}
                <span className="text-neutral-500">{"// intent.ts"}</span>
                {"\n"}
                intentDomain(chainId, verifyingContract): IntentDomain{"\n"}
                hashIntent(domain, intent): Hex{"\n"}
                verifyIntentSignature(domain, intent, signature): Promise&lt;boolean&gt;
                {"\n\n"}
                <span className="text-neutral-500">{"// agent.ts"}</span>
                {"\n"}
                registerAgent(...): Promise&lt;{"{ agentId }"}&gt;{"\n"}
                getAgentId(publicClient, identityRegistry, controller): Promise&lt;bigint&gt;{"\n"}
                getAgentReputation(...): Promise&lt;...&gt;
                {"\n\n"}
                <span className="text-neutral-500">{"// x402.ts"}</span>
                {"\n"}
                payWithX402(...): Promise&lt;...&gt;
                {"\n\n"}
                <span className="text-neutral-500">{"// scan.ts"}</span>
                {"\n"}
                scanAnnouncements(params: ScanAnnouncementsParams): Promise&lt;ScanMatch[]&gt;
                {"\n\n"}
                <span className="text-neutral-500">{"// relayerClient.ts"}</span>
                {"\n"}
                <span className="text-accent-light">class</span> RelayerClient {"{"}
                {"\n  "}submitIntent(intent, signature): Promise&lt;OpenIntent&gt;{"\n  "}
                listOpenIntents(): Promise&lt;OpenIntent[]&gt;{"\n  "}
                getIntent(intentHash): Promise&lt;OpenIntent&gt;{"\n  "}
                claimIntent(intentHash, agent): Promise&lt;OpenIntent&gt;{"\n  "}
                markSettled(intentHash): Promise&lt;OpenIntent&gt;{"\n  "}
                getConfig(): Promise&lt;RelayerRuntimeConfig&gt;
                {"\n"}
                {"}"}
              </CodeBlock>
            </DocSection>

            <DocSection id="relayer-api" index="§6" title="Relayer API">
              <P>
                The relayer (<code className="text-accent-light">apps/relayer</code>) holds an in-memory pool of
                signed, not-yet-settled intents so an agent can discover and claim work without the user needing
                to broadcast the intent itself.
              </P>
              <div className="divide-y divide-white/10 border border-white/10 bg-white/[0.02] font-geist-mono text-xs">
                {[
                  { method: "GET", path: "/health", desc: "Liveness check." },
                  { method: "GET", path: "/config", desc: "Chain id, IntentRegistry address, preferred fee asset." },
                  { method: "POST", path: "/intents", desc: "Submit a signed intent into the open pool." },
                  { method: "GET", path: "/intents?user=0x..", desc: "List open intents, or a user's intents." },
                  { method: "GET", path: "/intents/:hash", desc: "Fetch one intent by hash." },
                  { method: "POST", path: "/intents/:hash/claim", desc: "An agent claims an open intent." },
                  { method: "POST", path: "/intents/:hash/settled", desc: "Mark an intent settled, with its tx hash." },
                  { method: "POST", path: "/intents/:hash/release", desc: "Release a claimed intent back to the open pool." },
                ].map((r) => (
                  <div key={r.path} className="flex flex-wrap items-center gap-3 px-6 py-3 sm:px-8">
                    <span
                      className={`w-12 shrink-0 ${r.method === "GET" ? "text-accent-light" : "text-emerald-300"}`}
                    >
                      {r.method}
                    </span>
                    <span className="text-white">{r.path}</span>
                    <span className="text-neutral-500">{r.desc}</span>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="security" index="§7" title="Security Considerations">
              <ul className="max-w-3xl space-y-3 text-sm leading-relaxed text-neutral-400">
                <li>
                  <span className="text-white">Replay protection</span> — every intent carries a nonce and expiry,
                  enforced by <code className="text-accent-light">IntentRegistry</code>.
                </li>
                <li>
                  <span className="text-white">Key management</span> — stealth viewing and spending keys are
                  user-held. The protocol never has a path to reconstruct a user&apos;s spending key.
                </li>
                <li>
                  <span className="text-white">Agent key custody</span> — agent signing keys are isolated from any
                  key controlling real user funds. A compromised agent key damages that agent&apos;s reputation at
                  worst, not users&apos; funds.
                </li>
                <li>
                  <span className="text-white">Audit scope</span> —{" "}
                  <code className="text-accent-light">SettlementRouter.sol</code> and{" "}
                  <code className="text-accent-light">FeeVault.sol</code> are the highest-priority contracts for a
                  third-party review before any mainnet deployment.
                </li>
              </ul>
            </DocSection>

            <DocSection id="getting-started" index="§8" title="Getting Started">
              <CodeBlock path="~/arbistealth">
                git clone https://github.com/anbusan19/arbistealth.git{"\n"}
                cd arbistealth{"\n"}
                pnpm install{"\n\n"}
                <span className="text-neutral-500">{"# contracts"}</span>
                {"\n"}
                cd contracts && forge install && forge build && forge test{"\n\n"}
                <span className="text-neutral-500">{"# relayer"}</span>
                {"\n"}
                cd apps/relayer && pnpm install && pnpm dev{"\n\n"}
                <span className="text-neutral-500">{"# web client"}</span>
                {"\n"}
                cd apps/web && pnpm install && pnpm dev
              </CodeBlock>
              <p className="text-sm text-neutral-400">
                Full write-up, deployment plan, and roadmap:{" "}
                <Link href="https://github.com/anbusan19/arbistealth#readme" target="_blank" className="text-accent-light hover:underline">
                  README on GitHub
                </Link>
                .
              </p>
            </DocSection>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
