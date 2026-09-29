"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/layouts/AppLayout";
import { Panel } from "@/components/ui/Panel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CHAIN_ID, CONTRACTS, EXTERNAL, arbiscanTxUrl, erc6538RegistryAbi, feeVaultAbi } from "@/lib/contracts";
import { generateStealthKeys, loadStoredStealthKeys, saveStealthKeys, type StealthKeys } from "@/lib/stealth";

function StealthKeysPanel({ address }: { address: `0x${string}` }) {
  const [keys, setKeys] = useState<StealthKeys | null>(() => loadStoredStealthKeys());
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const [txHash, setTxHash] = useState<string | null>(null);

  const onChain = useReadContract({
    address: CONTRACTS.stealthMetaRegistry,
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
        address: CONTRACTS.stealthMetaRegistry,
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
        Generates a spending/viewing key pair client-side (ERC-5564, secp256k1) and registers the resulting
        meta-address on-chain via ERC-6538, so agents can derive a private output address for you.
      </p>
      <p className="mt-2 font-geist-mono text-[10px] tracking-wide text-amber-400/80">
        DEMO ONLY — keys are stored in this browser&apos;s localStorage, unencrypted. Do not reuse for real funds.
      </p>

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
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <AppLayout>
        <Panel className="mx-auto max-w-md p-8 text-center">
          <p className="text-sm text-neutral-400">Connect a wallet to manage settings.</p>
          <Link
            href="/login"
            className="mt-6 inline-block border border-accent/50 bg-accent/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-accent-light hover:bg-accent/20"
          >
            CONNECT WALLET
          </Link>
        </Panel>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h1 className="mb-8 text-2xl font-medium text-white">Settings</h1>
      <div className="flex flex-col gap-6">
        <StealthKeysPanel address={address} />
        <NetworkPanel />
      </div>
    </AppLayout>
  );
}
