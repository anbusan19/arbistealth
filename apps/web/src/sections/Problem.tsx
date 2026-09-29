import { SectionLabel } from "../components/ui/SectionLabel";
import { Panel } from "../components/ui/Panel";

const PROBLEMS = [
  {
    n: "01",
    title: "Every trade is a broadcast",
    body: "Intent-based DEXs leak sender, size, and timing — enough metadata to enable front-running and MEV extraction.",
  },
  {
    n: "02",
    title: "Privacy tools have no execution logic",
    body: "Wallet-level privacy tools have no logic attached, and mixers trade UX for privacy. Neither fits an agent-driven trade flow.",
  },
  {
    n: "03",
    title: "Agents have no track record",
    body: "As trading agents become common, there's no standard way to prove what an agent actually executed — unless you sacrifice trade privacy entirely.",
  },
  {
    n: "04",
    title: "Reputation isn't portable",
    body: "Existing agent frameworks lack a chain-native reputation system tied to real settled payments, rather than self-reported logs.",
  },
];

export function Problem() {
  return (
    <section className="border-t border-white/10 px-6 py-20 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionLabel index="§1">The Problem</SectionLabel>

        <h2 className="mt-6 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
          Public settlement forces a choice between privacy and accountability.
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
          {PROBLEMS.map((p) => (
            <Panel key={p.n} corners={false} className="!border-0 bg-[#040508] p-6 sm:p-8">
              <div className="font-geist-mono text-xs text-cyan-400/70">{p.n}</div>
              <h3 className="mt-3 text-lg font-medium text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{p.body}</p>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}
