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
            className="mt-2 flex w-full max-w-xl items-center gap-2 border-b border-fg/30 pb-2 transition-colors focus-within:border-accent"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5 shrink-0 text-fg-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Search your bike: Beta RR 125, KTM SMC, Husqvarna 701..."
              className="flex-1 bg-transparent py-2 text-base text-fg placeholder:text-fg-dim focus:outline-none"
            />
            <button
              type="submit"
              className="text-xs font-bold uppercase tracking-wider text-accent transition-colors hover:text-accent-hi"
            >
              Find
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span className="text-fg-dim">Quick picks</span>
            <span aria-hidden className="h-3 w-px bg-accent/60" />
            {quickPicks.map((b, i) => (
              <span key={b} className="flex items-center gap-3">
                <a
                  href="#"
                  className="font-medium uppercase tracking-wider text-fg-muted transition-colors hover:text-accent"
                >
                  {b}
                </a>
                {i < quickPicks.length - 1 && (
                  <span aria-hidden className="size-1 rounded-full bg-fg-dim/60" />
                )}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fg-muted">
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
            <span aria-hidden className="size-1 rounded-full bg-accent" />
            <span>Worldwide shipping</span>
            <span aria-hidden className="size-1 rounded-full bg-accent" />
            <span>Bitcoin accepted</span>
          </div>
        </div>
      </div>
    </section>
  );
}
