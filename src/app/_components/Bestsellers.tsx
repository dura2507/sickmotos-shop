import Image from "next/image";
import Link from "next/link";
import { fmtEUR, getTopSelling } from "@/lib/products";
import { SectionHeader } from "./SectionHeader";
import { BrandPillTabs } from "./BrandPillTabs";

export function Bestsellers() {
  const products = getTopSelling(3);
  const backdrop = products[0]?.image;

  return (
    <section id="bestseller" className="border-b border-border py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          index="01"
          kicker="Best deals"
          title="Top selling"
          subtitle="Live from the catalog: the deepest discounts riders are grabbing right now."
          viewAllHref="/shop"
          backdropImage={backdrop}
        />
        <BrandPillTabs />
        <div className="grid gap-5 md:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.handle}
              href={`/products/${p.handle}`}
              className="reveal group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-[0_8px_30px_rgba(225,6,0,0.12)]"
            >
              <div className="relative aspect-square overflow-hidden border-b border-border bg-gradient-to-br from-surface-2 to-bg">
                {p.image && (
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                {p.compareAt && p.compareAt > p.price && (
                  <span className="absolute left-0 top-0 z-10 rounded-br-lg bg-accent px-2.5 py-1 text-xs font-bold text-fg">
                    {Math.round((1 - p.price / p.compareAt) * 100)}%
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="line-clamp-2 text-sm font-medium leading-snug text-fg">
                  {p.title}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl text-fg">
                    {fmtEUR(p.price)}
                  </span>
                  {p.compareAt && p.compareAt > p.price && (
                    <span className="text-sm text-fg-dim line-through">
                      {fmtEUR(p.compareAt)}
                    </span>
                  )}
                </div>
                {p.fits.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-fg-dim">
                      Fits
                    </span>
                    {p.fits.slice(0, 3).map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-fg-muted"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
