#!/usr/bin/env node
// croo-cli — real REST + WebSocket wrapper around api.croo.network
// Requires: Node 18+ (uses global fetch). WebSocket via `ws` package.

import WebSocket from "ws";
import { verifyAgent } from "../src/verify.mjs";

const BASE = process.env.CROO_API_URL || "https://api.croo.network";
const WS_URL = process.env.CROO_WS_URL || "wss://api.croo.network/ws";
const KEY = process.env.CROO_SDK_KEY;

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";

function die(msg, code = 1) {
  console.error(`${RED}error${RESET} ${msg}`);
  process.exit(code);
}

function requireKey() {
  if (!KEY || !KEY.startsWith("croo_sk_")) {
    die("CROO_SDK_KEY not set. Export a croo_sk_… key from agent.croo.network.");
  }
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}/backend/v1${path}`, {
    method,
    headers: {
      "X-SDK-Key": KEY,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    const reason = parsed?.reason || parsed?.message || parsed?.error || `HTTP ${res.status}`;
    throw new Error(`${reason} (${res.status})`);
  }
  return parsed;
}

function print(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function normalizeList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of ["items", "data", "list", "orders", "negotiations"]) {
    if (Array.isArray(data[k])) return data[k];
  }
  return [];
}

function tableRow(row) {
  const status = row.status || "-";
  const id = row.orderId || row.order_id || row.negotiationId || row.negotiation_id || "-";
  const price = row.price != null ? String(row.price) : "-";
  const req = row.requesterAgentId || row.requester_agent_id || "-";
  const prov = row.providerAgentId || row.provider_agent_id || "-";
  const color =
    status === "completed" || status === "paid" || status === "accepted"
      ? GREEN
      : status.startsWith("reject") || status.includes("fail") || status === "expired"
        ? RED
        : YELLOW;
  console.log(
    `${color}${status.padEnd(11)}${RESET} ${DIM}${String(id).padEnd(24)}${RESET} ${price.padStart(6)}  ${DIM}req:${RESET}${trunc(req)}  ${DIM}prov:${RESET}${trunc(prov)}`,
  );
}

function trunc(s, keep = 8) {
  s = String(s);
  return s.length <= keep * 2 + 3 ? s : `${s.slice(0, keep)}…${s.slice(-4)}`;
}

const HELP = `${BOLD}croo-cli${RESET} — cockpit for CROO agents (api.croo.network)

${BOLD}usage:${RESET}
  croo orders [--status=<s>] [--role=<r>]     list latest orders
  croo negotiations [--status=<s>]            list negotiations
  croo order <order_id>                       show one order
  croo delivery <order_id>                    fetch deliverable
  croo send <service_id> [requirements]       POST /orders/negotiate
  croo accept <negotiation_id>                accept a negotiation
  croo pay <order_id>                         pay an order
  croo deliver <order_id> <text|json>         submit deliverable
  croo reject <order_id> [reason]             reject an order
  croo watch                                  live-tail wss://api.croo.network/ws
  croo whoami                                 check CROO_SDK_KEY

${BOLD}env:${RESET}
  CROO_SDK_KEY   ${DIM}(required)${RESET}  croo_sk_… from agent.croo.network
  CROO_API_URL   ${DIM}default${RESET}     https://api.croo.network
  CROO_WS_URL    ${DIM}default${RESET}     wss://api.croo.network/ws
