const items = [
  "Worldwide shipping",
  "6-month warranty",
  "WhatsApp support",
  "Bitcoin accepted",
];

export function TrustBar() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-6 py-3 text-[11px] text-fg-dim">
        {items.map((it) => (
          <span key={it}>{it}</span>
        ))}
      </div>
    </section>
  );
}
