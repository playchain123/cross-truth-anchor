import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  crooTestKey,
  crooListNegotiations,
  crooListOrders,
  crooNegotiate,
  crooAcceptNegotiation,
  crooPayOrder,
  crooDeliverOrder,
  crooRejectOrder,
  crooGetDelivery,
  crooVerifyAgent,
} from "@/lib/croo.functions";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useCrooStream, type CrooEvent } from "@/lib/useCrooStream";

export const Route = createFileRoute("/console")({
  head: () => ({
    meta: [
      { title: "CROO Console — Live agent dashboard" },
      {
        name: "description",
        content:
          "Real-time console for CROO agents. Paste your SDK key, watch negotiations, orders, and deliveries stream from api.croo.network.",
      },
    ],
  }),
  component: ConsolePage,
});

const KEY_STORAGE = "croo_sdk_key";
const POLL_MS = 4000;

type Status = "idle" | "checking" | "ok" | "error";

function ConsolePage() {
  const [sdkKey, setSdkKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(KEY_STORAGE)
        : null;
    if (stored) setSdkKey(stored);
  }, []);

  const testKey = useServerFn(crooTestKey);

  const connect = useCallback(async () => {
    if (!sdkKey.trim()) return;
    setStatus("checking");
    setStatusMsg("Contacting api.croo.network…");
    try {
      const res = await testKey({ data: { sdkKey: sdkKey.trim() } });
      if (res.ok) {
        window.localStorage.setItem(KEY_STORAGE, sdkKey.trim());
        setStatus("ok");
        setStatusMsg("Connected to api.croo.network");
      } else {
        setStatus("error");
        setStatusMsg(res.error || "Rejected by CROO");
      }
    } catch (e) {
      setStatus("error");
      setStatusMsg((e as Error).message);
    }
  }, [sdkKey, testKey]);

  const disconnect = useCallback(() => {
    window.localStorage.removeItem(KEY_STORAGE);
    setSdkKey("");
    setStatus("idle");
    setStatusMsg("");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            /console
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Agent operator console
          </h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Live proxy to <code className="text-signal">api.croo.network</code>.
            Your key stays in your browser and is sent per-request.
          </p>
        </div>

        <ConnectPanel
          sdkKey={sdkKey}
          setSdkKey={setSdkKey}
          status={status}
          statusMsg={statusMsg}
          connect={connect}
          disconnect={disconnect}
        />

        {status === "ok" && <Dashboard sdkKey={sdkKey.trim()} />}
      </main>
      <Footer />
    </div>
  );
}

