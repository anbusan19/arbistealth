"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { Log } from "viem";
import { AppLayout } from "@/layouts/AppLayout";
import { Panel } from "@/components/ui/Panel";
import { SectionLabel } from "@/components/ui/SectionLabel";
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
}

function toFeedItem(kind: FeedItem["kind"], log: Log, detail: string): FeedItem {
  return {
    kind,
    blockNumber: log.blockNumber ?? 0n,
    transactionHash: log.transactionHash as `0x${string}`,
    logIndex: log.logIndex ?? 0,
    detail,
  };
}

const KIND_COLOR: Record<FeedItem["kind"], string> = {
  "Intent Submitted": "text-neutral-300",
  "Settlement Executed": "text-accent",
  "Stealth Announcement": "text-fuchsia-300",
  "Agent Registered": "text-emerald-300",
};

export default function Explorer() {
  const publicClient = usePublicClient();

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

  return (
    <AppLayout>
      <h1 className="mb-2 text-2xl font-medium text-white">Explorer</h1>
      <p className="mb-8 text-sm text-neutral-400">
        Live protocol activity on Arbitrum Sepolia — read directly from the deployed contracts, no indexer required.
      </p>

      <SectionLabel>Recent Activity</SectionLabel>

      <Panel className="mt-6 divide-y divide-white/10">
        {isLoading && <div className="px-6 py-8 text-sm text-neutral-500">Scanning chain history…</div>}
        {error && <div className="px-6 py-8 text-sm text-red-400">{(error as Error).message}</div>}
        {!isLoading && data?.length === 0 && (
          <div className="px-6 py-8 text-sm text-neutral-500">
            No activity yet — submit an intent from the Dashboard to see it appear here.
          </div>
        )}

        {data?.map((item) => (
          <a
            key={`${item.transactionHash}-${item.logIndex}`}
            href={arbiscanTxUrl(item.transactionHash)}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col gap-1 px-6 py-4 hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between sm:px-8"
          >
            <div className="flex items-center gap-3">
              <span className={`font-geist-mono text-[10px] tracking-wide uppercase ${KIND_COLOR[item.kind]}`}>
                {item.kind}
              </span>
              <span className="text-sm text-neutral-300">{item.detail}</span>
            </div>
            <span className="font-geist-mono text-xs text-neutral-600">block {item.blockNumber.toString()}</span>
          </a>
        ))}
      </Panel>
    </AppLayout>
  );
}
