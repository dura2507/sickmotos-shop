import Image from "next/image";

export function ActionBanner() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="red-stripes absolute top-0 right-0 h-full w-32 opacity-60"
        style={{ clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0 100%)" }}
      />
      <Image
        src="/builds/build-fantic-bold-red.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover object-[80%_50%]"
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
          Tested where it counts
        </span>
        <h2 className="font-display text-balance text-5xl uppercase leading-[0.95] tracking-tight text-fg md:text-7xl">
          Built for the
          <br />
          <span className="text-accent">trail.</span>
        </h2>
        <p className="max-w-xl text-balance text-base text-fg-muted md:text-lg">
          Every part is ridden, abused, and validated by Thomas before it
          ships. No lab specs. Real conditions.
        </p>
        <a
          href="#bestseller"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
        >
          Shop the catalog
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
