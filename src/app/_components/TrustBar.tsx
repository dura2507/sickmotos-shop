const items = [
  { title: "Worldwide shipping", sub: "Most orders delivered in 5 to 10 business days" },
  { title: "6-month warranty", sub: "On materials and workmanship" },
  { title: "WhatsApp support", sub: "Direct line for technical questions" },
];

export function TrustBar() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px overflow-hidden bg-border md:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="flex flex-col gap-1 bg-bg px-6 py-5"
          >
            <span className="text-sm font-semibold text-fg">{it.title}</span>
            <span className="text-xs text-fg-muted">{it.sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
