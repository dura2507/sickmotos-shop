import Image from "next/image";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function ActionBanner() {
  const dict = await getDictionary(await getLocale());
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="red-stripes absolute top-0 right-0 h-full w-32 opacity-60"
        style={{ clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0 100%)" }}
      />
      <Image
        src="/builds/build-beta-blue-countryside.jpg"
        alt=""
        fill
        sizes="100vw"
        quality={90}
        className="-z-10 object-cover object-[50%_42%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.4) 50%, rgba(10,10,10,0.85) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 -z-10 w-2/3"
        style={{
          background:
            "linear-gradient(90deg, rgba(225,6,0,0.18) 0%, transparent 100%)",
        }}
      />

      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-6 py-24 md:py-32">
        <span className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent backdrop-blur-sm">
          {dict.actionBanner.kicker}
        </span>
        <h2 className="font-display text-balance text-5xl uppercase leading-[0.95] tracking-tight text-fg md:text-7xl">
          {dict.actionBanner.titleLine1}
          <br />
          <span className="text-accent">{dict.actionBanner.titleLine2}</span>
        </h2>
        <p className="max-w-xl text-balance text-base text-fg-muted md:text-lg">
          {dict.actionBanner.body}
        </p>
        <a
          href="#bestseller"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
        >
          {dict.actionBanner.cta}
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