`;

function parseFlags(args) {
  const out = { _: [], flags: {} };
  for (const a of args) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      out.flags[k] = v ?? true;
    } else out._.push(a);
  }
  return out;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === "-h" || cmd === "--help" || cmd === "help") {
    console.log(HELP);
    return;
  }

  const { _: positional, flags } = parseFlags(rest);

  try {
    switch (cmd) {
      case "whoami": {
        requireKey();
        const data = await api("GET", "/orders?page=1&page_size=1");
        console.log(`${GREEN}ok${RESET} key accepted by ${BASE}`);
        console.log(`${DIM}sample response:${RESET} ${JSON.stringify(data).slice(0, 200)}…`);
        return;
      }
      case "orders": {
        requireKey();
        const q = new URLSearchParams({ page: "1", page_size: flags.limit || "20" });
        if (flags.status) q.set("status", flags.status);
        if (flags.role) q.set("role", flags.role);
        const data = await api("GET", `/orders?${q}`);
        const list = normalizeList(data);
        if (!list.length) return console.log(`${DIM}(no orders)${RESET}`);
        list.forEach(tableRow);
        return;
      }
      case "negotiations": {
        requireKey();
        const q = new URLSearchParams({ page: "1", page_size: flags.limit || "20" });
        if (flags.status) q.set("status", flags.status);
        if (flags.role) q.set("role", flags.role);
        const data = await api("GET", `/orders/negotiate?${q}`);
        const list = normalizeList(data);
        if (!list.length) return console.log(`${DIM}(no negotiations)${RESET}`);
        list.forEach(tableRow);
        return;
      }
      case "order": {
        requireKey();
        const id = positional[0] || die("order id required");
        print(await api("GET", `/orders/${id}`));
        return;
      }
      case "delivery": {
        requireKey();
        const id = positional[0] || die("order id required");
        print(await api("GET", `/orders/${id}/delivery`));
        return;
      }
      case "send": {
        requireKey();
        const svc = positional[0] || die("service_id required");
        const requirements = positional.slice(1).join(" ") || "";
        print(
          await api("POST", "/orders/negotiate", {
            service_id: svc,
            requirements,
            metadata: "",
          }),
        );
        return;
      }
      case "accept": {
        requireKey();
        const id = positional[0] || die("negotiation_id required");
        print(await api("POST", `/orders/negotiate/${id}/accept`));
        return;
      }
      case "pay": {
        requireKey();
        const id = positional[0] || die("order_id required");
        print(await api("POST", `/orders/${id}/pay`));
        return;
      }
      case "deliver": {
        requireKey();
        const id = positional[0] || die("order_id required");
        const payload = positional.slice(1).join(" ");
        if (!payload) die("deliverable text required");
        // If it parses as JSON, treat as schema; else text.
        let body;
        try {
          JSON.parse(payload);
          body = { deliverable_type: "schema", deliverable_schema: payload };
        } catch {
          body = { deliverable_type: "text", deliverable_text: payload };
        }
        print(await api("POST", `/orders/${id}/deliver`, body));
        return;
      }
      case "reject": {
        requireKey();
        const id = positional[0] || die("order_id required");
        const reason = positional.slice(1).join(" ") || "rejected via croo-cli";
        print(await api("POST", `/orders/${id}/reject`, { reason }));
        return;
      }
      case "watch": {
        requireKey();
        await watch();
        return;
      }
      default:
        console.error(`unknown command: ${cmd}\n`);
        console.log(HELP);
        process.exit(1);
    }
  } catch (e) {
    die(e.message);
  }
}

async function watch() {
  const url = `${WS_URL}?key=${encodeURIComponent(KEY)}`;
  console.log(`${DIM}connecting${RESET} ${url.replace(KEY, "croo_sk_…")}`);
  let attempt = 0;
  let stopped = false;

  const connect = () => {
    const ws = new WebSocket(url);
    let pingTimer;

    ws.on("open", () => {
      attempt = 0;
      console.log(`${GREEN}●${RESET} connected — waiting for events (Ctrl+C to quit)`);
      pingTimer = setInterval(() => {
        try {
          ws.ping();
        } catch {}
      }, 30_000);
    });

    ws.on("message", (raw) => {
      let ev;
      try {
        ev = JSON.parse(raw.toString());
      } catch {
        ev = { type: "raw", data: raw.toString() };
      }
      const t = new Date().toISOString();
      console.log(`${DIM}${t}${RESET} ${CYAN}${ev.type || "event"}${RESET} ${JSON.stringify(ev)}`);
    });

    ws.on("close", (code, reason) => {
      clearInterval(pingTimer);
      if (stopped) return;
      attempt++;
      const delay = Math.min(1000 * 2 ** (attempt - 1), 30_000);
      console.log(
        `${YELLOW}○${RESET} closed (${code} ${reason || ""}) — reconnecting in ${delay}ms`,
      );
      setTimeout(connect, delay);
    });

    ws.on("error", (err) => {
      console.error(`${RED}ws error:${RESET} ${err.message}`);
    });
  };

  process.on("SIGINT", () => {
    stopped = true;
    console.log(`\n${DIM}bye${RESET}`);
    process.exit(0);
  });

  connect();
}

main();
