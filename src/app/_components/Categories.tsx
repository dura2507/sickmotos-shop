import Link from "next/link";
import { countByCategory, CATEGORIES } from "@/lib/products";

export function Categories() {
  const counts = countByCategory();
  const cats = (CATEGORIES as readonly string[])
    .map((name) => ({ name, count: counts[name as keyof typeof counts] ?? 0 }))
    .filter((c) => c.count > 0);

  return (
    <section className="border-b border-border py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
            Shop by category
          </h2>
          <Link
            href="/shop"
            className="text-sm font-semibold text-fg-muted underline-offset-4 hover:text-accent hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <Link
              key={c.name}
              href={`/shop?category=${encodeURIComponent(c.name)}`}
              className="reveal-soft group relative flex items-center justify-between overflow-hidden rounded-lg border border-border bg-surface px-5 py-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:bg-surface-2"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-fg-dim">
                  {c.count} products
                </span>
                <span className="font-display text-2xl uppercase tracking-tight text-fg">
                  {c.name}
                </span>
              </div>
              <svg
                viewBox="0 0 24 24"
                className="size-5 shrink-0 text-fg-muted transition-all group-hover:text-accent group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
