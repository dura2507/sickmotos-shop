const items = [
  {
    title: "Worldwide shipping",
    sub: "5 to 10 business days",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "6-month warranty",
    sub: "Materials and workmanship",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "WhatsApp support",
    sub: "Direct line for tech questions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M21 12a9 9 0 11-3.4-7l3.4-.6-.6 3.4A9 9 0 0121 12z" strokeLinejoin="round" />
        <path d="M9 10c.4 1.5 1.5 2.6 3 3l.5-.6c.2-.2.5-.3.8-.2l2 .7c.3.1.4.4.3.7-.4 1.2-1.7 2-2.9 1.6a7 7 0 01-4.8-4.8c-.4-1.2.4-2.5 1.6-2.9.3-.1.6 0 .7.3l.7 2c.1.3 0 .6-.2.8L9 10z" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function TrustBar() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 md:py-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="flex items-center gap-3 text-sm"
          >
            <span className="grid size-9 shrink-0 place-items-center text-accent">
              {it.icon}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-semibold text-fg">{it.title}</span>
              <span className="text-xs text-fg-muted">{it.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
