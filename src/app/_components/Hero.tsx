import Image from "next/image";
import Link from "next/link";
import { getBikeIndex } from "@/lib/products";
import { SearchSuggest } from "./SearchSuggest";

const quickPicks = ["Beta", "Husqvarna", "KTM", "Aprilia", "Fantic", "Yamaha"];

export function Hero() {
  const bikes = getBikeIndex();
  return (
    <section className="relative border-b border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-10 pt-10 md:gap-12 md:px-6 md:pb-16 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-20">
        <div className="flex min-w-0 max-w-2xl flex-col gap-5 lg:gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            <span className="size-1.5 rounded-full bg-accent pulse-accent" />
            Engineered in Germany
          </span>

          <h1 className="font-display text-balance text-5xl uppercase leading-[0.95] tracking-[0.01em] text-zinc-100 sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            <span className="reveal-word" style={{ animationDelay: "0.05s" }}>Ride</span>{" "}
            <span className="reveal-word" style={{ animationDelay: "0.2s" }}>wild.</span>
            <br />
            <span className="reveal-word italic text-accent/85" style={{ animationDelay: "0.45s" }}>Ride</span>{" "}
            <span className="reveal-word italic text-accent/85" style={{ animationDelay: "0.6s" }}>free.</span>
          </h1>

          <p className="max-w-xl text-balance text-sm leading-relaxed text-fg-muted md:text-base lg:text-lg">
            Performance parts for Beta and Fantic 125 4-stroke. Titanium
            manifolds, hexagon LED, FuelX and ECU tuning. Designed, tested and
            ridden by Thomas Krawietz, Mechatronics Master.
          </p>

          <SearchSuggest
            bikes={bikes}
            mode="bikes"
            placeholder="Search your bike: KTM EXC, Beta RR 125..."
            variant="hero"
          />

          <div className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
            <div className="flex items-center gap-2 whitespace-nowrap text-xs md:flex-wrap md:gap-2 md:whitespace-normal">
              {quickPicks.map((b) => (
                <Link
                  key={b}
                  href={`/shop?brand=${encodeURIComponent(b)}`}
                  className="rounded-full border border-fg/20 bg-bg/70 px-3 py-1.5 font-semibold uppercase tracking-wider text-fg backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
                >
                  {b}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-fg-muted">
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5 text-accent">
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg
                    key={i}
                    viewBox="0 0 20 20"
                    className="size-3 fill-current"
                  >
                    <path d="M10 1l2.59 5.95L19 7.95l-4.5 4.4 1.06 6.2L10 15.5l-5.56 3.05L5.5 12.35 1 7.95l6.41-1z" />
                  </svg>
                ))}
              </div>
              <span className="font-bold text-fg">4.9</span>
            </div>
            <span aria-hidden className="size-1 rounded-full bg-accent" />
            <span>Worldwide shipping</span>
            <span aria-hidden className="size-1 rounded-full bg-accent" />
            <span>Bitcoin accepted</span>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl ring-1 ring-black/40 sm:aspect-[4/5] lg:aspect-[3/4]">
            <Image
              src="/builds/hero-beta-cyan-sunset.jpg"
              alt="SickMotos-tuned Beta RR 125 at sunset"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-[50%_30%]"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 55%, rgba(10,10,10,0.6) 100%)",
              }}
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-fg/90">
              <span>Beta RR 125 · SickMotos build</span>
              <span className="rounded-full bg-bg/70 px-2 py-1 text-accent backdrop-blur-sm">
                Real bike. Real ride.
              </span>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-8 -bottom-12 -z-10 h-40 rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(225,6,0,0.35), transparent 75%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