function ConnectPanel({
  sdkKey,
  setSdkKey,
  status,
  statusMsg,
  connect,
  disconnect,
}: {
  sdkKey: string;
  setSdkKey: (v: string) => void;
  status: Status;
  statusMsg: string;
  connect: () => void;
  disconnect: () => void;
}) {
  const dotColor =
    status === "ok"
      ? "bg-signal"
      : status === "error"
        ? "bg-destructive"
        : status === "checking"
          ? "bg-yellow-400 animate-pulse"
          : "bg-muted-foreground";

  return (
    <div className="mb-8 border border-border bg-card/40 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          {status === "ok"
            ? "connected"
            : status === "checking"
              ? "checking…"
              : status === "error"
                ? "auth failed"
                : "disconnected"}
        </div>
        {status === "ok" && (
          <button
            onClick={disconnect}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive"
          >
            disconnect
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="password"
          value={sdkKey}
          onChange={(e) => setSdkKey(e.target.value)}
          placeholder="croo_sk_…"
          className="flex-1 border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          onClick={connect}
          disabled={!sdkKey.trim() || status === "checking"}
          className="inline-flex items-center justify-center border border-border bg-signal px-4 py-2 text-xs font-semibold uppercase tracking-widest text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {status === "ok" ? "reconnect" : "connect"}
        </button>
      </div>
      {statusMsg && (
        <div
          className={`mt-3 font-sans text-xs ${
            status === "error" ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {statusMsg}
        </div>
      )}
      {status !== "ok" && (
        <p className="mt-3 font-sans text-xs text-muted-foreground">
          Don't have a key? Get one at{" "}
          <a
            className="text-signal hover:underline"
            href="https://agent.croo.network"
            target="_blank"
            rel="noreferrer"
          >
            agent.croo.network
          </a>{" "}
          — register an agent, then copy the <code>croo_sk_…</code> value.
        </p>
      )}
    </div>
  );
}

type Tab = "orders" | "negotiations" | "send" | "events" | "verify";

function Dashboard({ sdkKey }: { sdkKey: string }) {
  const [tab, setTab] = useState<Tab>("orders");
  const [role, setRole] = useState<"buyer" | "provider">("buyer");
  const [bump, setBump] = useState(0);
  const { status, events, clear } = useCrooStream(sdkKey, () => {
    setBump((n) => n + 1);
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "orders", label: "orders" },
    { id: "negotiations", label: "negotiations" },
    { id: "events", label: `events${events.length ? ` (${events.length})` : ""}` },
    { id: "verify", label: "verify did" },
    { id: "send", label: "send order" },
  ];

  const dot =
    status === "open"
      ? "bg-signal"
      : status === "connecting"
        ? "bg-yellow-400 animate-pulse"
        : status === "error"
          ? "bg-destructive"
          : "bg-muted-foreground";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          websocket · wss://api.croo.network/ws · {status}
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>role</span>
          <div className="flex gap-px border border-border bg-border">
            {(["buyer", "provider"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`bg-background px-3 py-1 ${role === r ? "text-signal" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mb-4 flex gap-px border border-border bg-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 bg-background px-4 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
              tab === t.id
                ? "text-signal"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && <OrdersPanel sdkKey={sdkKey} bump={bump} role={role} />}
      {tab === "negotiations" && <NegotiationsPanel sdkKey={sdkKey} bump={bump} role={role} />}
      {tab === "send" && <SendOrderPanel sdkKey={sdkKey} />}
      {tab === "events" && <EventsPanel events={events} clear={clear} status={status} />}
      {tab === "verify" && <VerifyPanel sdkKey={sdkKey} />}
    </div>
  );
}

function EventsPanel({
  events,
  clear,
  status,
}: {
  events: CrooEvent[];
  clear: () => void;
  status: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <div>ws status: {status} · {events.length} events (newest first)</div>
        <button className="hover:text-foreground" onClick={clear}>
          clear
        </button>
      </div>
      {events.length === 0 && (
        <EmptyBox message="Waiting for live events from wss://api.croo.network/ws…" />
      )}
      <div className="grid gap-2">
        {events.map((e, i) => (
          <div key={i} className="border border-border bg-card/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="border border-signal/40 bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-signal">
                {e.type ?? "event"}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {e.timestamp}
              </span>
            </div>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
              {JSON.stringify(e, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function usePolling<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      try {
        const r = await fn();
        if (!mounted) return;
        setData(r);
        setErr(null);
      } catch (e) {
        if (!mounted) return;
        setErr((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
        timer = setTimeout(() => mounted && setTick((n) => n + 1), POLL_MS);
      }
    };
    run();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, err, loading, refresh: () => setTick((n) => n + 1) };
}

function OrdersPanel({ sdkKey, bump }: { sdkKey: string; bump: number }) {
  const listOrders = useServerFn(crooListOrders);
  const payOrder = useServerFn(crooPayOrder);
  const rejectOrder = useServerFn(crooRejectOrder);
  const deliverOrder = useServerFn(crooDeliverOrder);
  const getDelivery = useServerFn(crooGetDelivery);

  const call = useCallback(
    () => listOrders({ data: { sdkKey, pageSize: 25 } }),
    [sdkKey, listOrders],
  );
  const { data, err, loading, refresh } = usePolling<any>(call, [sdkKey, bump]);

  const orders: any[] = useMemo(() => normalizeList(data), [data]);

  return (
    <div>
      <FeedHeader loading={loading} count={orders.length} refresh={refresh} />
      {err && <ErrorBox message={err} />}
      {orders.length === 0 && !loading && !err && (
        <EmptyBox message="No orders yet. Fire one from the 'send order' tab." />
      )}
      <div className="grid gap-2">
        {orders.map((o) => (
          <OrderRow
            key={o.orderId ?? o.order_id}
            order={o}
            onPay={async () => {
              try {
                await payOrder({
                  data: { sdkKey, orderId: o.orderId ?? o.order_id },
                });
                refresh();
              } catch (e) {
                alert((e as Error).message);
              }
            }}
            onDeliver={async (text) => {
              try {
                await deliverOrder({
                  data: {
                    sdkKey,
                    orderId: o.orderId ?? o.order_id,
                    deliverableType: "text",
                    deliverableText: text,
                  },
                });
                refresh();
              } catch (e) {
                alert((e as Error).message);
              }
            }}
            onReject={async (reason) => {
              try {
                await rejectOrder({
                  data: {
                    sdkKey,
                    orderId: o.orderId ?? o.order_id,
                    reason,
                  },
                });
                refresh();
              } catch (e) {
                alert((e as Error).message);
              }
            }}
            onFetchDelivery={async () => {
              try {
                return await getDelivery({
                  data: { sdkKey, orderId: o.orderId ?? o.order_id },
                });
              } catch (e) {
                alert((e as Error).message);
                return null;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function NegotiationsPanel({ sdkKey, bump }: { sdkKey: string; bump: number }) {
  const listNegotiations = useServerFn(crooListNegotiations);
  const accept = useServerFn(crooAcceptNegotiation);

  const call = useCallback(
    () => listNegotiations({ data: { sdkKey, pageSize: 25 } }),
    [sdkKey, listNegotiations],
  );
  const { data, err, loading, refresh } = usePolling<any>(call, [sdkKey, bump]);
  const negs: any[] = useMemo(() => normalizeList(data), [data]);

  return (
    <div>
      <FeedHeader loading={loading} count={negs.length} refresh={refresh} />
      {err && <ErrorBox message={err} />}
      {negs.length === 0 && !loading && !err && (
        <EmptyBox message="No negotiations yet." />
      )}
      <div className="grid gap-2">
        {negs.map((n) => (
          <div
            key={n.negotiationId ?? n.negotiation_id}
            className="border border-border bg-card/40 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusPill status={n.status} />
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {n.negotiationId ?? n.negotiation_id}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 font-mono text-xs text-muted-foreground sm:grid-cols-2">
                  <div>
                    service:{" "}
                    <span className="text-foreground">
                      {truncate(n.serviceId ?? n.service_id)}
                    </span>
                  </div>
                  <div>
                    requester:{" "}
                    <span className="text-foreground">
                      {truncate(n.requesterAgentId ?? n.requester_agent_id)}
                    </span>
                  </div>
                </div>
                {(n.requirements ?? "") && (
                  <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap border border-border bg-background p-2 font-mono text-[11px] text-muted-foreground">
                    {n.requirements}
                  </pre>
                )}
              </div>
              {n.status === "pending" && (
                <button
                  onClick={async () => {
                    try {
                      await accept({
                        data: {
                          sdkKey,
                          negotiationId: n.negotiationId ?? n.negotiation_id,
                        },
                      });
                      refresh();
                    } catch (e) {
                      alert((e as Error).message);
                    }
                  }}
                  className="border border-border bg-signal px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-signal-foreground hover:opacity-90"
                >
                  accept
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerifyPanel({ sdkKey }: { sdkKey: string }) {
  const verify = useServerFn(crooVerifyAgent);
  const [agentId, setAgentId] = useState("");
  const [claimed, setClaimed] = useState("");
  const [didContract, setDidContract] = useState("");
  const [rpcUrl, setRpcUrl] = useState("https://mainnet.base.org");
  const [rpcName, setRpcName] = useState("base");
  const [extraChain, setExtraChain] = useState("");
  const [extraName, setExtraName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    if (!agentId.trim()) return;
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const chains = [{ name: rpcName || "base", url: rpcUrl.trim() }];
      if (extraChain.trim())
        chains.push({ name: extraName || "chain2", url: extraChain.trim() });
      const r = await verify({
        data: {
          sdkKey,
          agentId: agentId.trim(),
          claimedOperator: claimed.trim() || undefined,
          didContract: didContract.trim() || undefined,
          chains,
        },
      });
      setResult(r);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verdict = result?.verdict?.level as string | undefined;
  const verdictCls =
    verdict === "clean"
      ? "border-signal/40 bg-signal/10 text-signal"
      : verdict === "spoof_risk"
        ? "border-destructive/60 bg-destructive/10 text-destructive"
        : verdict === "warning"
          ? "border-yellow-500/60 bg-yellow-500/10 text-yellow-400"
          : "border-border bg-card/40 text-muted-foreground";

  return (
    <div className="grid gap-4">
      <div className="border border-border bg-card/40 p-5">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          /agents/&lt;id&gt; · cross-chain ownerOf · spoofing verdict
        </div>
        <h3 className="mt-1 text-lg font-semibold">Verify Agent DID</h3>
        <p className="mt-1 font-sans text-xs text-muted-foreground">
          Resolves the CROO agent record, checks the ERC-8004 owner on each
          configured EVM chain, compares with a claimed operator address, and
          returns a verdict + full evidence JSON.
        </p>

        <div className="mt-4 grid gap-3">
          <Field label="Agent ID / DID / token id (required)">
            <input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="agent_… or did:croo:… or 12345"
              className="w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none"
              spellCheck={false}
            />
          </Field>
          <Field label="Claimed operator address (optional — enables spoof check)">
            <input
              value={claimed}
              onChange={(e) => setClaimed(e.target.value)}
              placeholder="0x…"
              className="w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none"
              spellCheck={false}
            />
          </Field>
          <Field label="ERC-8004 DID NFT contract (optional — enables on-chain ownerOf)">
            <input
              value={didContract}
              onChange={(e) => setDidContract(e.target.value)}
              placeholder="0x… (contract on Base)"
              className="w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none"
              spellCheck={false}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Chain 1 name">
              <input
                value={rpcName}
                onChange={(e) => setRpcName(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none"
              />
            </Field>
            <Field label="Chain 1 RPC">
              <input
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none"
              />
            </Field>
            <Field label="Chain 2 name (optional)">
              <input
                value={extraName}
                onChange={(e) => setExtraName(e.target.value)}
                placeholder="ethereum"
                className="w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none"
              />
            </Field>
            <Field label="Chain 2 RPC (optional)">
              <input
                value={extraChain}
                onChange={(e) => setExtraChain(e.target.value)}
                placeholder="https://…"
                className="w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none"
              />
            </Field>
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading || !agentId.trim()}
          className="mt-4 inline-flex items-center border border-border bg-signal px-4 py-2 text-xs font-semibold uppercase tracking-widest text-signal-foreground hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "verifying…" : "run verify"}
        </button>
        {err && <ErrorBox message={err} />}
      </div>

      {result && (
        <>
          <div className={`border p-4 ${verdictCls}`}>
            <div className="text-[10px] uppercase tracking-widest opacity-80">
              verdict · {result.verdict.level}
            </div>
            <div className="mt-1 text-lg font-semibold">
              {result.verdict.label}
            </div>
            {result.verdict.reasons?.length > 0 && (
              <ul className="mt-3 space-y-1 font-mono text-[11px]">
                {result.verdict.reasons.map((r: string, i: number) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-border bg-card/40 p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                extracted identity
              </div>
              <div className="mt-2 space-y-1 font-mono text-xs">
                <IdRow label="did" v={result.agentRecord?.extracted?.did} />
                <IdRow label="tokenId" v={result.agentRecord?.extracted?.tokenId} />
                <IdRow label="vault" v={result.agentRecord?.extracted?.vault} />
                <IdRow label="owner" v={result.agentRecord?.extracted?.owner} />
                <IdRow
                  label="chainId"
                  v={
                    result.agentRecord?.extracted?.chainId != null
                      ? String(result.agentRecord.extracted.chainId)
                      : null
                  }
                />
              </div>
            </div>
            <div className="border border-border bg-card/40 p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                cross-chain matches
              </div>
              <div className="mt-2 font-mono text-xs">
                <div className="text-muted-foreground">unique addresses:</div>
                {result.matches.unique.length === 0 ? (
                  <div className="text-muted-foreground">—</div>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {result.matches.unique.map((a: string) => (
                      <li key={a} className="break-all text-foreground">
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
                {result.matches.matchesClaimed?.length > 0 && (
                  <>
                    <div className="mt-3 text-signal">matches claimed:</div>
                    <ul className="mt-1 space-y-1">
                      {result.matches.matchesClaimed.map((m: string) => (
                        <li key={m}>· {m}</li>
                      ))}
                    </ul>
                  </>
                )}
                {result.matches.conflictsClaimed?.length > 0 && (
                  <>
                    <div className="mt-3 text-destructive">conflicts with claimed:</div>
                    <ul className="mt-1 space-y-1">
                      {result.matches.conflictsClaimed.map((m: string) => (
                        <li key={m}>· {m}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border border-border bg-card/40 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              evidence json
            </div>
            <pre className="mt-2 max-h-[420px] overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function IdRow({ label, v }: { label: string; v?: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all text-foreground">{v || "—"}</span>
    </div>
  );
}

function SendOrderPanel({ sdkKey }: { sdkKey: string }) {
  const negotiate = useServerFn(crooNegotiate);
  const [serviceId, setServiceId] = useState("");
  const [requirements, setRequirements] = useState("");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!serviceId.trim()) return;
    setSending(true);
    setErr(null);
    setResult(null);
    try {
      const r = await negotiate({
        data: {
          sdkKey,
          serviceId: serviceId.trim(),
          requirements,
        },
      });
      setResult(r);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-border bg-card/40 p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        /orders/negotiate · POST
      </div>
      <h3 className="mt-1 text-lg font-semibold">Send a real order</h3>
      <p className="mt-1 font-sans text-xs text-muted-foreground">
        Uses the connected key as the Requester. Provider will receive it on
        their WebSocket stream / this console.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Service ID
          </label>
          <input
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            placeholder="svc_…"
            className="mt-1 w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-signal focus:outline-none"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Requirements (free text or JSON)
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={4}
            placeholder='{"query": "summarize this dataset"}'
            className="mt-1 w-full border border-border bg-background px-3 py-2 font-mono text-xs focus:border-signal focus:outline-none"
            spellCheck={false}
          />
        </div>
        <button
          onClick={submit}
          disabled={sending || !serviceId.trim()}
          className="inline-flex items-center border border-border bg-signal px-4 py-2 text-xs font-semibold uppercase tracking-widest text-signal-foreground hover:opacity-90 disabled:opacity-40"
        >
          {sending ? "sending…" : "send negotiation"}
        </button>
      </div>
      {err && <ErrorBox message={err} />}
      {result && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-widest text-signal">
            response
          </div>
          <pre className="mt-1 max-h-64 overflow-auto border border-border bg-background p-3 font-mono text-[11px] text-muted-foreground">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  onPay,
  onDeliver,
  onReject,
  onFetchDelivery,
}: {
  order: any;
  onPay: () => void | Promise<void>;
  onDeliver: (text: string) => void | Promise<void>;
  onReject: (reason: string) => void | Promise<void>;
  onFetchDelivery: () => Promise<any>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deliverText, setDeliverText] = useState('{"result": "ok"}');
  const [delivery, setDelivery] = useState<any>(null);

  const id = order.orderId ?? order.order_id;
  const status = order.status;

  return (
    <div className="border border-border bg-card/40">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusPill status={status} />
            <button
              onClick={() => setExpanded((v) => !v)}
              className="truncate font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              {id}
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1 font-mono text-xs text-muted-foreground sm:grid-cols-3">
            <div>
              price:{" "}
              <span className="text-foreground">
                {order.price ?? "—"}{" "}
                {truncate(order.paymentToken ?? order.payment_token, 6)}
              </span>
            </div>
            <div>
              requester:{" "}
              <span className="text-foreground">
                {truncate(order.requesterAgentId ?? order.requester_agent_id)}
              </span>
            </div>
            <div>
              provider:{" "}
              <span className="text-foreground">
                {truncate(order.providerAgentId ?? order.provider_agent_id)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-1.5">
          {status === "created" && (
            <button
              onClick={onPay}
              className="border border-border bg-signal px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-signal-foreground hover:opacity-90"
            >
              pay
            </button>
          )}
          {status === "paid" && (
            <button
              onClick={() => onDeliver(deliverText)}
              className="border border-border bg-signal px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-signal-foreground hover:opacity-90"
            >
              deliver
            </button>
          )}
          {["created", "paid"].includes(status) && (
            <button
              onClick={() => onReject("cancelled from console")}
              className="border border-border bg-transparent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-destructive hover:bg-secondary"
            >
              reject
            </button>
          )}
          {status === "completed" && (
            <button
              onClick={async () => setDelivery(await onFetchDelivery())}
              className="border border-border bg-transparent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest hover:bg-secondary"
            >
              delivery
            </button>
          )}
        </div>
      </div>
      {status === "paid" && (
        <div className="border-t border-border p-3">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            deliverable text
          </label>
          <textarea
            value={deliverText}
            onChange={(e) => setDeliverText(e.target.value)}
            rows={2}
            className="mt-1 w-full border border-border bg-background px-2 py-1.5 font-mono text-[11px] focus:border-signal focus:outline-none"
          />
        </div>
      )}
      {delivery && (
        <div className="border-t border-border p-3">
          <div className="text-[10px] uppercase tracking-widest text-signal">
            delivery
          </div>
          <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
            {JSON.stringify(delivery, null, 2)}
          </pre>
        </div>
      )}
      {expanded && (
        <div className="border-t border-border p-3">
          <pre className="max-h-72 overflow-auto font-mono text-[11px] text-muted-foreground">
            {JSON.stringify(order, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  const s = status ?? "unknown";
  const good = ["completed", "paid", "accepted"].includes(s);
  const bad = [
    "rejected",
    "expired",
    "pay_failed",
    "deliver_failed",
    "create_failed",
  ].includes(s);
  const cls = good
    ? "border-signal/40 text-signal"
    : bad
      ? "border-destructive/40 text-destructive"
      : "border-border text-muted-foreground";
  return (
    <span
      className={`inline-block border ${cls} bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-widest`}
    >
      {s}
    </span>
  );
}

function FeedHeader({
  loading,
  count,
  refresh,
}: {
  loading: boolean;
  count: number;
  refresh: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : "bg-signal"}`}
        />
        {loading ? "syncing" : `${count} items · polling ${POLL_MS / 1000}s`}
      </div>
      <button
        onClick={refresh}
        className="hover:text-foreground"
      >
        refresh ↻
      </button>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-3 border border-destructive/40 bg-destructive/10 p-3 font-mono text-xs text-destructive">
      {message}
    </div>
  );
}

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-border bg-card/20 p-6 text-center font-mono text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function normalizeList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.list)) return data.list;
  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data.negotiations)) return data.negotiations;
  return [];
}

function truncate(v: any, keep = 8): string {
  if (v == null) return "—";
  const s = String(v);
  if (s.length <= keep * 2 + 3) return s;
  return `${s.slice(0, keep)}…${s.slice(-4)}`;
}
