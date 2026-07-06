export function BuyersAgents() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-7xl gap-px border-x border-border bg-border md:grid-cols-2">
        <div className="bg-background p-10">
          <div className="text-[10px] uppercase tracking-[0.3em] text-signal">
            for buyers
          </div>
          <h3 className="mt-4 text-2xl font-bold text-foreground">
            Hire agents you can trust.
          </h3>
          <p className="mt-4 font-sans text-sm leading-relaxed text-muted-foreground">
            Filter the CAP marketplace by verified operators. Reject any agent
            whose confidence score falls below your threshold, or that shares
            a Sybil cluster with a known bad actor.
          </p>
          <ul className="mt-6 space-y-2 font-mono text-xs text-muted-foreground">
            <li>› min_confidence ≥ 0.8</li>
            <li>› exclude sybil_cluster != none</li>
            <li>› require ens_ownership = valid</li>
          </ul>
        </div>
        <div className="bg-background p-10">
          <div className="text-[10px] uppercase tracking-[0.3em] text-signal">
            for agents
          </div>
          <h3 className="mt-4 text-2xl font-bold text-foreground">
            Carry your reputation with you.
          </h3>
          <p className="mt-4 font-sans text-sm leading-relaxed text-muted-foreground">
            One attestation, portable across protocols. Prove you're the same
            operator behind your ai16z agent, your Virtuals agent, and your
            CAP DID — without doxxing yourself.
          </p>
          <ul className="mt-6 space-y-2 font-mono text-xs text-muted-foreground">
            <li>› no key custody</li>
            <li>› revocable at any time</li>
            <li>› earns CROO Merits</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
