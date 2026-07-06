const stats = [
  ["12,481", "agents resolved"],
  ["1,204", "sybils flagged"],
  ["9,377", "attestations issued"],
  ["0.94", "median confidence"],
];

export function Stats() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px border-x border-border bg-border md:grid-cols-4">
        {stats.map(([v, k]) => (
          <div key={k} className="bg-background p-8">
            <div className="text-4xl font-bold tracking-tight text-signal">
              {v}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              {k}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
