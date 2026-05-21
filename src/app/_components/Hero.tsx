import Image from "next/image";
import Link from "next/link";
import { getBikeIndex } from "@/lib/products";
import { SearchSuggest } from "./SearchSuggest";

const quickPicks = ["Beta", "Husqvarna", "KTM", "Aprilia", "Fantic", "Yamaha"];

export function Hero() {
  const bikes = getBikeIndex();
  return (
    <section
      className="relative isolate overflow-hidden border-b border-border"
      style={{ aspectRatio: "19 / 10" }}
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero-trails.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          style={{ transform: "scaleX(-1)" }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.65) 35%, rgba(10,10,10,0.1) 70%, rgba(10,10,10,0.05) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-24 md:h-32"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, #0a0a0a 100%)",
          }}
        />
      </div>

      <div className="mx-auto flex h-full min-h-[560px] max-w-7xl flex-col justify-center gap-6 px-4 py-16 md:gap-8 md:px-6 md:py-20">
        <div className="flex max-w-2xl flex-col gap-5">
          <h1 className="font-display text-balance text-5xl uppercase leading-[1] tracking-[0.01em] text-zinc-100 sm:text-6xl md:text-7xl">
            <span className="reveal-word" style={{ animationDelay: "0.05s" }}>Ride</span>{" "}
            <span className="reveal-word" style={{ animationDelay: "0.2s" }}>wild.</span>
            <br />
            <span className="reveal-word italic text-accent/85" style={{ animationDelay: "0.45s" }}>Ride</span>{" "}
            <span className="reveal-word italic text-accent/85" style={{ animationDelay: "0.6s" }}>free.</span>
          </h1>

          <p className="max-w-xl text-balance text-sm leading-relaxed text-fg-muted md:text-lg">
            Performance parts for Supermoto and Enduro. Designed and tested
            in Germany by Thomas Krawietz, Mechatronics Master.
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
      </div>
    </section>
  );
}
