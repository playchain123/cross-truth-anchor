export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg opacity-70" />
      <div className="absolute inset-0 scanline opacity-40" />
      <div className="pointer-events-none absolute -left-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-signal/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-0 h-[420px] w-[420px] rounded-full bg-signal/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 border border-border bg-card/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
          Croo Hackathon 2026 · CAP compatible
        </div>

        <h1 className="max-w-5xl text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Proof of{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-signal">operator</span>
            <span className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-signal/20" />
          </span>{" "}
          for every agent on CAP.
        </h1>

        <p className="mt-8 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground sm:text-lg">
          Verithread is the cross-chain identity resolver for the CROO agent
          economy. It links a CAP DID to the human or org behind it — across
          ENS, EVM history, and other agent protocols — so buyers know who
          they're really hiring.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href="#attestation"
            className="inline-flex items-center gap-2 border border-border bg-signal px-5 py-3 text-xs font-semibold uppercase tracking-widest text-signal-foreground transition-opacity hover:opacity-90"
          >
            → resolve an agent
          </a>
          <a
            href="#protocol"
            className="inline-flex items-center gap-2 border border-border bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-secondary"
          >
            read the spec
          </a>
        </div>

        <div className="mt-16 grid max-w-3xl grid-cols-3 gap-px border border-border bg-border">
          {[
            ["signature", "onchain"],
            ["ens + did", "linked"],
            ["sybil", "flagged"],
          ].map(([k, v]) => (
            <div key={k} className="bg-background px-4 py-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {k}
              </div>
              <div className="mt-1 text-sm font-semibold text-signal">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
