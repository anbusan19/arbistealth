"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSignTypedData,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseUnits, type Address, type Log } from "viem";
import { AppLayout } from "@/layouts/AppLayout";
import { Panel } from "@/components/ui/Panel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";
import { Loader } from "@/components/ui/Loader";
import CountUp from "@/components/ui/CountUp";
import { BlockNumberStat } from "@/components/BlockNumberStat";
import {
  AGENT_REGISTERED_EVENT,
  ANNOUNCEMENT_EVENT,
  CHAIN_ID,
  CONTRACTS,
  DEPLOY_BLOCK,
  EXTERNAL,
  INTENT_SUBMITTED_EVENT,
  SETTLEMENT_EXECUTED_EVENT,
  arbiscanAddressUrl,
  arbiscanTxUrl,
  erc6538RegistryAbi,
  feeVaultAbi,
  identityRegistryAbi,
  intentRegistryAbi,
  reputationRegistryAbi,
} from "@/lib/contracts";
import { generateStealthKeys, loadStoredStealthKeys, saveStealthKeys, type StealthKeys } from "@/lib/stealth";
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
      <SectionLabel index="B">Stealth Meta-Address</SectionLabel>

      <p className="mt-4 text-sm text-neutral-400">
        Client-side ERC-5564 spending/viewing key pair, registered on-chain via ERC-6538 so agents can derive a
        private output address for you.
      </p>
      <p className="mt-2 font-geist-mono text-[10px] tracking-wide text-amber-400/80">
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
      <SectionLabel index="C">Network</SectionLabel>
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
      <SectionLabel index="D">Submit A Trade Intent</SectionLabel>
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
            className="flex w-full items-center justify-center gap-3 border border-accent/50 bg-accent/10 py-3 font-geist-mono text-xs tracking-wide text-accent-light hover:bg-accent/20 disabled:opacity-40 sm:w-auto sm:px-6"
          >
            {isPending ? <Loader size="sm" /> : null}
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
      <SectionLabel index="E">My Intents</SectionLabel>

      {isLoading && (
        <div className="mt-6">
          <Loader size="sm" label="READING INTENT HISTORY…" />
        </div>
      )}
      {!isLoading && data?.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">No intents submitted yet from this address.</p>
      )}

      <ul className="mt-6 flex max-h-64 flex-col divide-y divide-white/10 overflow-y-auto">
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

interface FeedItem {
  kind: "Intent Submitted" | "Settlement Executed" | "Stealth Announcement" | "Agent Registered";
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
  detail: string;
  args: Record<string, unknown>;
}

function toFeedItem(kind: FeedItem["kind"], log: Log, detail: string): FeedItem {
  return {
    kind,
    blockNumber: log.blockNumber ?? 0n,
    transactionHash: log.transactionHash as `0x${string}`,
    logIndex: log.logIndex ?? 0,
    detail,
    args: (log as Log & { args: Record<string, unknown> }).args,
  };
}

const KIND_COLOR: Record<FeedItem["kind"], string> = {
  "Intent Submitted": "text-neutral-300",
  "Settlement Executed": "text-accent",
  "Stealth Announcement": "text-fuchsia-300",
  "Agent Registered": "text-emerald-300",
};

const FEED_FILTERS = [
  { label: "All", kinds: null },
  { label: "Intents", kinds: ["Intent Submitted"] },
  { label: "Settlements", kinds: ["Settlement Executed"] },
  { label: "Announcements", kinds: ["Stealth Announcement"] },
  { label: "Agents", kinds: ["Agent Registered"] },
] as const satisfies readonly { label: string; kinds: readonly FeedItem["kind"][] | null }[];

