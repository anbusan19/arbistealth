"use client";

import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { AppLayout } from "@/layouts/AppLayout";
import { Panel } from "@/components/ui/Panel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";
import { Loader } from "@/components/ui/Loader";
import { RequireWallet } from "@/components/dashboard/RequireWallet";
import { CHAIN_ID, CONTRACTS, EXTERNAL, arbiscanTxUrl, erc6538RegistryAbi, feeVaultAbi } from "@/lib/contracts";
import { generateStealthKeys, loadStoredStealthKeys, saveStealthKeys, type StealthKeys } from "@/lib/stealth";

function StealthKeysPanel({ address }: { address: Address }) {
  const [keys, setKeys] = useState<StealthKeys | null>(() => loadStoredStealthKeys());
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const onChain = useReadContract({
    address: EXTERNAL.erc6538Registry,
    abi: erc6538RegistryAbi,
    functionName: "stealthMetaAddressOf",
    args: [address, 1n],
  });

  const isRegisteredOnChain = !!onChain.data && onChain.data.length > 2;

  const generate = () => {
    const fresh = generateStealthKeys();
    saveStealthKeys(fresh);
    setKeys(fresh);
  };

  const register = useMutation({
    mutationFn: async () => {
      if (!keys) throw new Error("Generate keys first");
      setTxHash(null);
      const hash = await writeContractAsync({
        address: EXTERNAL.erc6538Registry,
        abi: erc6538RegistryAbi,
        functionName: "registerKeys",
        args: [1n, keys.metaAddress],
      });
      setTxHash(hash);
      return hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      onChain.refetch();
    },
  });

  return (
    <Panel className="p-6 sm:p-8">
      <SectionLabel index="A">Stealth Meta-Address</SectionLabel>

      <p className="mt-4 text-sm text-neutral-400">
        Client-side ERC-5564 spending/viewing key pair, registered on-chain via ERC-6538 so agents can derive a
        private output address for you.
      </p>
      <p className="mt-2 font-geist-mono text-[10px] tracking-wide text-neutral-500">
        DEMO ONLY — keys are stored in this browser&apos;s localStorage, unencrypted.
      </p>

      {onChain.isLoading ? (
        <div className="mt-6">
          <Loader size="sm" label="READING STEALTH REGISTRY…" />
        </div>
      ) : (
        <>
          {isRegisteredOnChain && (
            <div className="mt-6">
              <div className="font-geist-mono text-[10px] tracking-wide text-neutral-500">REGISTERED ON-CHAIN</div>
              <div className="mt-1 truncate font-geist-mono text-xs text-emerald-300">{onChain.data}</div>
            </div>
          )}

          {keys && (
            <div className="mt-6">
              <div className="font-geist-mono text-[10px] tracking-wide text-neutral-500">LOCAL META-ADDRESS</div>
              <div className="mt-1 truncate font-geist-mono text-xs text-white">{keys.metaAddress}</div>
            </div>
          )}

          {keys && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-geist-mono text-[10px] tracking-wide text-neutral-500">
                    VIEWING PRIVATE KEY
                  </span>
                  <span className="border border-red-900/50 bg-red-950/40 px-1.5 py-0.5 font-geist-mono text-[9px] tracking-wide text-red-400 uppercase">
                    Sensitive
                  </span>
                </div>
                <button
                  onClick={() => setIsRevealed((v) => !v)}
                  className="font-geist-mono text-[10px] text-accent hover:underline"
                >
                  {isRevealed ? "HIDE" : "REVEAL"}
                </button>
              </div>
              <div className="mt-2 truncate border border-white/10 bg-black/20 p-3 font-geist-mono text-xs">
                {isRevealed ? (
                  <span className="text-white">{keys.viewingPrivateKey}</span>
                ) : (
                  <span className="text-neutral-600 italic">•••••••••••••••••••••••••••••••••••••••••</span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={generate}
          className="border border-white/10 px-4 py-2 font-geist-mono text-xs text-neutral-300 hover:border-accent/40 hover:text-white"
        >
          {keys ? "REGENERATE KEYS" : "GENERATE KEYS"}
        </button>
        <button
          onClick={() => register.mutate()}
          disabled={!keys || register.isPending}
          className="border border-accent/50 bg-accent/10 px-4 py-2 font-geist-mono text-xs text-accent-light hover:bg-accent/20 disabled:opacity-40"
        >
          {register.isPending ? "REGISTERING…" : "REGISTER ON-CHAIN"}
        </button>
      </div>

      {register.error && <p className="mt-3 text-xs text-red-400">{register.error.message}</p>}
      {txHash && (
        <a
          href={arbiscanTxUrl(txHash)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block font-geist-mono text-xs text-accent underline underline-offset-4"
        >
          View transaction on Arbiscan →
        </a>
      )}
    </Panel>
  );
}

function NetworkPanel() {
  const feeAsset = useReadContract({
    address: CONTRACTS.feeVault,
    abi: feeVaultAbi,
    functionName: "preferredAsset",
  });

  const rows: [string, string][] = [
    ["Chain", `Arbitrum Sepolia (${CHAIN_ID})`],
    ["Preferred fee asset", feeAsset.data ?? EXTERNAL.usdg],
    ["ERC-5564 announcer", EXTERNAL.erc5564Announcer],
    ["ERC-6538 registry", EXTERNAL.erc6538Registry],
  ];

  return (
    <Panel className="p-6 sm:p-8">
      <SectionLabel index="B">Network</SectionLabel>
      <div className="mt-6 flex flex-col divide-y divide-white/10">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-3 first:pt-0">
            <span className="text-sm text-neutral-400">{label}</span>
            <span className="truncate font-geist-mono text-xs text-white">{value}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function Settings() {
  return (
    <AppLayout>
      <RequireWallet>
        {(address) => (
          <>
            <Reveal>
              <h1 className="mb-10 text-3xl font-medium tracking-tight text-white sm:text-4xl">Settings</h1>
            </Reveal>
            <div className="flex flex-col gap-6">
              <Reveal delay={0.05}>
                <StealthKeysPanel address={address} />
              </Reveal>
              <Reveal delay={0.08}>
                <NetworkPanel />
              </Reveal>
            </div>
          </>
        )}
      </RequireWallet>
    </AppLayout>
  );
}
