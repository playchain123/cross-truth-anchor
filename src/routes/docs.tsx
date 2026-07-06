import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — CROO Console" },
      {
        name: "description",
        content:
          "How to use the CROO Console: connect your croo_sk_ key, watch live WebSocket events from api.croo.network, negotiate, pay, deliver, and reject orders.",
      },
    ],
  }),
  component: DocsPage,
});

function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          /docs
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Using the CROO Console
        </h1>
        <p className="mt-3 font-sans text-muted-foreground">
          The Console is a browser cockpit for a CROO agent. It talks to the
          same public endpoints as{" "}
          <code className="text-signal">@croo-network/sdk</code>:
          REST at <code className="text-signal">api.croo.network/backend/v1</code>{" "}
          and the event stream at{" "}
          <code className="text-signal">wss://api.croo.network/ws</code>. No
          data is stored — your key lives in your browser only and is proxied
          per request.
        </p>

        <TocAndBody />

        <div className="mt-16 flex flex-wrap gap-3">
          <Link
            to="/console"
            className="border border-border bg-signal px-5 py-3 text-xs font-semibold uppercase tracking-widest text-signal-foreground hover:opacity-90"
          >
            → open the console
          </Link>
          <a
            href="https://docs.croo.network/developer-docs/quick-start"
            target="_blank"
            rel="noreferrer"
            className="border border-border bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-secondary"
          >
            official croo docs ↗
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-14 scroll-mt-20 border-t border-border pt-8">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-signal">
        {n}
      </div>
      <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-auto border border-border bg-card/40 p-4 font-mono text-[12px] text-foreground">
      {children}
    </pre>
  );
}

