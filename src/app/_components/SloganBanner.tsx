import Image from "next/image";

// Thomas's "Ride in style — Faster than others" slogan artwork (Telegram
// 2026-06-01). The JPEG has a black background, so it blends edge-to-edge on
// a pure-black section.
export function SloganBanner() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-black">
      {/* subtle red glow for depth behind the artwork */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[120px]"
      />
      <div className="relative mx-auto flex max-w-5xl items-center justify-center px-6 py-12 md:py-16">
        <Image
          src="/brand/ride-in-style.jpg"
          alt="Ride in style. Faster than others."
          width={1179}
          height={851}
          sizes="(max-width: 768px) 88vw, 700px"
          className="reveal-soft h-auto w-full max-w-[700px]"
        />
      </div>
    </section>
  );
}
