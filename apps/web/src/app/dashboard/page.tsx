"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract, useSignTypedData, useWriteContract } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseUnits, type Address } from "viem";
import { AppLayout } from "@/layouts/AppLayout";
import { Panel } from "@/components/ui/Panel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";
import {
  CONTRACTS,
  DEPLOY_BLOCK,
  INTENT_SUBMITTED_EVENT,
  arbiscanAddressUrl,
  arbiscanTxUrl,
  erc6538RegistryAbi,
  identityRegistryAbi,
  intentRegistryAbi,
  reputationRegistryAbi,
} from "@/lib/contracts";
import { INTENT_DOMAIN, INTENT_PRIMARY_TYPE, INTENT_TYPES, randomNonce, type Intent } from "@/lib/intent";

function AgentPanel({ address }: { address: Address }) {
  const queryClient = useQueryClient();

  const agentId = useReadContract({
    address: CONTRACTS.identityRegistry,
    abi: identityRegistryAbi,
    functionName: "agentIdOf",
    args: [address],
  });

  const isRegistered = !!agentId.data && agentId.data > 0n;

  const reputation = useReadContract({
    address: CONTRACTS.reputationRegistry,
    abi: reputationRegistryAbi,
    functionName: "entryCountOf",
    args: [agentId.data ?? 0n],
    query: { enabled: isRegistered },
  });

  const { writeContractAsync, isPending } = useWriteContract();

  const register = useMutation({
    mutationFn: () =>
      writeContractAsync({
        address: CONTRACTS.identityRegistry,
        abi: identityRegistryAbi,
        functionName: "registerAgent",
        args: ["ipfs://arbistealth-agent-card"],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      agentId.refetch();
    },
  });

  return (
    <Panel className="p-6 sm:p-8">
      <SectionLabel index="A">Agent Identity</SectionLabel>

      {isRegistered ? (
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <div className="font-geist-mono text-[10px] tracking-wide text-neutral-500">AGENT ID</div>
            <div className="mt-1 font-geist-mono text-lg text-white">#{agentId.data?.toString()}</div>
          </div>
          <div>
            <div className="font-geist-mono text-[10px] tracking-wide text-neutral-500">REPUTATION ENTRIES</div>
            <div className="mt-1 font-geist-mono text-lg text-white">{reputation.data?.toString() ?? "—"}</div>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-neutral-400">Not registered as an ERC-8004 agent yet.</p>
          <button
            onClick={() => register.mutate()}
            disabled={isPending}
            className="shrink-0 border border-accent/50 bg-accent/10 px-4 py-2 font-geist-mono text-xs text-accent-light hover:bg-accent/20 disabled:opacity-40"
          >
            {isPending ? "REGISTERING…" : "REGISTER AGENT"}
          </button>
        </div>
      )}
      {register.error && <p className="mt-3 text-xs text-red-400">{register.error.message}</p>}
    </Panel>
  );
}

function StealthStatusPanel({ address }: { address: Address }) {
  const result = useReadContract({
    address: CONTRACTS.stealthMetaRegistry,
    abi: erc6538RegistryAbi,
    functionName: "stealthMetaAddressOf",
    args: [address, 1n],
  });

  const isRegistered = !!result.data && result.data.length > 2;

  return (
    <Panel className="p-6 sm:p-8">
      <SectionLabel index="B">Stealth Meta-Address</SectionLabel>
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-neutral-400">
          {isRegistered ? "Registered — you can receive private trade output." : "Not registered yet."}
        </p>
        {!isRegistered && (
          <Link
            href="/settings"
            className="shrink-0 border border-white/10 px-4 py-2 font-geist-mono text-xs text-neutral-300 hover:border-accent/40 hover:text-white"
          >
            SET UP IN SETTINGS
          </Link>
        )}
      </div>
    </Panel>
  );
}

function SubmitIntentPanel({ address }: { address: Address }) {
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const [tokenIn, setTokenIn] = useState("");
  const [tokenOut, setTokenOut] = useState("");
  const [amountIn, setAmountIn] = useState("");
  const [minAmountOut, setMinAmountOut] = useState("");
  const [expiryMinutes, setExpiryMinutes] = useState("60");
  const [txHash, setTxHash] = useState<string | null>(null);

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      setTxHash(null);
      const intent: Intent = {
        user: address,
        tokenIn: tokenIn as Address,
        tokenOut: tokenOut as Address,
        amountIn: parseUnits(amountIn || "0", 18),
        minAmountOut: parseUnits(minAmountOut || "0", 18),
        nonce: randomNonce(),
        expiry: BigInt(Math.floor(Date.now() / 1000) + Number(expiryMinutes) * 60),
      };

      const signature = await signTypedDataAsync({
        domain: INTENT_DOMAIN,
        types: INTENT_TYPES,
        primaryType: INTENT_PRIMARY_TYPE,
        message: intent,
      });

      const hash = await writeContractAsync({
        address: CONTRACTS.intentRegistry,
        abi: intentRegistryAbi,
        functionName: "submitIntent",
        args: [intent, signature],
      });
      setTxHash(hash);
      return hash;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-intents"] }),
  });

  return (
    <Panel className="p-6 sm:p-8">
      <SectionLabel index="C">Submit A Trade Intent</SectionLabel>
      <p className="mt-4 text-sm text-neutral-400">
        Signs an EIP-712 intent and submits it directly on-chain to IntentRegistry — no relayer required for this
        demo.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutate();
        }}
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Token in (address)
          <input
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value)}
            placeholder="0x…"
            required
            className="border border-white/10 bg-transparent px-3 py-2 font-geist-mono text-xs text-white outline-none focus:border-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Token out (address)
          <input
            value={tokenOut}
            onChange={(e) => setTokenOut(e.target.value)}
            placeholder="0x…"
            required
            className="border border-white/10 bg-transparent px-3 py-2 font-geist-mono text-xs text-white outline-none focus:border-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Amount in
          <input
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="1.0"
            required
            className="border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Min amount out
          <input
            value={minAmountOut}
            onChange={(e) => setMinAmountOut(e.target.value)}
            placeholder="0.95"
            required
            className="border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Expires in (minutes)
          <input
            value={expiryMinutes}
            onChange={(e) => setExpiryMinutes(e.target.value)}
            type="number"
            min="1"
            className="border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-accent/40"
          />
        </label>

        <div className="flex items-end sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full border border-accent/50 bg-accent/10 py-3 font-geist-mono text-xs tracking-wide text-accent-light hover:bg-accent/20 disabled:opacity-40 sm:w-auto sm:px-6"
          >
            {isPending ? "SIGNING & SUBMITTING…" : "SIGN & SUBMIT INTENT"}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-xs text-red-400">{error.message}</p>}
      {txHash && (
        <a
          href={arbiscanTxUrl(txHash)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block font-geist-mono text-xs text-accent underline underline-offset-4"
        >
          View transaction on Arbiscan →
        </a>
      )}
    </Panel>
  );
}

