import type { Address, Hex, PublicClient } from "viem";
import { checkStealthOutput } from "./stealth.js";

const announcementEvent = {
  type: "event",
  name: "Announcement",
  inputs: [
    { name: "schemeId", type: "uint256", indexed: true },
    { name: "stealthAddress", type: "address", indexed: true },
    { name: "caller", type: "address", indexed: true },
    { name: "ephemeralPubKey", type: "bytes", indexed: false },
    { name: "metadata", type: "bytes", indexed: false },
  ],
} as const;

export interface ScanAnnouncementsParams {
  publicClient: PublicClient;
  /**
   * Address of the canonical ERC-5564 announcer contract — not
   * StealthAnnouncerAdapter, which re-emits its own differently-shaped
   * `ArbiStealthAnnouncement` event and doesn't repeat the standard one.
   */
  announcer: Address;
  viewingPrivateKey: Hex;
  spendingPublicKey: Hex;
  fromBlock?: bigint;
  toBlock?: bigint | "latest";
}

export interface ScanMatch {
  stealthAddress: Address;
  ephemeralPublicKey: Hex;
  blockNumber: bigint;
  transactionHash: Hex;
}

/**
 * Scans ERC-5564 Announcement logs and returns the ones addressed to this
 * viewing key. Per the ERC-5564 convention, the announcement's `metadata`
 * carries the view tag as its first byte.
 */
export async function scanAnnouncements(params: ScanAnnouncementsParams): Promise<ScanMatch[]> {
  const logs = await params.publicClient.getLogs({
    address: params.announcer,
    event: announcementEvent,
    fromBlock: params.fromBlock ?? 0n,
    toBlock: params.toBlock ?? "latest",
  });

  const matches: ScanMatch[] = [];

  for (const log of logs) {
    const { stealthAddress, ephemeralPubKey, metadata } = log.args;
    if (!stealthAddress || !ephemeralPubKey || !metadata || metadata.length < 4) continue;

    const viewTag = Number.parseInt(metadata.slice(2, 4), 16);
    const scan = checkStealthOutput({
      ephemeralPublicKey: ephemeralPubKey,
      viewTag,
      viewingPrivateKey: params.viewingPrivateKey,
      spendingPublicKey: params.spendingPublicKey,
    });

    if (scan.isForMe && scan.stealthAddress === stealthAddress) {
      matches.push({
        stealthAddress,
        ephemeralPublicKey: ephemeralPubKey,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      });
    }
  }

  return matches;
}
