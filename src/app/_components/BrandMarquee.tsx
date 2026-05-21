type Brand = { name: string; color: string };

const brands: Brand[] = [
  { name: "Beta", color: "#d8232a" },
  { name: "Husqvarna", color: "#fdd900" },
  { name: "KTM", color: "#ff6600" },
  { name: "Aprilia", color: "#e2231a" },
  { name: "Fantic", color: "#e2231a" },
  { name: "Yamaha", color: "#1e4ba0" },
  { name: "GasGas", color: "#e2231a" },
  { name: "Sherco", color: "#1f7ad6" },
  { name: "Kreidler", color: "#c8c8c8" },
  { name: "Rieju", color: "#e2231a" },
  { name: "Derbi", color: "#fafafa" },
  { name: "Malaguti", color: "#e2231a" },
];

export function BrandMarquee() {
  const loop = [...brands, ...brands];
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg py-10">
      <div className="mx-auto mb-6 max-w-7xl px-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-fg-dim">
          Parts for
        </span>
      </div>
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent"
        />
        <div className="marquee marquee-continuous pointer-events-none items-center gap-14 whitespace-nowrap py-2">
          {loop.map((b, i) => (
            <span
              key={`${b.name}-${i}`}
              className="font-display text-3xl uppercase leading-[1.15] tracking-tight md:text-4xl"
              style={{ color: b.color }}
            >
              {b.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
