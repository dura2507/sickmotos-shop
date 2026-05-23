import Image from "next/image";

export function TestCenter() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-14 md:py-24">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border shadow-2xl ring-1 ring-black/40 md:aspect-[3/4]">
          <Image
            src="/builds/lifestyle-beta-cyan-low.jpg"
            alt="Rider on tuned Beta 125 at sunset"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-[50%_35%]"
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
            <span>SickMotos · Rent a Moto</span>
            <span className="rounded-full bg-accent px-2 py-1 text-fg">Live in Zadar</span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            Test ride center
          </span>
          <h2 className="font-display text-balance text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            Bevor du tunst, fahr es einmal.
          </h2>
          <p className="text-sm text-fg-muted md:text-base">
            Unser Test Center an der Adria. Probiere die SickMotos Builds aus
            bevor du dir die Teile dazu bestellst. Modifizierte Beta- und
            Fantic-Modelle, fertig konfiguriert mit Krümmer, Hexagon-LED und
            FuelX. Fahren, fühlen, entscheiden.
          </p>
          <ul className="grid gap-2 text-sm text-fg-muted sm:grid-cols-2">
            {[
              "Beta RR 125 SickBuild",
              "Fantic XEF 125 SickBuild",
              "Tageweise oder Wochenpaket",
              "Direktbestellung der gefahrenen Spec",
            ].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <span aria-hidden className="size-1 rounded-full bg-accent" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-3">
            <a
              href="https://rentamotozadar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
            >
              Rent a Moto Zadar
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="https://wa.me/4917634658003"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong px-5 py-3 text-xs font-bold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent hover:text-accent"
            >
              Termin abstimmen
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
