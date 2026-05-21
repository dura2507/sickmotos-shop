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
      <div className="marquee marquee-continuous gap-12 whitespace-nowrap pointer-events-none">
        {loop.map((b, i) => (
          <span
            key={`${b}-${i}`}
            className="font-display text-3xl uppercase tracking-tight text-fg-muted md:text-4xl"
          >
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}
