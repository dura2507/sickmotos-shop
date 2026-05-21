// Renders the same shell ShopBrowser draws so users never see a blank
// stretch while the client bundle hydrates. Pure markup, no client JS.

export function ShopSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4">
        <div className="h-10 w-64 animate-pulse rounded bg-surface md:h-12 md:w-80" />
        <div className="h-4 w-72 animate-pulse rounded bg-surface" />
      </div>

      <div className="mb-10 h-24 animate-pulse rounded-2xl border border-border bg-surface/40" />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="h-11 flex-1 min-w-[220px] animate-pulse rounded-full bg-surface" />
        <div className="h-11 min-w-[220px] animate-pulse rounded-full bg-surface" />
      </div>

      <div className="grid gap-10 md:grid-cols-[220px_1fr] md:gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden flex-col gap-4 md:flex">
          <div className="h-4 w-20 animate-pulse rounded bg-surface" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-full animate-pulse rounded bg-surface/60" />
          ))}
        </aside>

        <div>
          <div className="mb-4 h-3 w-40 animate-pulse rounded bg-surface" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
              >
                <div className="aspect-square animate-pulse bg-surface-2" />
                <div className="flex flex-col gap-2 p-3">
                  <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
                  <div className="mt-2 h-5 w-1/3 animate-pulse rounded bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
