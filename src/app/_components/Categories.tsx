import Image from "next/image";
import Link from "next/link";
import { countByCategory, CATEGORIES } from "@/lib/products";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

// Premium category cards in Thomas's design (Telegram 2026-06-01):
// big image, per-category colour wash, red accent bar, title + description,
// round icon badge top-right. NOTE: no LED legality / E-marking copy (his rule).
type CatMeta = { image: string; color: string; desc: string };

const META: Record<string, CatMeta> = {
  Exhaust: {
    image: "https://cdn.shopify.com/s/files/1/0534/7380/4477/files/IMG-2429.jpg?v=1765303282",
    color: "#c2410c",
    desc: "2- and 4-stroke titanium headers and pipes",
  },
  "LED Headlights": {
    image: "/builds/macro-hexagon-led-red.jpg",
    color: "#b91c1c",
    desc: "RGBW and hexagon angel eyes, app-controlled",
  },
  Brakes: {
    image: "https://cdn.shopify.com/s/files/1/0534/7380/4477/files/IMG-3211.jpg?v=1770275582",
    color: "#1d4ed8",
    desc: "Performance braking for maximum control",
  },
  "ECU Tuning": {
    image: "/builds/macro-beta-blue-headlight.jpg",
    color: "#6d28d9",
    desc: "FuelX and ECU, crisper throttle, longer engine life",
  },
  "Carbon Parts": {
    image: "https://cdn.shopify.com/s/files/1/0534/7380/4477/files/IMG-2005.jpg?v=1762291117",
    color: "#3f3f46",
    desc: "Featherweight carbon, built in-house",
  },
  Graphics: {
    image: "/builds/build-fantic-bold-red.jpg",
    color: "#be185d",
    desc: "Custom graphics kits that stand out",
  },
  "Titanium Screws": {
    image: "/builds/macro-krummer-rainbow.jpg",
    color: "#0f766e",
    desc: "Race-grade titanium hardware",
  },
  Merchandise: {
    image: "https://cdn.shopify.com/s/files/1/0534/7380/4477/files/IMG-7450.jpg?v=1750940078",
    color: "#b45309",
    desc: "Wear the brand",
  },
  Wheels: {
    image: "https://cdn.shopify.com/s/files/1/0534/7380/4477/files/IMG-1730.jpg?v=1760691304",
    color: "#a16207",
    desc: "Supermoto rim sets and rolling hardware",
  },
  Other: {
    image: "https://cdn.shopify.com/s/files/1/0534/7380/4477/products/image_f2fcab8f-2e30-45e5-a7fc-8c6d9af2906c.jpg?v=1750939636",
    color: "#b91c1c",
    desc: "Titanium hardware and everything else",
  },
};

const FALLBACK: CatMeta = {
  image: "/builds/macro-krummer-rainbow.jpg",
  color: "#b91c1c",
  desc: "Performance parts for your supermoto",
};

export async function Categories() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const counts = countByCategory();
  const cats = (CATEGORIES as readonly string[])
    .map((name) => ({ name, count: counts[name as keyof typeof counts] ?? 0 }))
    .filter((c) => c.count > 0);

  return (
    <section className="border-b border-border py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-accent">
            {dict.categories.kicker}
          </p>
          <h2 className="font-display text-4xl uppercase leading-none tracking-tight md:text-5xl">
            {dict.categories.title}
          </h2>
          <p className="mt-3 text-sm text-fg-muted md:text-base">
            {dict.categories.subtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => {
            const m = META[c.name] ?? FALLBACK;
            const card = (dict.categoryCards as Record<string, { name: string; desc: string }>)[c.name];
            const title = card?.name ?? c.name;
            const desc = card?.desc ?? m.desc;
            return (
              <Link
                key={c.name}
                href={`/shop?category=${encodeURIComponent(c.name)}`}
                className="reveal-soft group relative flex h-64 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 md:h-72"
              >
                <Image
                  src={m.image}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* overall dark tint so the whole image reads darker, then a
                    stronger scrim under the text and the category colour as a
                    subtle mid glow so white text always sits over dark */}
                <div aria-hidden className="absolute inset-0 bg-black/20" />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 24%, ${m.color}99 52%, ${m.color}40 78%, rgba(0,0,0,0.12) 100%)`,
                  }}
                />

                {/* round icon badge, top-right */}
                <span className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-sm transition-all group-hover:border-white group-hover:bg-accent">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      d="M7 17L17 7M17 7H8M17 7v9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <div className="relative p-6">
                  <span className="mb-3 block h-1 w-9 rounded-full bg-accent" />
                  <h3 className="font-display text-3xl uppercase leading-none tracking-tight text-white">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-[22rem] text-sm leading-snug text-white/80">
                    {desc}
                  </p>
                  <span className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                    {c.count} {dict.categories.productsSuffix}
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
