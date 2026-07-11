import Image from "next/image";
import { AskSickBot } from "./AskSickBot";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

// Per Thomas (Telegram 2026-05-25): the SickMotos rental in Zadar is
// the brand's second pillar that should support the shop. Test Center
// section explicitly mentions Zadar + links to rentamotozadar.com so
// customers on holiday can ride the spec they're about to order.

export async function TestCenter() {
  const dict = await getDictionary(await getLocale());
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-14 md:py-24">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border shadow-2xl ring-1 ring-black/40 md:aspect-[3/4]">
          <Image
            src="/builds/build-beta-blue-countryside.jpg"
            alt={dict.testCenter.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-[50%_45%]"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 50%, rgba(10,10,10,0.7) 100%)",
            }}
          />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-fg/90">
            <span>{dict.testCenter.imageCaption}</span>
            <span className="rounded-full bg-accent px-2 py-1 text-fg">
              {dict.testCenter.liveBadge}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            {dict.testCenter.kicker}
          </span>
          <h2 className="font-display text-balance text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            {dict.testCenter.title}
          </h2>
          <p className="text-sm text-fg-muted md:text-base">
            {dict.testCenter.body}
          </p>
          <ul className="grid gap-2 text-sm text-fg-muted sm:grid-cols-2">
            {[
              "Beta RR 1XX LC SickMotos Build",
              "KTM Duke 125 / 390 SickMotos Mapping and Exhaust System",
              dict.testCenter.featureByDayOrWeek,
              dict.testCenter.featureOneClickOrder,
            ].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <span aria-hidden className="size-1 rounded-full bg-accent" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <a
              href="https://rentamotozadar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
            >
              {dict.testCenter.bookRide}
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <AskSickBot
              variant="link"
              label={dict.testCenter.askSickBot}
              className="text-[11px] uppercase tracking-wider"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
