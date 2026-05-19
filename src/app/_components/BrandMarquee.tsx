const brands = [
  "Beta",
  "Husqvarna",
  "KTM",
  "Aprilia",
  "Fantic",
  "Yamaha",
  "GasGas",
  "Sherco",
  "Kreidler",
  "Rieju",
  "Derbi",
  "Malaguti",
];

export function BrandMarquee() {
  const loop = [...brands, ...brands];
  return (
    <section className="overflow-hidden border-b border-border bg-bg py-6">
      <div className="mx-auto mb-4 max-w-7xl px-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-fg-dim">
          Parts for
        </span>
      </div>
      <div className="marquee gap-12 whitespace-nowrap">
        {loop.map((b, i) => (
          <span
            key={`${b}-${i}`}
            className="font-display text-3xl uppercase tracking-tight text-fg-muted transition-colors hover:text-accent md:text-4xl"
          >
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}
