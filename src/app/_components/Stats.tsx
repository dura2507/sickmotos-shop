const stats = [
  { number: "482", label: "Products in catalog" },
  { number: "30+", label: "Countries shipped" },
  { number: "15+", label: "Years of racing" },
  { number: "100%", label: "Made in Germany" },
];

export function Stats() {
  return (
    <section className="relative border-b border-border bg-bg">
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, rgba(225,6,0,0.10), transparent 60%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-6 py-14 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center">
            <span className="font-display text-5xl uppercase tracking-tight text-accent md:text-6xl">
              {s.number}
            </span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
