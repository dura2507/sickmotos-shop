import Image from "next/image";

const quickPicks = ["Beta", "Husqvarna", "KTM", "Aprilia", "Fantic", "Yamaha"];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero-trails.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.55) 50%, rgba(10,10,10,0.2) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, #0a0a0a 100%)",
          }}
        />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 pt-24 pb-24 md:pt-28 md:pb-28">
        <div className="flex max-w-2xl flex-col gap-5">
          <h1 className="font-display text-balance text-5xl uppercase leading-[0.95] tracking-tight text-fg sm:text-6xl md:text-7xl">
            Ride wild.
            <br />
            <span className="text-accent">Ride free.</span>
          </h1>

          <p className="max-w-xl text-balance text-base leading-relaxed text-fg-muted md:text-lg">
            Performance parts for Supermoto and Enduro. Designed and tested
            in Germany by Thomas Krawietz, Mechatronics Master.
          </p>

          <form
            role="search"
            className="mt-2 flex w-full max-w-xl items-center overflow-hidden rounded-full border-2 border-accent bg-bg/80 backdrop-blur-sm transition-shadow focus-within:shadow-[0_0_0_4px_rgba(225,6,0,0.18)]"
          >
            <span className="grid size-12 place-items-center text-accent">
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search your bike: Beta RR 125, KTM SMC, Husqvarna 701..."
              className="flex-1 bg-transparent py-3.5 pr-4 text-base text-fg placeholder:text-fg-dim focus:outline-none"
            />
            <button
              type="submit"
              className="m-1 rounded-full bg-accent px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
            >
              Find
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <span className="text-fg-dim">Quick picks:</span>
            {quickPicks.map((b) => (
              <a
                key={b}
                href="#"
                className="rounded-full border border-border-strong bg-bg/40 px-3 py-1 font-medium uppercase tracking-wider text-fg backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
              >
                {b}
              </a>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 pt-5 text-xs text-fg-muted">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 text-accent">
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg
                    key={i}
                    viewBox="0 0 20 20"
                    className="size-3.5 fill-current"
                  >
                    <path d="M10 1l2.59 5.95L19 7.95l-4.5 4.4 1.06 6.2L10 15.5l-5.56 3.05L5.5 12.35 1 7.95l6.41-1z" />
                  </svg>
                ))}
              </div>
              <span>
                <span className="font-bold text-fg">4.9</span> verified reviews
              </span>
            </div>
            <span className="hidden h-3 w-px bg-border-strong sm:inline-block" />
            <span>Worldwide shipping</span>
            <span className="hidden h-3 w-px bg-border-strong sm:inline-block" />
            <span>Bitcoin accepted</span>
          </div>
        </div>
      </div>
    </section>
  );
}