function stringifyArgs(args: Record<string, unknown>): string {
  return JSON.stringify(args, (_key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
}

function ExplorerFeedPanel() {
  const publicClient = usePublicClient();
  const [activeFilter, setActiveFilter] = useState<(typeof FEED_FILTERS)[number]["label"]>("All");
  const [search, setSearch] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const handleCopy = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(tx);
    setTimeout(() => setCopiedTx(null), 1500);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["explorer-feed"],
    queryFn: async (): Promise<FeedItem[]> => {
      if (!publicClient) return [];

      const [intents, settlements, announcements, agents] = await Promise.all([
        publicClient.getLogs({
          address: CONTRACTS.intentRegistry,
          event: INTENT_SUBMITTED_EVENT,
          fromBlock: DEPLOY_BLOCK,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: CONTRACTS.settlementRouter,
          event: SETTLEMENT_EXECUTED_EVENT,
          fromBlock: DEPLOY_BLOCK,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: CONTRACTS.stealthAnnouncer,
          event: ANNOUNCEMENT_EVENT,
          fromBlock: DEPLOY_BLOCK,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: CONTRACTS.identityRegistry,
          event: AGENT_REGISTERED_EVENT,
          fromBlock: DEPLOY_BLOCK,
          toBlock: "latest",
        }),
      ]);

      const items: FeedItem[] = [
        ...intents.map((log) =>
          toFeedItem(
            "Intent Submitted",
            log,
            `${String(log.args.user).slice(0, 8)}… → ${String(log.args.intentHash).slice(0, 10)}…`
          )
        ),
        ...settlements.map((log) =>
          toFeedItem(
            "Settlement Executed",
            log,
            `agent #${log.args.agentId} settled to ${String(log.args.stealthAddress).slice(0, 10)}…`
          )
        ),
        ...announcements.map((log) =>
          toFeedItem("Stealth Announcement", log, `output → ${String(log.args.stealthAddress).slice(0, 10)}…`)
        ),
        ...agents.map((log) =>
          toFeedItem("Agent Registered", log, `agent #${log.args.agentId} · ${String(log.args.controller).slice(0, 10)}…`)
        ),
      ];

      return items.sort((a, b) => Number(b.blockNumber - a.blockNumber) || b.logIndex - a.logIndex);
    },
    enabled: !!publicClient,
    refetchInterval: 15_000,
  });

  const visible = (data ?? []).filter((item) => {
    const filter = FEED_FILTERS.find((f) => f.label === activeFilter);
    if (filter?.kinds && !(filter.kinds as readonly string[]).includes(item.kind)) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        item.transactionHash.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        item.blockNumber.toString().includes(q)
      );
    }
    return true;
  });

  return (
    <Panel className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel index="F">Recent Activity</SectionLabel>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 font-geist-mono text-[11px]">
          {FEED_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.label)}
              className={`border px-2.5 py-1 whitespace-nowrap uppercase transition-colors ${
                activeFilter === f.label
                  ? "border-accent/50 bg-accent/10 text-accent-light"
                  : "border-white/10 text-neutral-500 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tx or block…"
          className="w-full border border-white/10 bg-transparent px-3 py-1.5 font-geist-mono text-[11px] text-white outline-none placeholder:text-neutral-600 focus:border-accent/40 sm:w-56"
        />
      </div>

      {isLoading && (
        <div className="mt-6">
          <Loader size="sm" label="SCANNING PROTOCOL LOGS…" />
        </div>
      )}
      {error && <div className="mt-6 text-sm text-red-400">{(error as Error).message}</div>}
      {!isLoading && visible.length === 0 && (
        <div className="mt-6 text-sm text-neutral-500">
          {data?.length ? "No activity matches this filter." : "No activity yet — submit an intent above to see it appear here."}
        </div>
      )}

      <ul className="mt-4 flex max-h-80 flex-col divide-y divide-white/10 overflow-y-auto">
        {visible.map((item) => {
          const key = `${item.transactionHash}-${item.logIndex}`;
          const isExpanded = expandedKey === key;
          return (
            <li key={key}>
              <button
                onClick={() => setExpandedKey(isExpanded ? null : key)}
                className="flex w-full flex-col gap-1 py-3 text-left transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-geist-mono text-[10px] tracking-wide uppercase ${KIND_COLOR[item.kind]}`}>
                    {item.kind}
                  </span>
                  <span className="text-sm text-neutral-300">{item.detail}</span>
                </div>
                <span className="font-geist-mono text-xs text-neutral-600">
                  block {item.blockNumber.toString()}
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-2 border-t border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between font-geist-mono text-[10px] text-neutral-500">
                    <span>RAW LOG ARGS</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCopy(item.transactionHash)}
                        className="text-accent hover:underline"
                      >
                        {copiedTx === item.transactionHash ? "COPIED" : "COPY TX"}
                      </button>
                      <a
                        href={arbiscanTxUrl(item.transactionHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline"
                      >
                        ARBISCAN ↗
                      </a>
                    </div>
                  </div>
                  <pre className="overflow-x-auto border border-white/10 bg-white/[0.02] p-3 font-geist-mono text-[11px] leading-relaxed text-neutral-300">
                    {stringifyArgs(item.args)}
                  </pre>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function NetworkGuard() {
  const { switchChain, isPending, error } = useSwitchChain();

  return (
    <Panel className="mx-auto max-w-md p-8 text-center" dither>
      <p className="text-sm text-neutral-400">
        Your wallet is connected to the wrong network. ArbiStealth runs on Arbitrum Sepolia — switch to see real
        balances and gas costs.
      </p>
      <button
        onClick={() => switchChain({ chainId: CHAIN_ID })}
        disabled={isPending}
        className="mt-6 inline-block border border-accent/50 bg-accent/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-accent-light hover:bg-accent/20 disabled:opacity-40"
      >
        {isPending ? "SWITCHING…" : "SWITCH TO ARBITRUM SEPOLIA"}
      </button>
      {error && <p className="mt-3 text-xs text-red-400">{error.message}</p>}
    </Panel>
  );
}

export default function Dashboard() {
  const { address, isConnected, chainId } = useAccount();

  if (!isConnected || !address) {
    return (
      <AppLayout>
        <Panel className="mx-auto max-w-md p-8 text-center" dither>
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

  if (chainId !== CHAIN_ID) {
    return (
      <AppLayout>
        <NetworkGuard />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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
              Identity, privacy keys, and live settlement activity for your agent — everything reads directly
              from Arbitrum Sepolia.
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

        <Reveal delay={0.08}>
          <StealthKeysPanel address={address} />
        </Reveal>
        <Reveal delay={0.11}>
          <NetworkPanel />
        </Reveal>
        <Reveal delay={0.14} className="lg:row-span-2">
          <ExplorerFeedPanel />
        </Reveal>

        <Reveal delay={0.17} className="lg:col-span-2">
          <SubmitIntentPanel address={address} />
        </Reveal>
        <Reveal delay={0.2} className="lg:col-span-2">
          <MyIntentsPanel address={address} />
        </Reveal>
      </div>
    </AppLayout>
  );
}