function MyIntentsPanel({ address }: { address: Address }) {
  const publicClient = usePublicClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-intents", address],
    queryFn: async () => {
      if (!publicClient) return [];
      const logs = await publicClient.getLogs({
        address: CONTRACTS.intentRegistry,
        event: INTENT_SUBMITTED_EVENT,
        args: { user: address },
        fromBlock: DEPLOY_BLOCK,
        toBlock: "latest",
      });
      return logs.reverse();
    },
    enabled: !!publicClient,
  });

  return (
    <Panel className="p-6 sm:p-8">
      <SectionLabel index="D">My Intents</SectionLabel>

      {isLoading && <p className="mt-6 text-sm text-neutral-500">Loading on-chain history…</p>}
      {!isLoading && data?.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">No intents submitted yet from this address.</p>
      )}

      <ul className="mt-6 flex flex-col divide-y divide-white/10">
        {data?.map((log) => (
          <li key={log.transactionHash + log.logIndex} className="flex items-center justify-between gap-4 py-3">
            <span className="font-geist-mono text-xs text-neutral-400">
              {String(log.args.intentHash).slice(0, 10)}…{String(log.args.intentHash).slice(-6)}
            </span>
            <a
              href={arbiscanTxUrl(log.transactionHash)}
              target="_blank"
              rel="noreferrer"
              className="font-geist-mono text-xs text-accent hover:underline"
            >
              VIEW TX →
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <AppLayout>
        <Panel className="mx-auto max-w-md p-8 text-center">
          <p className="text-sm text-neutral-400">Connect a wallet to view your dashboard.</p>
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
      <Reveal>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-medium text-white">Dashboard</h1>
          <a
            href={arbiscanAddressUrl(address)}
            target="_blank"
            rel="noreferrer"
            className="font-geist-mono text-xs text-neutral-500 hover:text-accent"
          >
            {address.slice(0, 6)}…{address.slice(-4)} ↗
          </a>
        </div>
      </Reveal>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <AgentPanel address={address} />
          </Reveal>
          <Reveal delay={0.1}>
            <StealthStatusPanel address={address} />
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <SubmitIntentPanel address={address} />
        </Reveal>
        <Reveal delay={0.2}>
          <MyIntentsPanel address={address} />
        </Reveal>
      </div>
    </AppLayout>
  );
}
