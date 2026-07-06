export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-6 w-6 place-items-center border border-border bg-signal text-[10px] font-bold text-signal-foreground">
            V
          </div>
          <span className="text-xs uppercase tracking-widest text-foreground">
            Verithread
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            · built for the Croo Hackathon 2026
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-[10px] uppercase tracking-widest text-muted-foreground">
          <a href="#" className="hover:text-foreground">github</a>
          <a href="#" className="hover:text-foreground">docs</a>
          <a href="#" className="hover:text-foreground">x / twitter</a>
          <a href="https://croo.network" target="_blank" rel="noreferrer" className="hover:text-foreground">
            croo.network ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
