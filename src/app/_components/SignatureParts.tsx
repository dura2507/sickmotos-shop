import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

type Part = {
  key: "signatureLed" | "raceHardware" | "fuelEcu";
  title?: string;
  href: string;
  src: string;
  focal?: string;
};

const parts: Part[] = [
  {
    key: "signatureLed",
    title: "Hexagon Angel Eye RGBW",
    href: "/shop?category=LED+Headlights",
    src: "/builds/macro-hexagon-led-red.jpg",
    focal: "object-[50%_45%]",
  },
  {
    key: "raceHardware",
    href: "/shop?category=Exhaust",
    src: "/builds/macro-krummer-rainbow.jpg",
    focal: "object-[40%_50%]",
  },
  {
    key: "fuelEcu",
    href: "/shop?category=ECU+Tuning",
    src: "https://cdn.shopify.com/s/files/1/0534/7380/4477/files/49FB8537-7656-4EFF-9152-C222480A77E3.webp?v=1750938873",
    focal: "object-center",
  },
];

export async function SignatureParts() {
  const dict = await getDictionary(await getLocale());
  const items = dict.signatureParts.items;
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg py-20 md:py-24">
      <div
        aria-hidden
        className="drift-glow pointer-events-none absolute right-[-15%] top-1/4 -z-0 h-[420px] w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,6,0,0.28), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-10 flex max-w-2xl flex-col gap-3 md:mb-14">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            {dict.signatureParts.kicker}
          </span>
          <h2 className="font-display text-balance text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            {dict.signatureParts.title}
          </h2>
          <p className="text-sm text-fg-muted md:text-base">
            {dict.signatureParts.subtitle}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {parts.map((p) => {
            const item = items[p.key];
            const cardTitle = "title" in item ? item.title : p.title;
            return (
            <Link
              key={p.key}
              href={p.href}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border sm:aspect-[4/3]">
                <Image
                  src={p.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={`${p.focal ?? "object-center"} object-cover transition-transform duration-500 group-hover:scale-[1.04]`}
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                  {item.label}
                </span>
                <h3 className="font-display text-2xl uppercase leading-tight tracking-tight text-fg">
                  {cardTitle}
                </h3>
                <p className="text-sm text-fg-muted">{item.pitch}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent transition-colors group-hover:text-accent-hi">
                  {dict.signatureParts.shopCategory}
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
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
