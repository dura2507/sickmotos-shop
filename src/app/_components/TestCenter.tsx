import Image from "next/image";

export function TestCenter() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-14 md:py-24">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border shadow-2xl ring-1 ring-black/40 md:aspect-[3/4]">
          <Image
            src="/builds/build-beta-blue-countryside.jpg"
            alt="SickMotos-tuned Beta RR 125"
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
              Coming soon
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            Test ride center
          </span>
          <h2 className="font-display text-balance text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            Try the build before you buy the parts.
          </h2>
          <p className="text-sm text-fg-muted md:text-base">
            SickMotos is opening a test ride center for the full SickMotos spec
            line. Throw a leg over a fully tuned Beta or Fantic 125, feel the
            Krummer and the LED hexagon, then order the exact configuration
            you just rode.
          </p>
          <ul className="grid gap-2 text-sm text-fg-muted sm:grid-cols-2">
            {[
              "Beta RR 125 SickBuild",
              "Fantic XEF 125 SickBuild",
              "By appointment, day or week",
              "One-click ordering of the ridden spec",
            ].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <span aria-hidden className="size-1 rounded-full bg-accent" />
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-fg-dim">
            Launching with the 2026 season. Stay tuned.
          </p>
        </div>
      </div>
    </section>
  );
}
