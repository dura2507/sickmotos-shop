const brands = [
  { name: "Beta", count: "180+ parts" },
  { name: "Husqvarna", count: "210+ parts" },
  { name: "KTM", count: "190+ parts" },
  { name: "Aprilia", count: "65+ parts" },
  { name: "Fantic", count: "40+ parts" },
  { name: "Yamaha", count: "55+ parts" },
];

export function BikeBrandStrip() {
  return (
    <section className="border-b border-border bg-bg py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-tight md:text-3xl">
              Find parts for your bike
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Pick your brand. See only what fits.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {brands.map((b) => (
            <a
              key={b.name}
              href="#"
              className="group flex flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface px-3 py-5 text-center transition-all hover:border-accent hover:bg-surface-2"
            >
              <span className="font-display text-xl uppercase tracking-tight text-fg transition-colors group-hover:text-accent">
                {b.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-fg-dim">
                {b.count}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
