import Image from "next/image";

const products = [
  {
    title: "Titanium",
    sub: "Lighter. Sharper. Louder.",
    image:
      "https://www.sick-motos.com/cdn/shop/files/6C631DE0-9D31-4384-A7EC-7C12447B25AB_1024x1024.jpg?v=1754641476",
    rotate: -6,
    delay: 0,
  },
  {
    title: "Carbon",
    sub: "Strength without weight.",
    image:
      "https://www.sick-motos.com/cdn/shop/files/IMG-3978_1024x1024.png?v=1750940000",
    rotate: 4,
    delay: 1.2,
  },
  {
    title: "Brakes",
    sub: "Stop on a dime.",
    image:
      "https://www.sick-motos.com/cdn/shop/files/IMG-3211_1024x1024.jpg?v=1770275582",
    rotate: -3,
    delay: 2.4,
  },
];

export function FloatingProducts() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-bg py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 50%, rgba(225,6,0,0.10), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(225,6,0,0.6) 50%, transparent 100%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 flex flex-col items-center gap-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            Materials
          </span>
          <h2 className="font-display text-balance text-4xl uppercase leading-[0.95] tracking-tight md:text-5xl">
            Built from the
            <br />
            <span className="italic text-accent/85">good stuff.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-6">
          {products.map((p) => (
            <article
              key={p.title}
              className="reveal-soft group relative flex flex-col items-center gap-4 text-center"
            >
              <div className="relative aspect-square w-full max-w-[340px]">
                <div
                  aria-hidden
                  className="drift-glow absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(225,6,0,0.35), transparent 70%)",
                    animationDelay: `${p.delay}s`,
                  }}
                />
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="float-y object-contain transition-transform duration-500 group-hover:scale-110"
                  style={{
                    mixBlendMode: "multiply",
                    transform: `rotate(${p.rotate}deg)`,
                    animationDelay: `${p.delay}s`,
                    filter:
                      "drop-shadow(0 20px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(225,6,0,0.25))",
                  }}
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-display text-3xl uppercase tracking-tight text-fg md:text-4xl">
                  {p.title}
                </span>
                <span className="text-sm text-fg-muted">{p.sub}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
