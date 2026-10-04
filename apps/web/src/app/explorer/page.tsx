"use client";

import { useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import type { Log } from "viem";
import { FileSignature, CheckCircle2, Radar, UserPlus, type LucideIcon } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { Panel } from "@/components/ui/Panel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";
import { Loader } from "@/components/ui/Loader";
import { RequireWallet } from "@/components/dashboard/RequireWallet";
import {
  AGENT_REGISTERED_EVENT,
  ANNOUNCEMENT_EVENT,
  CONTRACTS,
  DEPLOY_BLOCK,
  INTENT_SUBMITTED_EVENT,
  SETTLEMENT_EXECUTED_EVENT,
  arbiscanTxUrl,
} from "@/lib/contracts";

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
  "Stealth Announcement": "text-neutral-300",
  "Agent Registered": "text-emerald-300",
};

const KIND_ICON: Record<FeedItem["kind"], LucideIcon> = {
  "Intent Submitted": FileSignature,
  "Settlement Executed": CheckCircle2,
  "Stealth Announcement": Radar,
  "Agent Registered": UserPlus,
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

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of FEED_FILTERS) {
      counts[f.label] = f.kinds
        ? (data ?? []).filter((item) => (f.kinds as readonly string[]).includes(item.kind)).length
        : (data ?? []).length;
    }
    return counts;
  }, [data]);

  return (
    <Panel className="p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 font-geist-mono text-[11px]">
          {FEED_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.label)}
              className={`border px-3 py-1.5 whitespace-nowrap uppercase transition-colors ${
                activeFilter === f.label
                  ? "border-accent/50 bg-accent/10 text-accent-light"
                  : "border-white/10 text-neutral-500 hover:text-white"
              }`}
            >
              {f.label} <span className="text-neutral-600">{filterCounts[f.label]}</span>
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tx, block, or detail…"
          className="w-full border border-white/10 bg-transparent px-3 py-2 font-geist-mono text-xs text-white outline-none placeholder:text-neutral-600 focus:border-accent/40 sm:w-72"
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
          {data?.length ? "No activity matches this filter." : "No activity yet on this network."}
        </div>
      )}

      <ul className="mt-6 flex flex-col divide-y divide-white/10">
        {visible.map((item) => {
          const key = `${item.transactionHash}-${item.logIndex}`;
          const isExpanded = expandedKey === key;
          return (
            <li key={key}>
              <button
                onClick={() => setExpandedKey(isExpanded ? null : key)}
                className="flex w-full flex-col gap-1 py-4 text-left transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = KIND_ICON[item.kind];
                    return <Icon size={14} strokeWidth={1.75} className={KIND_COLOR[item.kind]} />;
                  })()}
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
                      <button onClick={() => handleCopy(item.transactionHash)} className="text-accent hover:underline">
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

export default function Explorer() {
  return (
    <AppLayout>
      <RequireWallet>
        {() => (
          <>
            <Reveal>
              <div className="mb-10 flex items-center gap-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <div>
                  <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">Explorer</h1>
                  <p className="mt-2 max-w-lg text-sm text-neutral-400">
                    Live protocol activity, read directly from the deployed contracts on Arbitrum Sepolia.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <SectionLabel index="§">Recent Activity</SectionLabel>
            </Reveal>
            <Reveal delay={0.08} className="mt-4 block">
              <ExplorerFeedPanel />
            </Reveal>
          </>
        )}
      </RequireWallet>
    </AppLayout>
  );
}
