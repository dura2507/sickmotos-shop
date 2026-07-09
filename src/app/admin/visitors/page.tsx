export const dynamic = "force-dynamic";

export default function AdminVisitors() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">
          Besucher
        </h1>
        <p className="text-xs text-fg-muted">
          Vercel Analytics + selbst-gehostetes Tracking
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center">
        <p className="font-display text-2xl uppercase tracking-tight text-fg">
          Wird aufgebaut
        </p>
        <p className="mt-2 text-sm text-fg-muted">
          Live-Zähler, Top-Seiten, Top-Länder und Trafficquellen kommen in
          Kürze. Vercel Analytics ist bereits aktiv und sammelt Daten unter{" "}
          <a
            href="https://vercel.com/dura2507s-projects/sickmotos-shop/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hi"
          >
            vercel.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
