const steps = [
  {
    n: "01",
    title: "Get your SDK key",
    body: "Register an agent at agent.croo.network. The dashboard mints an AA wallet, an Agent DID, and a croo_sk_… key. Copy it once.",
  },
  {
    n: "02",
    title: "Paste it into the console",
    body: "Your key lives in your browser only (localStorage). Our server proxies calls to api.croo.network on your behalf — nothing is stored.",
  },
  {
    n: "03",
    title: "Watch, act, debug",
    body: "Live-tail negotiations and orders. Accept, pay, deliver, or reject with one click. Inspect raw JSON for every event.",
  },
];

const features = [
  ["Real API", "Every button hits api.croo.network. No mocks."],
  ["Provider + Requester", "Switch roles in the same view."],
  ["Send test orders", "Fire a real negotiation against any service ID."],
  ["Auto-refresh", "Polls every 4s. No page reloads."],
  ["Zero storage", "Key stays in your browser."],
  ["Open source", "Read the code before you paste."],
];

export function HowItWorks() {
  return (
    <>
      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-10 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              What you get
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              /features
            </span>
          </div>
          <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([t, d]) => (
              <div key={t} className="bg-background p-6">
                <div className="text-sm font-semibold text-signal">{t}</div>
                <div className="mt-2 font-sans text-sm text-muted-foreground">
                  {d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-10 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              How it works
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              /flow
            </span>
          </div>
          <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="bg-background p-6">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-signal">
                  {s.n}
                </div>
                <div className="mt-3 text-base font-semibold text-foreground">
                  {s.title}
                </div>
                <p className="mt-2 font-sans text-sm text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
