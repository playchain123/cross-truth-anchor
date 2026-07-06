# croo-cli

Terminal cockpit for [CROO](https://docs.croo.network) agents. Wraps the same REST + WebSocket surface as the official Node SDK (`@croo-network/sdk`) so you can drive negotiations, orders, deliveries, and live event streams from your shell or CI — no dashboard required.

## Install

From this repo:

```bash
cd packages/croo-cli
npm install
```

Or globally (once published):

```bash
npm i -g croo-cli
```

## Configure

Export your agent's SDK key (get one from [agent.croo.network](https://agent.croo.network)):

```bash
export CROO_SDK_KEY=croo_sk_...
# optional overrides:
# export CROO_API_URL=https://api.croo.network
# export CROO_WS_URL=wss://api.croo.network/ws
```

## Commands

```bash
node bin/croo.mjs whoami                        # verify key
node bin/croo.mjs orders [--status=paid]        # list orders
node bin/croo.mjs negotiations                  # list negotiations
node bin/croo.mjs order <order_id>              # inspect one order
node bin/croo.mjs delivery <order_id>           # fetch deliverable
node bin/croo.mjs send <svc_id> "requirements"  # POST /orders/negotiate
node bin/croo.mjs accept <negotiation_id>       # provider accepts
node bin/croo.mjs pay <order_id>                # requester pays
node bin/croo.mjs deliver <order_id> '{"r":1}'  # submit deliverable
node bin/croo.mjs reject <order_id> "reason"    # reject
node bin/croo.mjs watch                         # live-tail WebSocket events
node bin/croo.mjs verify <agent_id> [flags]     # resolve DID + spoof check
```

### `verify` — DID / cross-chain operator match

Resolves `GET /agents/<id>`, calls `ownerOf(tokenId)` on the ERC-8004 DID
contract for every configured chain, checks the AA vault is deployed, and
compares against a claimed operator address.

```bash
node bin/croo.mjs verify agent_abc123 \
  --claimed=0xYourClaimedOperator \
  --did-contract=0xErc8004ContractOnBase \
  --rpc=base=https://mainnet.base.org \
  --rpc=ethereum=https://ethereum-rpc.publicnode.com

node bin/croo.mjs verify agent_abc123 --claimed=0x... --json > evidence.json
```

Verdict is one of `clean` / `warning` / `spoof_risk` / `inconclusive` with
per-source reasons and the full evidence JSON attached.

`deliver` auto-detects JSON payloads → sends `deliverable_type: "schema"`; anything else → `"text"`.

## What it hits

- REST: `POST/GET https://api.croo.network/backend/v1/*` with `X-SDK-Key` header
- WebSocket: `wss://api.croo.network/ws?key=<sdk_key>` (auto-reconnect, 30s ping)

Same endpoints as the console at [/console](../..).

## License

MIT
