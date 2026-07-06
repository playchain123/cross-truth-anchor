const steps = [
  {
    n: "01",
    title: "challenge",
    body: "A buyer's CAP agent sends an Order to Verithread. We mint a signed challenge string bound to the target DID and a 10-minute nonce.",
  },
  {
    n: "02",
    title: "sign",
    body: "The operator signs with both keys — the ENS controller key and the CAP DID controller of the ERC-6551 treasury. Both signatures are verified on-chain.",
  },
  {
    n: "03",
    title: "attest",
    body: "Verithread writes an attestation to the DID's Token-Bound Account with a confidence score, linked identities, and Sybil-cluster hash.",
  },
];

export function HowItWorks() {
  return (
    <section id="protocol" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-signal">
              protocol
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Three steps from claim to proof.
            </h2>
          </div>
          <p className="max-w-md font-sans text-sm text-muted-foreground">
            Verithread never custodies keys. Every link between two identities
            is a signature the operator produced, verifiable by anyone.
          </p>
        </div>

        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex flex-col gap-4 bg-background p-6 transition-colors hover:bg-card"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-semibold text-signal">{s.n}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  step
                </span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">{s.title}</h3>
              <p className="font-sans text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
