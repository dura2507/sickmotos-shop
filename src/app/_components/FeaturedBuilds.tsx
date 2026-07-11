import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

type BuildKey = "betaRr125" | "fanticXef125" | "fanticXmf125";

type Build = {
  brand: string;
  model: string;
  buildKey: BuildKey;
  parts: string[];
  href: string;
  src: string;
  focal: string; // tailwind object-position class
};

const builds: Build[] = [
  {
    brand: "Beta",
    model: "RR 125 LC",
    buildKey: "betaRr125",
    parts: ["Hexagon LED RGBW", "Titanium Krümmer", "Custom graphics"],
    href: "/shop?brand=Beta&model=Beta+RR+125+LC",
    src: "/builds/build-beta-blue-countryside.jpg",
    focal: "object-[50%_45%]",
  },
  {
    brand: "Fantic",
    model: "XEF 125 'Bold'",
    buildKey: "fanticXef125",
    parts: ["Angel Eye Hexagon", "Titanium race Krümmer", "Bold graphics"],
    href: "/shop?brand=Fantic",
    src: "/builds/build-fantic-bold-red.jpg",
    focal: "object-[55%_50%]",
  },
  {
    brand: "Fantic",
    model: "XMF 125",
    buildKey: "fanticXmf125",
    parts: ["Hexagon LED", "Titanium Krümmer", "Custom graphics"],
    href: "/shop?brand=Fantic",
    src: "/builds/build-fantic-xmf-wheelie.jpg",
    focal: "object-[50%_50%]",
  },
];

export async function FeaturedBuilds() {
  const dict = await getDictionary(await getLocale());
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col gap-3 md:mb-14 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              {dict.featuredBuilds.kicker}
            </span>
            <h2 className="font-display text-balance text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
              {dict.featuredBuilds.title}
            </h2>
          </div>
          <p className="max-w-md text-sm text-fg-muted md:text-base">
            {dict.featuredBuilds.subtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {builds.map((b) => (
            <Link
              key={b.model + b.buildKey}
              href={b.href}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden md:aspect-[3/4]">
                <Image
                  src={b.src}
                  alt={dict.featuredBuilds.builds[b.buildKey].alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={`${b.focal} object-cover transition-transform duration-500 group-hover:scale-[1.04]`}
                />
                <div aria-hidden className="absolute inset-0 bg-black/30" />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,10,10,0.2) 0%, transparent 35%, rgba(10,10,10,0.92) 100%)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                    {b.brand}
                  </span>
                  <span className="font-display text-2xl uppercase leading-none tracking-tight text-fg md:text-3xl">
                    {b.model}
                  </span>
                  <span className="text-xs text-fg-muted">
                    {dict.featuredBuilds.builds[b.buildKey].tagline}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <ul className="flex flex-col gap-1.5 text-sm text-fg-muted">
                  {b.parts.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <span aria-hidden className="size-1 rounded-full bg-accent" />
                      {p}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent transition-colors group-hover:text-accent-hi">
                  {dict.featuredBuilds.shopSpec}
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
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
