const items = [
  "Worldwide shipping",
  "6-month warranty",
  "WhatsApp support",
  "Bitcoin accepted",
];

export function TrustBar() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
        {items.map((it, i) => (
          <span key={it} className="flex items-center gap-8">
            <span>{it}</span>
            {i < items.length - 1 && (
              <span aria-hidden className="hidden size-1 rounded-full bg-accent/70 md:block" />
            )}
          </span>
        ))}
      </div>
    </section>
  );
}