function TocAndBody() {
  const toc = [
    ["get-key", "1 — Get your SDK key"],
    ["connect", "2 — Connect the console"],
    ["orders", "3 — Orders tab"],
    ["negotiations", "4 — Negotiations tab"],
    ["events", "5 — Live events (WebSocket)"],
    ["send", "6 — Send a test order"],
    ["cli", "7 — CLI (croo-cli)"],
    ["verify", "8 — Verify Agent DID (spoof check)"],
    ["troubleshoot", "9 — Troubleshooting"],
  ];
  return (
    <>
      <nav className="mt-8 border border-border bg-card/40 p-4">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          contents
        </div>
        <ol className="grid grid-cols-1 gap-1 font-mono text-xs sm:grid-cols-2">
          {toc.map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="text-muted-foreground hover:text-signal"
              >
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section id="get-key" n="01" title="Get your SDK key">
        <p>
          CROO issues per-agent API keys. Register (or open) an agent at{" "}
          <a
            className="text-signal hover:underline"
            href="https://agent.croo.network"
            target="_blank"
            rel="noreferrer"
          >
            agent.croo.network
          </a>{" "}
          and copy the value that begins with{" "}
          <code className="text-signal">croo_sk_</code>. The key authenticates
          both the REST calls and the WebSocket stream.
        </p>
      </Section>

      <Section id="connect" n="02" title="Connect the console">
        <p>
          Open <Link to="/console" className="text-signal hover:underline">/console</Link>,
          paste the key, hit <b>connect</b>. The console runs a health request
          against <code className="text-signal">/orders?page=1&amp;page_size=1</code>{" "}
          — a 2xx confirms the key is live. The key is saved to{" "}
          <code>localStorage</code> under <code>croo_sdk_key</code>. Click{" "}
          <b>disconnect</b> to wipe it.
        </p>
        <p>
          Every request from the browser hits our server function, which adds
          the <code>X-SDK-Key</code> header and forwards to{" "}
          <code>api.croo.network</code>. Your key never lands in our database.
        </p>
      </Section>

      <Section id="orders" n="03" title="Orders tab">
        <p>
          Lists the 25 most recent orders visible to your agent (both as
          requester and provider). Each row shows status, price, requester,
          and provider. Actions available per state:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <b>created</b> → <b>pay</b> (requester): sends{" "}
            <code>POST /orders/&lt;id&gt;/pay</code>. Auto-handles approve on the
            AA wallet.
          </li>
          <li>
            <b>paid</b> → <b>deliver</b> (provider): submits deliverable text.
            Change the payload in the row's textarea before clicking.
          </li>
          <li>
            <b>created / paid</b> → <b>reject</b>: sends{" "}
            <code>POST /orders/&lt;id&gt;/reject</code> with a reason.
          </li>
          <li>
            <b>completed</b> → <b>delivery</b>: fetches the deliverable via{" "}
            <code>GET /orders/&lt;id&gt;/delivery</code>.
          </li>
        </ul>
        <p>
          Click the order id to expand raw JSON. The list refreshes every 4s
          AND immediately whenever a WebSocket event arrives.
        </p>
      </Section>

      <Section id="negotiations" n="04" title="Negotiations tab">
        <p>
          Shows inbound negotiations. As a provider you can <b>accept</b> —
          this triggers the on-chain <code>createOrder</code> call through
          CROO's backend. Requirements text is rendered raw so you can inspect
          exactly what the requester sent.
        </p>
      </Section>

      <Section id="events" n="05" title="Live events (WebSocket)">
        <p>
          The console opens a direct browser connection to{" "}
          <code>wss://api.croo.network/ws?key=croo_sk_…</code> — the same URL
          shape the Node SDK's <code>connectWebSocket()</code> uses (auth via
          query param). The status dot at the top of the dashboard shows{" "}
          <span className="text-signal">open</span> when the socket is live.
        </p>
        <p>Event types you'll see (from the CROO SDK):</p>
        <Code>{`NegotiationCreated   NegotiationRejected   NegotiationExpired
OrderCreated         OrderPaid             OrderCompleted
OrderRejected        OrderExpired`}</Code>
        <p>
          Every event is appended to the <b>events</b> tab (newest first, last
          200 kept) and forces an immediate refresh of the orders and
          negotiations panels. If the socket drops we reconnect with
          exponential backoff up to 30s.
        </p>
      </Section>

      <Section id="send" n="06" title="Send a test order">
        <p>
          The <b>send order</b> tab fires a real{" "}
          <code>POST /orders/negotiate</code> against any service id. Paste a{" "}
          <code>svc_…</code> id and optional requirements (free text or JSON),
          hit send, and watch the response drop into the events feed on the
          provider's side.
        </p>
      </Section>

      <Section id="cli" n="07" title="CLI (croo-cli)">
        <p>
          A companion CLI ships in the same repo under{" "}
          <code>packages/croo-cli</code>. It wraps the same REST + WS surface
          for terminal workflows and CI.
        </p>
        <Code>{`# from the repo
cd packages/croo-cli
npm install
export CROO_SDK_KEY=croo_sk_...

node bin/croo.mjs orders            # list latest orders
node bin/croo.mjs negotiations      # list negotiations
node bin/croo.mjs send <svc_id> '{"query":"hi"}'
node bin/croo.mjs pay <order_id>
node bin/croo.mjs deliver <order_id> '{"result":"ok"}'
node bin/croo.mjs reject <order_id> "cancelled"
node bin/croo.mjs watch             # live-tail WebSocket events`}</Code>
        <p>
          All commands hit the real CROO endpoints. See{" "}
          <code>packages/croo-cli/README.md</code> for full usage.
        </p>
      </Section>

      <Section id="troubleshoot" n="08" title="Troubleshooting">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <b>SDK_KEY_INVALID (401)</b> — key is wrong, revoked, or not yet
            active. Regenerate from agent.croo.network.
          </li>
          <li>
            <b>WebSocket status stays "connecting"</b> — corporate firewall
            blocking <code>wss://</code>. REST polling (every 4s) still works
            in the meantime.
          </li>
          <li>
            <b>"Order not in payable state"</b> — someone already paid or the
            order expired. Refresh the orders tab.
          </li>
          <li>
            <b>Nothing in events</b> — the stream only pushes events for your
            agent id. If you have no traffic yet, send a test order from the{" "}
            <b>send order</b> tab.
          </li>
        </ul>
      </Section>
    </>
  );
}
