import Image from "next/image";
import Link from "next/link";
import { fmtEUR, getLatestArrivals } from "@/lib/products";
import { SectionHeader } from "./SectionHeader";

export function LatestArrivals() {
  const products = getLatestArrivals(4);
  const backdrop = products[0]?.image;

  return (
    <section className="border-b border-border bg-surface/30 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          index="02"
          kicker="New in"
          title="Latest arrivals"
          subtitle="Just listed in Thomas's workshop."
          viewAllHref="/shop"
          backdropImage={backdrop}
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.handle}
              href={`/products/${p.handle}`}
              className="reveal group flex flex-col overflow-hidden rounded-lg border border-border bg-bg transition-all duration-300 hover:-translate-y-1 hover:border-accent"
            >
              <div className="relative aspect-square overflow-hidden border-b border-border bg-gradient-to-br from-surface-2 to-bg">
                {p.image && (
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                {p.compareAt && p.compareAt > p.price && (
                  <span className="absolute left-0 top-0 z-10 rounded-br-lg bg-accent px-2.5 py-1 text-xs font-bold text-fg">
                    {Math.round((1 - p.price / p.compareAt) * 100)}%
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-2 text-sm font-medium leading-snug text-fg">
                  {p.title}
                </h3>
                <div className="mt-auto flex items-baseline gap-2">
                  <span className="text-base font-semibold text-fg">
                    {fmtEUR(p.price)}
                  </span>
                  {p.compareAt && p.compareAt > p.price && (
                    <span className="text-xs text-fg-dim line-through">
                      {fmtEUR(p.compareAt)}
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
