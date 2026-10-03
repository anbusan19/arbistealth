# Seeding one real settlement for a demo

`seed-settlement.ts` makes the Explorer page show a genuine `SettlementExecuted`
+ stealth announcement before you present, since the live UI has no path to
produce one (see the conversation history for why: no funded counterparty
agent, no stealth-math UI, `apps/relayer`'s HTTP server never calls the chain).

## Run it

```bash
# contracts/out/ is gitignored — build it once so DemoToken's artifact exists
cd contracts && forge build && cd ..

cd apps/relayer
DEMO_PRIVATE_KEY=0x... pnpm seed-settlement
```

`DEMO_PRIVATE_KEY` must be the **same wallet** you used in the browser to:
1. Register as an ERC-8004 agent (Dashboard → Register Agent)
2. Generate + register ERC-5564 stealth keys (Settings → Generate/Register Keys)
3. Hold at least 1 USDG — get some free from https://faucet.paxos.com
   (USDG tab → Network: Arbitrum Sepolia → paste your address → Send 100 Tokens)

The script reads all three from chain rather than redoing them. It then, as
that one wallet playing both roles:
- deploys two throwaway `DemoToken`s (testnet-only mintable ERC20s) to stand
  in for tokenIn/tokenOut
- mints itself a balance of each and approves `SettlementRouter`
- signs an intent as the "user"
- calls `executeSettlement` as the "agent" counterparty, which pulls the
  input token, pays the output token to a real freshly-derived stealth
  address (computed from the registered stealth keys — this part is not
  faked), pays the routing fee in **real Paxos USDG** (not a demo token —
  confirmed this is the correct, official Arbitrum Sepolia USDG address),
  and emits the announcement

Reload `/explorer` afterward — filters for Settlements and Announcements
should both show a real entry.

## What's testnet-only shortcut vs. what mainnet actually needs

Say this part out loud during the demo rather than let it go unsaid:

| This script does | On Arbitrum One this would instead be |
|---|---|
| Deploys `DemoToken` and calls `mint()` with no access control | Real tokenIn/tokenOut (USDC, WETH, ARB, …) that the user and agent already hold — nobody can mint arbitrary supply of a real asset |
| One wallet plays both "user" and "agent" | Two independent parties: an end-user's wallet, and a separate, economically-incentivized solver address that competes for the fill and stakes real collateral |
| `SimpleAgentIdentityRegistry`/`SimpleAgentReputationRegistry` (self-hosted, ERC-8004-*shaped*) | The canonical ERC-8004 identity/reputation contracts — a known, already-tracked gap, not done here |
| `apps/relayer` isn't involved at all — this script calls the chain directly | A live solver service watching `IntentSubmitted` and calling `executeSettlement` itself, continuously, for any matching intent — `apps/relayer` is currently just an HTTP intent-pool stub and does not do this |
| ERC-5564 Announcer / ERC-6538 Registry addresses are this deployment's Sepolia copies | Verify independently whether the standard's reference deployment exists at the same addresses on Arbitrum One before assuming — don't carry over the Sepolia addresses without checking |
| Fee is paid in real Sepolia-testnet USDG | On mainnet this is the real mainnet Paxos USDG contract instead — `0x004B506865409877C9fA29bfb1ebA929984B9bbC` on Arbitrum One, a different address than Sepolia's (confirmed from Paxos's own docs) — and `FeeVault.withdraw` (owner-only) would need a secured multisig, not a single EOA |

This script is a "prove the pipes connect" exercise, not a rehearsal of the
real settlement path. Don't present it as more than that.
