import Image from "next/image";
import Link from "next/link";
import { getBikeIndex } from "@/lib/products";
import { SearchSuggest } from "./SearchSuggest";

export function Hero() {
  const bikes = getBikeIndex();
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      {/* full-bleed bike background (Thomas's hero style) */}
      <Image
        src="/builds/hero-beta-cyan-sunset.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[50%_38%]"
      />
      {/* moody dark overlays for legibility */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.5) 42%, rgba(0,0,0,0.88) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div className="mx-auto flex min-h-[82vh] max-w-7xl flex-col justify-center gap-6 px-4 py-16 md:px-6 md:py-24">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-accent backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-accent pulse-accent" />
          Supermoto Performance Parts
        </span>

        {/* SVG slogan headline (Thomas's artwork) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/ride-in-style.svg"
          alt="Ride in style. Faster than others."
          className="reveal-soft w-full max-w-[300px] drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] sm:max-w-[400px] md:max-w-[480px]"
        />

        <p className="max-w-xl text-balance text-sm leading-relaxed text-zinc-200 md:text-base lg:text-lg">
          Performance parts for the supermoto universe. 2- and 4-stroke, 50 to
          700 ccm — KTM, Husqvarna, Beta, Fantic, Sherco and many more.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-accent/85"
          >
            Shop now
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center rounded-full border border-white/30 bg-black/30 px-7 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
          >
            Categories
          </Link>
        </div>

        <div className="w-full max-w-xl">
          <SearchSuggest
            bikes={bikes}
            mode="bikes"
            placeholder="Search your bike: KTM EXC, Beta RR 125..."
            variant="hero"
          />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-zinc-300">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5 text-accent">
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} viewBox="0 0 20 20" className="size-3 fill-current">
                  <path d="M10 1l2.59 5.95L19 7.95l-4.5 4.4 1.06 6.2L10 15.5l-5.56 3.05L5.5 12.35 1 7.95l6.41-1z" />
                </svg>
              ))}
            </div>
            <span className="font-bold text-white">4.9</span>
          </div>
          <span aria-hidden className="size-1 rounded-full bg-accent" />
          <span>Worldwide shipping</span>
          <span aria-hidden className="size-1 rounded-full bg-accent" />
          <span>Bitcoin accepted</span>
        </div>
      </div>
    </section>
  );
}
