const items = [
  { value: "★ 4.9", label: "Verified reviews" },
  { value: "5-10 days", label: "Worldwide shipping" },
  { value: "6 months", label: "Warranty included" },
  { value: "Bitcoin", label: "& 6 payment methods" },
];

export function TrustBar() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-6 px-6 py-6 md:grid-cols-4 md:gap-x-10">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex flex-col gap-0.5 border-l-2 border-accent/80 pl-4"
          >
            <span className="font-display text-xl uppercase tracking-tight text-fg md:text-2xl">
              {it.value}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-fg-dim">
              {it.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
