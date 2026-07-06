import { ConnectWallet } from "../wallet/ConnectWallet";

const links = [
  { label: "protocol", href: "#protocol" },
  { label: "verify", href: "#verify" },
  { label: "attestation", href: "#attestation" },
  { label: "docs", href: "#docs" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center border border-border bg-signal text-[10px] font-bold text-signal-foreground">
            V
          </div>
          <span className="text-sm font-semibold tracking-widest text-foreground">
            VERITHREAD
          </span>
          <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
            / cap.identity.resolver
          </span>
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <ConnectWallet />
      </div>
    </header>
  );
}
