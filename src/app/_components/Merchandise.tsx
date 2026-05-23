import Image from "next/image";
import Link from "next/link";
import { allProducts, categorize, fmtEUR, getPrice, cleanTitle } from "@/lib/products";

export function Merchandise() {
  const items = allProducts
    .filter((p) => categorize(p) === "Merchandise")
    .slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="border-b border-border bg-surface/30 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
              Merchandise
            </h2>
            <p className="mt-2 max-w-md text-sm text-fg-muted">
              Ride it. Wear it. Repeat.
            </p>
          </div>
          <Link
            href="/shop?category=Merchandise"
            className="text-sm font-semibold text-fg-muted underline-offset-4 hover:text-accent hover:underline"
          >
            Shop merch
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {items.map((p) => {
            const { price, compareAt } = getPrice(p);
            return (
              <Link
                key={p.handle}
                href={`/products/${p.handle}`}
                className="reveal group flex flex-col overflow-hidden rounded-lg border border-border bg-bg transition-all duration-300 hover:-translate-y-1 hover:border-accent"
              >
                <div className="relative aspect-square overflow-hidden border-b border-border bg-gradient-to-br from-surface-2 to-bg">
                  {p.images[0] && (
                    <Image
                      src={p.images[0].src}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 text-sm font-medium leading-snug text-fg">
                    {cleanTitle(p.title)}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-semibold text-fg">
                      {fmtEUR(price)}
                    </span>
                    {compareAt && compareAt > price && (
                      <span className="text-xs text-fg-dim line-through">
                        {fmtEUR(compareAt)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
