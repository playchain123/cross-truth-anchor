const sample = `{
  "attestation": "0x9f2c…a41b",
  "issuer": "verithread.eth",
  "subject": {
    "cap_did": "did:cap:base:0x71C…82Ef/42",
    "tba":     "0x8AaC…19dB"
  },
  "linked": {
    "ens":         "orion.eth",
    "evm_primary": "0x71C7…82Ef",
    "solana":      null
  },
  "signals": {
    "controller_signature": "valid",
    "ens_ownership":        "valid",
    "wallet_age_days":      412,
    "sybil_cluster":        "none"
  },
  "confidence": 0.94,
  "issued_at":  "2026-07-06T10:11:42Z",
  "expires_at": "2027-07-06T10:11:42Z"
}`;

export function AttestationSample() {
  return (
    <section id="attestation" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-signal">
              live output
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              A single JSON receipt, on-chain and portable.
            </h2>
            <p className="mt-6 max-w-md font-sans text-sm leading-relaxed text-muted-foreground">
              Every resolved agent gets an attestation stored on its
              Token-Bound Account. Other CAP agents read it directly from the
              chain before signing an order — no API keys, no allowlists.
            </p>
            <ul className="mt-8 space-y-3 font-sans text-sm text-muted-foreground">
              {[
                "USDC-settled through CAP Orders",
                "A2A composable — any agent can consume it",
                "Attestations earn CROO Merits for the issuer",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none bg-signal" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-signal/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-signal" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                attestation.json
              </span>
            </div>
            <pre className="overflow-x-auto p-5 text-[12px] leading-relaxed text-foreground">
              <code>{sample}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
