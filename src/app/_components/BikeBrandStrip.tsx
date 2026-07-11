import Link from "next/link";
import { BIKE_BRANDS, countByBrand } from "@/lib/products";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function BikeBrandStrip() {
  const dict = await getDictionary(await getLocale());
  const counts = countByBrand();
  const brands = (BIKE_BRANDS as readonly string[])
    .map((name) => ({ name, count: counts[name] ?? 0 }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <section className="border-b border-border bg-bg py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-tight md:text-3xl">
              {dict.bikeBrandStrip.title}
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              {dict.bikeBrandStrip.subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {brands.map((b) => (
            <Link
              key={b.name}
              href={`/shop?brand=${encodeURIComponent(b.name)}`}
              className="reveal-soft group flex flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface px-3 py-5 text-center transition-all hover:border-accent hover:bg-surface-2"
            >
              <span className="font-display text-xl uppercase tracking-tight text-fg transition-colors group-hover:text-accent">
                {b.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-fg-dim">
                {b.count} {dict.bikeBrandStrip.partsSuffix}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
