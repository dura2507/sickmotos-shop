import Link from "next/link";
import { BIKE_BRANDS, countByBrand } from "@/lib/products";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

// "Shop by Model", pick your bike, land in the right parts. Brand-coloured
// dark tiles (no repeated photo, no wrong-bike-under-brand, no third-party
// logos): each brand gets its own accent glow over a subtle tech grid.
const BRAND_COLOR: Record<string, string> = {
  KTM: "#ff6a00",
  Husqvarna: "#2f6fed",
  GasGas: "#ff1e2d",
  Beta: "#e11d48",
  Yamaha: "#1e54d6",
  Fantic: "#f43f5e",
  Sherco: "#0ea5e9",
  Aprilia: "#dc2626",
  Kreidler: "#f59e0b",
  Rieju: "#10b981",
  Derbi: "#8b5cf6",
  SWM: "#ef4444",
};

export async function ShopByModel() {
  const dict = await getDictionary(await getLocale());
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
            {dict.shopByModel.kicker}
          </p>
          <h2 className="font-display text-4xl uppercase leading-none tracking-tight md:text-5xl">
            {dict.shopByModel.title}
          </h2>
          <p className="mt-3 text-sm text-fg-muted md:text-base">
            {dict.shopByModel.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((b) => {
            const c = BRAND_COLOR[b.name] ?? "#E10600";
            return (
              <Link
                key={b.name}
                href={`/shop?brand=${encodeURIComponent(b.name)}`}
                className="reveal-soft group relative flex h-36 flex-col justify-end overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-fg/30 md:h-40"
              >
                {/* per-brand colour glow, top-right */}
                <div
                  aria-hidden
                  className="absolute -right-10 -top-10 size-32 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                  style={{ background: c }}
                />
                {/* subtle tech grid */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                    backgroundSize: "26px 26px",
                    maskImage:
                      "radial-gradient(ellipse at 70% 30%, black 10%, transparent 75%)",
                    WebkitMaskImage:
                      "radial-gradient(ellipse at 70% 30%, black 10%, transparent 75%)",
                  }}
                />
                {/* dark base for legibility */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
                />
                <div className="relative p-4">
                  <span
                    className="mb-2 block h-0.5 w-7 rounded-full"
                    style={{ background: c }}
                  />
                  <span className="font-display text-2xl uppercase leading-none tracking-tight text-white">
                    {b.name}
                  </span>
                  <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                    {b.count} {dict.shopByModel.partsSuffix}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
