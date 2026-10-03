"use client";

import { useState } from "react";
import { usePublicClient, useReadContract, useSignTypedData, useWriteContract } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseUnits, type Address } from "viem";
import { AppLayout } from "@/layouts/AppLayout";
import { Panel } from "@/components/ui/Panel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";
import { Loader } from "@/components/ui/Loader";
import CountUp from "@/components/ui/CountUp";
import { BlockNumberStat } from "@/components/BlockNumberStat";
import { RequireWallet } from "@/components/dashboard/RequireWallet";
import {
  CONTRACTS,
  arbiscanAddressUrl,
  arbiscanTxUrl,
  bufferedFees,
  erc20Abi,
  identityRegistryAbi,
  reputationRegistryAbi,
} from "@/lib/contracts";
import { INTENT_DOMAIN, INTENT_PRIMARY_TYPE, INTENT_TYPES, randomNonce, type Intent } from "@/lib/intent";
import { fetchMyRelayerIntents, submitIntentToRelayer } from "@/lib/relayer";

function AgentPanel({ address }: { address: Address }) {
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();

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
    mutationFn: async () => {
      if (!publicClient) throw new Error("No RPC connection");
      return writeContractAsync({
        address: CONTRACTS.identityRegistry,
        abi: identityRegistryAbi,
        functionName: "registerAgent",
        args: ["ipfs://arbistealth-agent-card"],
        ...(await bufferedFees(publicClient)),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      agentId.refetch();
    },
  });

  return (
    <Panel className="flex h-full flex-col p-6 sm:p-8">
      <SectionLabel index="A">Agent Identity</SectionLabel>

      {agentId.isLoading ? (
        <div className="mt-6">
          <Loader size="sm" label="READING IDENTITY REGISTRY…" />
        </div>
      ) : isRegistered ? (
        <div className="mt-6 flex flex-1 flex-col justify-between">
          <div className="flex items-center gap-2 font-geist-mono text-[10px] tracking-wide text-emerald-300 uppercase">
            <span>✓</span>
            ERC-8004 Registered Agent
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-geist-mono text-4xl text-white">
              #<CountUp to={Number(agentId.data ?? 0n)} duration={1} />
            </span>
          </div>
          <div className="mt-4 border border-white/10 bg-white/[0.02] p-3">
            <div className="font-geist-mono text-[10px] tracking-wide text-neutral-500">REPUTATION ENTRIES</div>
            <div className="mt-1 font-geist-mono text-lg text-white">
              <CountUp to={Number(reputation.data ?? 0n)} duration={1} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-1 items-end justify-between gap-4">
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

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const MAX_UINT256 = (1n << 256n) - 1n;

function SubmitIntentPanel({ address }: { address: Address }) {
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const [tokenIn, setTokenIn] = useState("");
  const [tokenOut, setTokenOut] = useState("");
  const [amountIn, setAmountIn] = useState("");
  const [minAmountOut, setMinAmountOut] = useState("");
  const [expiryMinutes, setExpiryMinutes] = useState("60");
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);

  const tokenInIsValid = ADDRESS_RE.test(tokenIn);
  const amountInWei = (() => {
    try {
      return parseUnits(amountIn || "0", 18);
    } catch {
      return 0n;
    }
  })();

  // A user must approve SettlementRouter to pull tokenIn before any solver
  // can settle their intent — executeSettlement calls safeTransferFrom(user,
  // ..., amountIn) under the hood. This is the same approve-then-trade
  // pattern every ERC-20 DEX uses; nothing settles without it.
  const allowance = useReadContract({
    address: tokenIn as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address, CONTRACTS.settlementRouter],
    query: { enabled: tokenInIsValid },
  });

  const needsApproval = tokenInIsValid && amountInWei > 0n && (allowance.data ?? 0n) < amountInWei;

  const approve = useMutation({
    mutationFn: async () => {
      if (!publicClient) throw new Error("No RPC connection");
      const hash = await writeContractAsync({
        address: tokenIn as Address,
        abi: erc20Abi,
        functionName: "approve",
        // Approve once, generously, rather than re-prompting for every trade
        // of this token — the standard tradeoff every DEX UI makes between
        // convenience and per-trade allowance scoping.
        args: [CONTRACTS.settlementRouter, MAX_UINT256],
        ...(await bufferedFees(publicClient)),
      });
      await publicClient.waitForTransactionReceipt({ hash });
    },
    onSuccess: () => allowance.refetch(),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      setSubmittedHash(null);
      const intent: Intent = {
        user: address,
        tokenIn: tokenIn as Address,
        tokenOut: tokenOut as Address,
        amountIn: amountInWei,
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

      const stored = await submitIntentToRelayer(intent, signature);
      setSubmittedHash(stored.intentHash);
      return stored;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-intents"] }),
  });

  return (
    <Panel className="p-6 sm:p-8">
      <SectionLabel index="B">Submit A Trade Intent</SectionLabel>
      <p className="mt-4 text-sm text-neutral-400">
        Signs an EIP-712 intent and hands it to the relayer&apos;s off-chain pool — no gas, no on-chain tx yet. A
        solver agent picks it up, settles it on-chain, and pays your output to a stealth address.
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

        <div className="flex items-end gap-3 sm:col-span-2">
          {needsApproval ? (
            <button
              type="button"
              onClick={() => approve.mutate()}
              disabled={approve.isPending}
              className="flex w-full items-center justify-center gap-3 border border-amber-500/50 bg-amber-500/10 py-3 font-geist-mono text-xs tracking-wide text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 sm:w-auto sm:px-6"
            >
              {approve.isPending ? <Loader size="sm" /> : null}
              {approve.isPending ? "APPROVING…" : "APPROVE TOKEN IN"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending || (tokenInIsValid && allowance.isLoading)}
              className="flex w-full items-center justify-center gap-3 border border-accent/50 bg-accent/10 py-3 font-geist-mono text-xs tracking-wide text-accent-light hover:bg-accent/20 disabled:opacity-40 sm:w-auto sm:px-6"
            >
              {isPending ? <Loader size="sm" /> : null}
              {isPending ? "SIGNING…" : "SIGN & SUBMIT INTENT"}
            </button>
          )}
        </div>
        {needsApproval && (
          <p className="text-xs text-neutral-500 sm:col-span-2">
            SettlementRouter isn&apos;t approved to spend this token yet — one-time on-chain approval, then
            submitting intents is free.
          </p>
        )}
      </form>

      {approve.error && <p className="mt-4 text-xs text-red-400">{approve.error.message}</p>}
      {error && <p className="mt-4 text-xs text-red-400">{error.message}</p>}
      {submittedHash && (
        <p className="mt-4 font-geist-mono text-xs text-accent">
          Submitted {submittedHash.slice(0, 10)}…{submittedHash.slice(-6)} — waiting for a solver to settle it.
        </p>
      )}
    </Panel>
  );
}

const INTENT_STATUS_COLOR: Record<string, string> = {
  open: "text-neutral-400",
  claimed: "text-accent",
  settled: "text-emerald-300",
};

function MyIntentsPanel({ address }: { address: Address }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-intents", address],
    queryFn: () => fetchMyRelayerIntents(address),
    refetchInterval: 5_000,
  });

  return (
    <Panel className="p-6 sm:p-8">
      <SectionLabel index="C">My Intents</SectionLabel>

      {isLoading && (
        <div className="mt-6">
          <Loader size="sm" label="READING INTENT POOL…" />
        </div>
      )}
      {error && (
        <p className="mt-6 text-xs text-red-400">
          Couldn&apos;t reach the relayer — is it running? {(error as Error).message}
        </p>
      )}
      {!isLoading && !error && data?.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">No intents submitted yet from this address.</p>
      )}

      <ul className="mt-6 flex max-h-64 flex-col divide-y divide-white/10 overflow-y-auto">
        {data?.map((stored) => (
          <li key={stored.intentHash} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`font-geist-mono text-[10px] tracking-wide uppercase ${INTENT_STATUS_COLOR[stored.status]}`}>
                {stored.status}
              </span>
              <span className="font-geist-mono text-xs text-neutral-400">
                {stored.intentHash.slice(0, 10)}…{stored.intentHash.slice(-6)}
              </span>
            </div>
            {stored.settlementTxHash ? (
              <a
                href={arbiscanTxUrl(stored.settlementTxHash)}
                target="_blank"
                rel="noreferrer"
                className="font-geist-mono text-xs text-accent hover:underline"
              >
                VIEW TX →
              </a>
            ) : (
              <span className="font-geist-mono text-xs text-neutral-600">no tx yet</span>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function Dashboard() {
  return (
    <AppLayout>
      <RequireWallet>
        {(address) => (
          <>
            <Reveal>
              <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 font-geist-mono text-[10px] tracking-[0.25em] text-accent/80 uppercase">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                    </span>
                    Your Workspace
                  </div>
                  <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Dashboard</h1>
                  <p className="mt-2 max-w-lg text-sm text-neutral-400">
                    Your agent identity and trade intents — everything reads directly from Arbitrum Sepolia.
                  </p>
                </div>
                <a
                  href={arbiscanAddressUrl(address)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 self-start border border-white/10 bg-white/[0.03] px-4 py-2 font-geist-mono text-xs text-neutral-300 backdrop-blur-xl hover:border-accent/40 hover:text-white sm:self-auto"
                >
                  {address.slice(0, 6)}…{address.slice(-4)}
                  <span className="text-accent">↗</span>
                </a>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Reveal delay={0.02} className="lg:col-span-2">
                <Panel className="h-full">
                  <BlockNumberStat />
                </Panel>
              </Reveal>
              <Reveal delay={0.05}>
                <AgentPanel address={address} />
              </Reveal>

              <Reveal delay={0.08} className="lg:col-span-2">
                <SubmitIntentPanel address={address} />
              </Reveal>
              <Reveal delay={0.11}>
                <MyIntentsPanel address={address} />
              </Reveal>
            </div>
          </>
        )}
      </RequireWallet>
    </AppLayout>
  );
}
