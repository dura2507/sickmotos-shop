const categories = [
  { name: "LED Headlights", href: "#" },
  { name: "Exhaust", href: "#" },
  { name: "Carbon Parts", href: "#" },
  { name: "ECU Tuning", href: "#" },
  { name: "Merchandise", href: "#" },
  { name: "Titanium Screws", href: "#" },
];

export function Categories() {
  return (
    <section className="border-b border-border py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
            Shop by category
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <a
              key={c.name}
              href={c.href}
              className="reveal-soft group relative flex items-center justify-between overflow-hidden rounded-lg border border-border bg-surface px-5 py-6 transition-colors hover:border-accent"
            >
              <span className="font-display text-2xl uppercase tracking-tight text-fg">
                {c.name}
              </span>
              <svg
                viewBox="0 0 24 24"
                className="size-5 shrink-0 text-fg-muted transition-all group-hover:text-accent group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
