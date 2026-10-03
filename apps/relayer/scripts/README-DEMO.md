# Demo scripts: seeding a settlement, and the real solver

There are two different scripts here — don't confuse them:

- **`seed-settlement.ts`** — a one-off shortcut, run once by hand, to put a
  real settlement on-chain before you present (see below).
- **`solver.ts`** — the actual automation: a standing service that watches
  the relayer's intent pool and settles matching intents on its own,
  continuously, without a human running anything per-intent.

## Architecture: how an intent gets settled now

The dashboard's "Submit A Trade Intent" panel signs an EIP-712 intent and
**POSTs it to the relayer** (`POST /intents`) — no on-chain transaction, no
gas. It does *not* call `IntentRegistry.submitIntent` directly anymore.

This matters: `SettlementRouter.executeSettlement` calls
`IntentRegistry.submitIntent` internally as its first step, which burns the
intent's nonce. If the user's wallet had already called `submitIntent`
directly on-chain (the old behavior), that nonce would already be burned,
and `executeSettlement` would revert with `NonceAlreadyUsed` for every
intent — a solver could never settle anything submitted that way. Routing
through the relayer first is what makes settlement possible at all.

The solver (`solver.ts`) polls `GET /intents` (open ones), and for each one
it can actually fill:
1. Checks the recipient has a registered ERC-5564 stealth meta-address
   (skips otherwise — `executeSettlement` would revert `RecipientNotRegistered`).
2. Checks/acquires enough `tokenOut` to fill it (mints if the token happens
   to be a permissionless-mint test token like `DemoToken`; otherwise just
   checks its own balance — a real mainnet asset never has a public mint).
3. `POST /intents/:hash/claim` to soft-lock it against other solvers.
4. Derives the real stealth output address (`computeStealthOutput` — actual
   secp256k1 math, not faked) and calls `executeSettlement` on-chain.
5. Charges a flat routing fee in **real USDG** if it holds enough, else
   settles with a zero fee (no reputation entry gets recorded for a zero
   fee, but the trade and stealth payout still happen).
6. `POST /intents/:hash/settled` with the tx hash, or `/release` to reopen
   the intent for another attempt if settlement reverted.

### Run the solver

```bash
cd contracts && forge build && cd ..   # contracts/out/ is gitignored

cd apps/relayer
SOLVER_PRIVATE_KEY=0x... pnpm solver
```

Any funded wallet works — it registers itself as an ERC-8004 agent on
startup if it isn't one already. It needs its own Arbitrum Sepolia ETH for
gas, and ideally a small USDG balance to actually charge (and earn
reputation for) the routing fee. It does **not** need to be the same wallet
as the one submitting intents from the dashboard.

Leave it running (`pnpm solver`) while you demo: submit an intent from the
dashboard, and within one poll interval (default 5s) it should settle on
its own — no seed script needed once this is running.

## Seeding one settlement ahead of time (if you'd rather not run the solver live)

`seed-settlement.ts` is the shortcut from before the solver existed: one
wallet plays both the "user" and the "agent" itself, in a single script run,
to guarantee `/explorer` has at least one real `SettlementExecuted` +
stealth announcement to show — useful if you don't want to rely on the
solver being up and polling during the actual demo.

```bash
cd contracts && forge build && cd ..

cd apps/relayer
DEMO_PRIVATE_KEY=0x... pnpm seed-settlement
```

`DEMO_PRIVATE_KEY` must be the **same wallet** you used in the browser to:
1. Register as an ERC-8004 agent (Dashboard → Register Agent)
2. Generate + register ERC-5564 stealth keys (Settings → Generate/Register Keys)
3. Hold at least 1 USDG — get some free from https://faucet.paxos.com
   (USDG tab → Network: Arbitrum Sepolia → paste your address → Send 100 Tokens)

The script reads all three from chain rather than redoing them, then, as
that one wallet playing both roles: deploys two throwaway `DemoToken`s to
stand in for tokenIn/tokenOut, mints + approves them, signs an intent as the
"user", and calls `executeSettlement` as the "agent" — paying the real
stealth address, a real USDG routing fee, and emitting the announcement.

Reload `/explorer` afterward — filters for Settlements and Announcements
should both show a real entry.

## What's testnet-only shortcut vs. what mainnet actually needs

Say this part out loud during the demo rather than let it go unsaid:

| This does | On Arbitrum One this would instead be |
|---|---|
| `DemoToken.mint()` has no access control | Real tokenIn/tokenOut (USDC, WETH, ARB, …) that the user and agent already hold — nobody can mint arbitrary supply of a real asset |
| `seed-settlement.ts`: one wallet plays both "user" and "agent" | Two independent parties — `solver.ts` already models this correctly (any wallet can run it) |
| `SimpleAgentIdentityRegistry`/`SimpleAgentReputationRegistry` (self-hosted, ERC-8004-*shaped*) | The canonical ERC-8004 identity/reputation contracts — a known, already-tracked gap, not done here |
| The relayer's intent pool is in-memory, reset on restart | A persistent store (DB), plus likely multiple independent solver operators competing for fills rather than one |
| ERC-5564 Announcer / ERC-6538 Registry addresses are this deployment's Sepolia copies | Verify independently whether the standard's reference deployment exists at the same addresses on Arbitrum One before assuming — don't carry over the Sepolia addresses without checking |
| Fee is paid in real Sepolia-testnet USDG | On mainnet this is the real mainnet Paxos USDG contract instead — `0x004B506865409877C9fA29bfb1ebA929984B9bbC` on Arbitrum One, a different address than Sepolia's (confirmed from Paxos's own docs) — and `FeeVault.withdraw` (owner-only) would need a secured multisig, not a single EOA |

`seed-settlement.ts` is a "prove the pipes connect" exercise. `solver.ts` is
the real thing, minus mainnet-grade liquidity/matching logic and running on
a single operator instead of a competitive market of them.
