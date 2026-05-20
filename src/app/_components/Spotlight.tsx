import Image from "next/image";

export function Spotlight() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-bg py-20 md:py-28">
      <div
        aria-hidden
        className="drift-glow pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full md:size-[820px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,6,0,0.45), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, transparent 30%, #0a0a0a 90%)",
        }}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-[1.1fr_1fr]">
        <div className="relative aspect-square w-full max-w-[560px] justify-self-center md:order-2">
          <Image
            src="https://www.sick-motos.com/cdn/shop/files/AAFD1335-22B2-4BA7-B533-249564ECDB50_1024x1024.jpg?v=1769075218"
            alt="SICKMOTOS LED RGBW V7 Rage Edition"
            fill
            sizes="(max-width: 768px) 100vw, 560px"
            className="reveal-soft rounded-2xl object-cover"
            style={{
              filter:
                "drop-shadow(0 0 50px rgba(225,6,0,0.45)) drop-shadow(0 30px 80px rgba(0,0,0,0.6))",
            }}
          />

          <div
            aria-hidden
            className="float-y absolute -left-4 top-12 hidden rounded-full border border-accent/40 bg-bg/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur-sm md:block"
            style={{ animationDelay: "0.4s" }}
          >
            12 light modes
          </div>
          <div
            aria-hidden
            className="float-y absolute -right-2 top-1/3 hidden rounded-full border border-accent/40 bg-bg/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur-sm md:block"
            style={{ animationDelay: "1.2s" }}
          >
            App control
          </div>
          <div
            aria-hidden
            className="float-y absolute bottom-12 left-6 hidden rounded-full border border-accent/40 bg-bg/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur-sm md:block"
            style={{ animationDelay: "2s" }}
          >
            Plug & Play
          </div>
        </div>

        <div className="flex flex-col gap-5 md:order-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            Featured
          </span>
          <h2 className="font-display text-balance text-5xl uppercase leading-[0.95] tracking-tight md:text-6xl">
            Engineered
            <br />
            for the <span className="italic text-accent/85">dark.</span>
          </h2>
          <p className="max-w-md text-base leading-relaxed text-fg-muted">
            Hexagon RGBW V7. App-controlled, twelve light modes, direct fit
            for Husqvarna FE and TE 2024. Cuts through fog, dust and forest
            without compromise.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
            >
              Shop now
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <span className="text-xs text-fg-dim">€129 · was €229</span>
          </div>
        </div>
      </div>
    </section>
  );
}
