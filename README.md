# CROO Console

An elite developer cockpit for the [CROO Network](https://docs.croo.network) — a real-time web dashboard and companion CLI that let any CROO agent operator drive negotiations, orders, deliveries, live events, and cross-chain DID / spoofing checks directly against the production CROO API.

- **In-app docs**: `/docs`
- **Console**: `/console`
- **CROO protocol docs**: <https://docs.croo.network>

Everything talks to the real CROO backend (`https://api.croo.network` REST + `wss://api.croo.network/ws`). No mocks, no shims.

---

## What's in this repo

```
.
├── src/                        # TanStack Start v1 web app (React 19 + Vite 7 + Tailwind v4)
│   ├── routes/
│   │   ├── index.tsx           # Landing page
│   │   ├── console.tsx         # /console — live dashboard (orders, negotiations, events, verify)
│   │   └── docs.tsx            # /docs — full user guide (dashboard + CLI + verify)
│   └── lib/
│       ├── croo.functions.ts   # createServerFn proxy for the CROO REST API
│       ├── crooVerify.ts       # Shared DID + cross-chain operator resolver
│       └── useCrooStream.ts    # Browser-side WebSocket hook (auto-reconnect)
└── packages/
    └── croo-cli/               # `croo` CLI — same REST + WS surface, in your shell
        ├── bin/croo.mjs
        └── src/verify.mjs
```

Two products, one core:
1. **`/console`** — a browser dashboard for humans.
2. **`croo-cli`** — the same power for CI, scripts, and terminals.

They share the same verification logic (`crooVerify`) so the console and CLI always agree.

---

## Features

### Real-time dashboard (`/console`)
- Paste your `croo_sk_...` key (stored in `localStorage`, sent server-side via `X-SDK-Key`).
- Tabs: **Orders**, **Negotiations**, **Send order**, **Events**, **Verify DID**, **Raw JSON**.
- Live WebSocket feed from `wss://api.croo.network/ws?key=…` with automatic reconnect (exponential back-off, max 30 s).
- One-click actions: `pay`, `accept`, `deliver`, `reject`.
- Events auto-refresh the Orders/Negotiations panels — no manual polling.

### CLI (`croo-cli`)
Same endpoints, terminal-friendly. Great for CI, cron, and quick one-liners.

### Agent DID Verification (spoof-check) — the killer feature
Resolves an agent's on-chain identity across chains using CROO's Layer 1 model (ERC-8004 DID + Sovereign Vault + Merit):

1. `GET /backend/v1/agents/{id}` on CROO for the off-chain record.
2. `eth_call ownerOf(tokenId)` on the ERC-8004 DID NFT contract for every configured EVM RPC.
3. `eth_getCode(vault)` to confirm the AA wallet is actually deployed on each chain.
4. Reconciles every discovered address against a claimed operator and returns a verdict:
   - `clean` — every source collapses to the same address.
   - `warning` — identity spans multiple addresses.
   - `spoof_risk` — hard mismatch between claimed operator and on-chain owner.
   - `inconclusive` — not enough evidence (missing DID contract, missing on-chain data, etc.).

Both the console and the CLI expose the full evidence JSON so you can attach it to an incident report or a PR review.

---

## Run the web app locally

Requires Node ≥ 18 and [Bun](https://bun.sh) (the repo uses `bun.lock`; `npm`/`pnpm` also work).

```bash
bun install          # or: npm install
bun run dev          # Vite dev server on http://localhost:8080
bun run build        # production build
bun run preview      # serve the production build
```

Open <http://localhost:8080/console> and paste an SDK key from <https://agent.croo.network> to start driving live agents. No env vars required — the key travels with each server-function call.

---

## Run the CLI locally

The CLI lives in `packages/croo-cli/` and has a single runtime dependency (`ws`).

### Option A — run straight from the repo (fastest for teams testing this PR)

```bash
# From the repo root
cd packages/croo-cli
npm install                  # installs `ws`

export CROO_SDK_KEY=croo_sk_your_key_here   # get one from https://agent.croo.network

node bin/croo.mjs whoami
node bin/croo.mjs orders
node bin/croo.mjs watch      # live-tail wss://api.croo.network/ws
```

### Option B — install the `croo` binary globally from the repo

```bash
cd packages/croo-cli
npm install
npm link                     # exposes the `croo` command on your PATH

croo whoami
croo negotiations
croo verify agent_abc123 --claimed=0x... --did-contract=0x...
```

Unlink with `npm unlink -g croo-cli` when you're done.

### Option C — run once without installing

```bash
CROO_SDK_KEY=croo_sk_... npx --yes --package=./packages/croo-cli croo watch
```

### Environment variables

| Var              | Default                          | Purpose                                    |
| ---------------- | -------------------------------- | ------------------------------------------ |
| `CROO_SDK_KEY`   | *(required)*                     | Your `croo_sk_...` agent key.              |
| `CROO_API_URL`   | `https://api.croo.network`       | Override the REST base (staging / mock).   |
| `CROO_WS_URL`    | `wss://api.croo.network/ws`      | Override the WebSocket endpoint.           |

### Command reference

```bash
croo whoami                                # verify key against the live API
croo orders [--role=buyer|provider]        # list orders (default role=buyer)
croo negotiations [--role=requester|provider] # list negotiations (default role=requester)
croo order <order_id>                      # inspect one order
croo delivery <order_id>                   # fetch the deliverable
croo send <svc_id> "requirements"          # POST /orders/negotiate as a requester
croo accept <negotiation_id>               # provider accepts a negotiation
croo pay <order_id>                        # requester pays
croo deliver <order_id> '{"result":1}'     # deliver (auto-detects text vs schema)
croo reject <order_id> "reason"            # reject an order
croo watch                                 # live-tail WebSocket events
croo verify <agent_id> [flags]             # DID + cross-chain spoof check
```

> **Role semantics** — CROO's REST API uses slightly different role names per
> endpoint: `/orders` accepts `buyer|provider`; `/orders/negotiate` accepts
> `requester|provider`. The CLI and the `/console` dashboard translate
> `buyer → requester` for the negotiate endpoint automatically, so you always
> pick from a single **buyer / provider** toggle.

`verify` flags:

```bash
croo verify agent_abc123 \
  --claimed=0xYourClaimedOperator \
  --did-contract=0xErc8004ContractOnBase \
  --rpc=base=https://mainnet.base.org \
  --rpc=ethereum=https://ethereum-rpc.publicnode.com \
  --json > evidence.json
```

Verdicts: `clean` / `warning` / `spoof_risk` / `inconclusive` — each with per-source reasons and full evidence JSON.

### Live-API smoke test (verified)

Every command in this repo is exercised against `https://api.croo.network`
with a real `croo_sk_...` key. Expected outputs:

```text
$ croo whoami          →  ok  key accepted by https://api.croo.network
$ croo orders          →  (no orders)                # or a table of your orders
$ croo negotiations    →  (no negotiations)          # or a table of live negotiations
$ croo watch           →  ● connected — waiting for events (Ctrl+C to quit)
$ croo verify <id>     →  verdict: clean|warning|spoof_risk|inconclusive + evidence
```

An invalid or missing key returns a real `CROO: SDK_KEY_INVALID (401)` — that
is your proof the CLI is hitting production, not a mock.


---

## How to test end-to-end

The whole surface is production API — you can validate it in under two minutes.

1. **Get a key.** Register an agent at <https://agent.croo.network>, copy the `croo_sk_...`.
2. **Sanity check auth.**
   ```bash
   export CROO_SDK_KEY=croo_sk_...
   node packages/croo-cli/bin/croo.mjs whoami
   ```
   An invalid key returns a real `CROO: SDK_KEY_INVALID (401)` from the backend — that's the confirmation you're hitting production, not a mock.
3. **Open the dashboard.** `bun run dev` → <http://localhost:8080/console> → paste the same key. The WebSocket badge should flip to **open** within a second.
4. **Drive a live order.**
   - CLI: `croo send <service_id> "smoke test from cli"`
   - Console → **Send order** tab. Watch the negotiation appear in both surfaces at the same time via the WebSocket feed.
5. **Run a DID spoof check** on any agent id you know:
   ```bash
   croo verify <agent_id> --claimed=0x... --did-contract=0x...
   ```
   Or use the **verify did** tab in `/console` for the same output with a color-coded verdict banner.

Anything reachable by the official [`@croo-network/sdk`](https://www.npmjs.com/package/@croo-network/sdk) is reachable here — the console and CLI wrap the identical REST + WS surface.

---

## Architecture (short version)

- **Frontend**: TanStack Start v1 (React 19, Vite 7, Tailwind v4) on Cloudflare Workers (edge SSR).
- **Server functions** (`src/lib/croo.functions.ts`): typed RPC via `createServerFn`. The browser never talks to `api.croo.network` directly for REST — the key is forwarded server-side, so it never lands in a third-party request log tied to your origin.
- **WebSocket** (`src/lib/useCrooStream.ts`): browser-side, uses the same query-param key auth as the official SDK.
- **Verifier** (`src/lib/crooVerify.ts` + `packages/croo-cli/src/verify.mjs`): pure fetch — CROO REST + JSON-RPC `eth_call` / `eth_getCode`. Works on any EVM chain you hand it via `--rpc=name=url`.

Full user-facing walkthrough (with screenshots and copy-paste snippets) lives at `/docs` inside the running app.

---

## For teams / reviewers

- **No install for reviewers**: run the app locally (`npm install && npm run dev`), open `/console`, paste a key, done.
- **Reproducibility**: every action in the UI has a CLI equivalent — attach a `croo … --json` output to bug reports.
- **CI usage**: `croo verify` returns a non-zero-friendly JSON verdict; pipe into `jq '.verdict.level'` and gate deploys on `clean`.
- **Reporting a bug**: include the failing command, the SDK key prefix (never the full key), and the JSON from `--json`.

---

## License

MIT — see individual package files.
