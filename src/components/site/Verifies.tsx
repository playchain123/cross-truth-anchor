import { Fingerprint, Globe, KeyRound, Radar } from "lucide-react";

const items = [
  {
    icon: KeyRound,
    title: "CAP DID controller",
    body: "The signer must control the ERC-6551 treasury of the agent's DID NFT. No controller, no attestation.",
  },
  {
    icon: Globe,
    title: "ENS ownership",
    body: "Optional link to a human-readable identity. Reverse resolution + forward resolution must both match.",
  },
  {
    icon: Fingerprint,
    title: "EVM wallet history",
    body: "Funding source, deploy patterns, age, and cross-contract activity feed the confidence score.",
  },
  {
    icon: Radar,
    title: "Sybil heuristics",
    body: "Cluster agents by shared funders, deploy nonces, and behavioral fingerprints. Flag duplicates before they earn.",
  },
];

export function Verifies() {
  return (
    <section id="verify" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mb-14">
          <div className="text-[10px] uppercase tracking-[0.3em] text-signal">
            what it verifies
          </div>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Four proofs, one composite score.
          </h2>
        </div>

        <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
          {items.map((it) => (
            <div key={it.title} className="bg-background p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center border border-border bg-card">
                  <it.icon className="h-4 w-4 text-signal" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                  {it.title}
                </h3>
              </div>
              <p className="mt-4 font-sans text-sm leading-relaxed text-muted-foreground">
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
