import Image from "next/image";
import Link from "next/link";
import { BIKE_BRANDS, countByBrand } from "@/lib/products";

// "Shop by Model" — big bike tiles Thomas asked for (Telegram 2026-06-03):
// pick your bike, land fast in the right parts. Sits right under the
// categories. Uses a faint shared supermoto image so brand tiles stay
// cohesive (no wrong-bike-under-brand mismatch).
export function ShopByModel() {
  const counts = countByBrand();
  const brands = (BIKE_BRANDS as readonly string[])
    .map((name) => ({ name, count: counts[name] ?? 0 }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-accent">
            Shop by model
          </p>
          <h2 className="font-display text-4xl uppercase leading-none tracking-tight md:text-5xl">
            Pick your bike
          </h2>
          <p className="mt-3 text-sm text-fg-muted md:text-base">
            Choose your bike, see only parts that fit.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((b) => (
            <Link
              key={b.name}
              href={`/shop?brand=${encodeURIComponent(b.name)}`}
              className="reveal-soft group relative flex h-36 flex-col justify-end overflow-hidden rounded-xl border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent md:h-40"
            >
              <Image
                src="/builds/lifestyle-beta-cyan-low.jpg"
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-35 transition-all duration-500 group-hover:scale-105 group-hover:opacity-50"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30"
              />
              <div className="relative p-4">
                <span className="mb-2 block h-0.5 w-7 rounded-full bg-accent" />
                <span className="font-display text-2xl uppercase leading-none tracking-tight text-white">
                  {b.name}
                </span>
                <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                  {b.count} parts
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
