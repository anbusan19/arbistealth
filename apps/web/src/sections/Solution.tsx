import { SectionLabel } from "../components/ui/SectionLabel";
import { Panel } from "../components/ui/Panel";

const PILLARS = [
  {
    tag: "PRIVACY",
    standard: "ERC-5564 + ERC-6538",
    body: "One-time stealth addresses for trade output, announced on-chain but unlinkable without the recipient's viewing key.",
  },
  {
    tag: "AGENT IDENTITY",
    standard: "ERC-8004",
    body: "A portable on-chain identity, reputation history, and validation trail for the agent executing the trade.",
  },
  {
    tag: "SETTLEMENT",
    standard: "x402",
    body: "Routing and execution fees settled as real, verifiable on-chain payments — attached as proof to the agent's reputation entry.",
  },
];

export function Solution() {
  return (
    <section className="border-t border-white/10 px-6 py-20 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionLabel index="§2">The Solution</SectionLabel>

        <h2 className="mt-6 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
          Three existing standards, one settlement flow.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400">
          A user submits a signed intent once. From there, the agent takes over: it finds a match, executes through
          the settlement router, pays the routing fee via x402, and the output lands in a stealth address only the
          user can identify.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <Panel key={pillar.tag} className="p-6 sm:p-8">
              <div className="font-geist-mono text-[10px] tracking-[0.2em] text-accent/80">{pillar.tag}</div>
              <div className="mt-3 font-geist-mono text-sm text-white">{pillar.standard}</div>
              <p className="mt-4 text-sm leading-relaxed text-neutral-400">{pillar.body}</p>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}
