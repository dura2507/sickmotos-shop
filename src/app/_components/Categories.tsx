import Image from "next/image";
import Link from "next/link";
import { countByCategory, CATEGORIES } from "@/lib/products";

// Background image per category (Thomas's image-tile design, Telegram 2026-06-01).
const CATEGORY_IMAGE: Record<string, string> = {
  Exhaust: "/builds/macro-krummer-fantic-side.jpg",
  "LED Headlights": "/builds/macro-hexagon-led-red.jpg",
  "Carbon Parts": "/builds/macro-krummer-fantic-engine.jpg",
  "ECU Tuning": "/builds/macro-beta-blue-headlight.jpg",
  Brakes: "/builds/build-beta-blue-countryside.jpg",
  Graphics: "/builds/build-fantic-bold-red.jpg",
  "Titanium Screws": "/builds/macro-krummer-rainbow.jpg",
  Merchandise: "/builds/lifestyle-beta-cyan-front.jpg",
  Wheels: "/builds/build-fantic-xmf-wheelie.jpg",
  Other: "/builds/hero-beta-cyan-sunset.jpg",
};

const FALLBACK_IMAGE = "/builds/macro-krummer-rainbow.jpg";

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
              className="reveal-soft group relative flex h-48 items-end overflow-hidden rounded-lg border border-border transition-all duration-300 hover:-translate-y-0.5 hover:border-accent md:h-52"
            >
              <Image
                src={CATEGORY_IMAGE[c.name] ?? FALLBACK_IMAGE}
                alt={c.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* dark gradient for text legibility */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10"
              />
              <div className="relative flex w-full items-end justify-between gap-3 p-5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                    {c.count} products
                  </span>
                  <span className="font-display text-2xl uppercase leading-none tracking-tight text-white">
                    {c.name}
                  </span>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-sm transition-all group-hover:border-accent group-hover:bg-accent">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
