import Image from "next/image";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function Founder() {
  const dict = await getDictionary(await getLocale());
  return (
    <section
      id="founder"
      className="relative isolate overflow-hidden border-b border-border"
    >
      <Image
        src="/hero-terrain.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover object-center opacity-50"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.85) 100%), radial-gradient(60% 60% at 30% 50%, rgba(225,6,0,0.18), transparent 70%)",
        }}
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-24 text-center md:py-32">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
          {dict.founder.kicker}
        </span>
        <blockquote className="text-balance font-display text-3xl uppercase leading-[1.1] tracking-tight text-fg md:text-5xl">
          {dict.founder.quote}
        </blockquote>
        <p className="max-w-2xl text-balance text-base leading-relaxed text-fg-muted md:text-lg">
          {dict.founder.bio}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-px w-12 bg-accent" />
          <div className="text-left">
            <div className="font-semibold text-fg">Thomas Krawietz</div>
            <div className="text-sm text-fg-muted">{dict.founder.role}</div>
          </div>
          <div className="h-px w-12 bg-accent" />
        </div>
      </div>
    </section>
  );
}
