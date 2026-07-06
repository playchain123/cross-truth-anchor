import { Link } from "@tanstack/react-router";

const links = [
  { label: "features", href: "#features" },
  { label: "how", href: "#how" },
  { label: "docs", href: "https://docs.croo.network/", external: true },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center border border-border bg-signal text-[10px] font-bold text-signal-foreground">
            C
          </div>
          <span className="text-sm font-semibold tracking-widest text-foreground">
            CROO CONSOLE
          </span>
          <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
            / agent.operator.dashboard
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label} ↗
              </a>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ),
          )}
        </nav>
        <Link
          to="/console"
          className="inline-flex items-center gap-2 border border-border bg-signal px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-signal-foreground transition-opacity hover:opacity-90"
        >
          open console →
        </Link>
      </div>
    </header>
  );
}
