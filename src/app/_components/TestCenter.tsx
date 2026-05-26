import Image from "next/image";

// Per Thomas (Telegram 2026-05-25): the SickMotos rental in Zadar is
// the brand's second pillar that should support the shop. Test Center
// section explicitly mentions Zadar + links to rentamotozadar.com so
// customers on holiday can ride the spec they're about to order.

export function TestCenter() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-14 md:py-24">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border shadow-2xl ring-1 ring-black/40 md:aspect-[3/4]">
          <Image
            src="/builds/build-beta-blue-countryside.jpg"
            alt="SickMotos-tuned Beta RR 125 on the Croatian coastline"
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
            <span>SickMotos · Test ride center</span>
            <span className="rounded-full bg-accent px-2 py-1 text-fg">
              Live in Zadar
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            Test ride center · Zadar, Croatia
          </span>
          <h2 className="font-display text-balance text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            Ride the build before you buy the parts.
          </h2>
          <p className="text-sm text-fg-muted md:text-base">
            On holiday near Zadar? Our motorcycle rental doubles as a live
            test center for the full SickMotos spec. Throw a leg over a tuned
            Beta or Fantic 125, feel the Krummer and the LED hexagon on real
            Croatian coastline, then order the exact configuration you just
            rode. The same crew that builds the parts maintains the fleet.
          </p>
          <ul className="grid gap-2 text-sm text-fg-muted sm:grid-cols-2">
            {[
              "Beta RR 125 SickBuild",
              "Fantic XEF / XMF 125 SickBuild",
              "By the day or by the week",
              "One-click ordering of the ridden spec",
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
              Book a test ride
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="https://wa.me/4917634658003"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold uppercase tracking-wider text-fg-muted transition-colors hover:text-accent"
            >
              WhatsApp the crew →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
