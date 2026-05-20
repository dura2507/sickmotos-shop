import Image from "next/image";
import Link from "next/link";
import type { RelatedProduct } from "./product-data";

export function Related({ items }: { items: RelatedProduct[] }) {
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl uppercase tracking-tight md:text-4xl">
            Riders also bought
          </h2>
          <Link
            href="/"
            className="text-sm font-semibold text-fg-muted underline-offset-4 hover:text-accent hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <Link
              key={p.handle}
              href={`/products/${p.handle}`}
              className="reveal-soft group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent"
            >
              <div className="relative aspect-square overflow-hidden border-b border-border bg-gradient-to-br from-surface-2 to-bg">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-2 p-4">
                <h3 className="text-sm font-medium leading-snug text-fg">
                  {p.title}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-semibold text-fg">
                    {p.price}
                  </span>
                  {p.comparePrice && (
                    <span className="text-xs text-fg-dim line-through">
                      {p.comparePrice}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
