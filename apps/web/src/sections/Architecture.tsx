import { SectionLabel } from "../components/ui/SectionLabel";

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
    <section className="border-t border-white/10 px-6 py-20 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionLabel index="§3">How It Works</SectionLabel>

        <h2 className="mt-6 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
          From signed intent to private settlement.
        </h2>

        <ol className="mt-12 flex flex-col">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-6 border-t border-white/10 py-5 first:border-t-0">
              <span className="w-8 shrink-0 font-geist-mono text-sm text-cyan-400/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm leading-relaxed text-neutral-300 sm:text-base">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
