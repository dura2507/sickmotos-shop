// Ein langer Zeitraum holt beim ersten Aufruf viele Monate Bestellungen aus
// Shopify, das dauert ein paar Sekunden.
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">Analytics</h1>
      <p className="mt-4 text-sm text-fg-muted">
        Zahlen werden geladen. Lange Zeiträume dauern beim ersten Mal bis zu einer halben Minute.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-surface/40" />
        ))}
      </div>
    </div>
  );
}
