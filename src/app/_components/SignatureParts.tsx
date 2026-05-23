import Image from "next/image";
import Link from "next/link";

type Part = {
  label: string;
  title: string;
  pitch: string;
  href: string;
  src: string;
  alt: string;
  focal?: string;
};

const parts: Part[] = [
  {
    label: "Signature LED",
    title: "Hexagon Angel Eye RGBW",
    pitch:
      "Plug-and-play, E-approved headlights with daytime running ring and RGB modes. No splicing the OEM loom.",
    href: "/shop?category=LED+Headlights",
    src: "/builds/macro-hexagon-led-red.jpg",
    alt: "Red hexagon angel eye LED headlight installed on bike",
    focal: "object-[50%_45%]",
  },
  {
    label: "Race hardware",
    title: "Titanium Krummer, handmade",
    pitch:
      "Bent by hand, TIG-welded, heat-blued. Audible torque gain on the Beta and Fantic 125 4-stroke.",
    href: "/shop?category=Exhaust",
    src: "/builds/macro-krummer-rainbow.jpg",
    alt: "Handmade titanium exhaust manifold with rainbow heat colors",
    focal: "object-[40%_50%]",
  },
  {
    label: "Fuel & ECU",
    title: "FuelX & ECU tuning",
    pitch:
      "Live air-fuel correction without losing the OEM map. Dialed in to match the Krummer for crisper throttle.",
    href: "/shop?category=ECU+Tuning",
    src: "/builds/macro-krummer-fantic-side.jpg",
    alt: "FuelX tuning installed on Fantic bike",
    focal: "object-[50%_55%]",
  },
];

export function SignatureParts() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg py-20 md:py-24">
      <div
        aria-hidden
        className="drift-glow pointer-events-none absolute right-[-15%] top-1/4 -z-0 h-[420px] w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,6,0,0.28), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-10 flex max-w-2xl flex-col gap-3 md:mb-14">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            Signature parts
          </span>
          <h2 className="font-display text-balance text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            Three parts that built the SickMotos name.
          </h2>
          <p className="text-sm text-fg-muted md:text-base">
            No marketing specs. The exact hardware we bolt to Beta and Fantic
            125 4-strokes every day, and ride ourselves.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {parts.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-border">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={`${p.focal ?? "object-center"} object-cover transition-transform duration-500 group-hover:scale-[1.04]`}
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                  {p.label}
                </span>
                <h3 className="font-display text-2xl uppercase leading-tight tracking-tight text-fg">
                  {p.title}
                </h3>
                <p className="text-sm text-fg-muted">{p.pitch}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent transition-colors group-hover:text-accent-hi">
                  Shop the category
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
