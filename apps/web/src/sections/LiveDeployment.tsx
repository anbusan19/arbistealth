import { SectionLabel } from "../components/ui/SectionLabel";
import { Panel } from "../components/ui/Panel";
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

export function LiveDeployment() {
  return (
    <section className="border-t border-white/10 px-6 py-20 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionLabel index="§4">Live On Arbitrum Sepolia</SectionLabel>

        <h2 className="mt-6 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
          Not a mockup — every contract below is deployed and verifiable.
        </h2>

        <Panel className="mt-12 divide-y divide-white/10">
          {(Object.keys(CONTRACTS) as (keyof typeof CONTRACTS)[]).map((key) => (
            <a
              key={key}
              href={arbiscanAddressUrl(CONTRACTS[key])}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col justify-between gap-1 px-6 py-4 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:px-8"
            >
              <span className="text-sm text-white">{LABELS[key]}</span>
              <span className="font-geist-mono text-xs text-neutral-500 group-hover:text-cyan-400">
                {CONTRACTS[key]}
              </span>
            </a>
          ))}
        </Panel>
      </div>
    </section>
  );
}
