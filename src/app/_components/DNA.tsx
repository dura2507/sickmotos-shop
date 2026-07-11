import Image from "next/image";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function DNA() {
  const dict = await getDictionary(await getLocale());
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      <div
        aria-hidden
        className="drift-glow pointer-events-none absolute -left-32 top-1/2 -z-0 h-[600px] w-[600px] -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,6,0,0.35), transparent 70%)",
        }}
      />
      <div className="absolute inset-y-0 right-0 hidden w-1/2 md:block">
        <Image
          src="/builds/lifestyle-beta-cyan-front.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover object-center opacity-60"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.4) 40%, transparent 100%)",
          }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col gap-5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            {dict.dna.kicker}
          </span>
          <h2 className="font-display text-balance text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            {dict.dna.title}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-fg-muted">
            {dict.dna.subtitle}
          </p>
          <p className="font-display text-sm uppercase tracking-[0.18em] text-fg-muted">
            {dict.dna.tagline}
          </p>
        </div>
        <div className="md:hidden">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
            <Image
              src="/builds/lifestyle-beta-cyan-front.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
