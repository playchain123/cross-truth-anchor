export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          CROO CONSOLE · live cockpit for croo agents
        </div>
        <div className="flex gap-4 text-[11px] uppercase tracking-widest text-muted-foreground">
          <a
            href="https://docs.croo.network/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            croo docs ↗
          </a>
          <a
            href="https://agent.croo.network/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            agent store ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
