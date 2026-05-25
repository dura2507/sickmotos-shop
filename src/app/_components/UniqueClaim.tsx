// Per Thomas: "Die meisten Produkte sind weltweit nur bei uns
// verfügbar. Unter anderem Titan Krümmer für 4-Takt Modelle von Beta,
// Fantic und Yamaha." Lift that as a small but loud claim block right
// after the Hero, before the Featured Builds and Bestsellers.

const points = [
  {
    label: "Worldwide exclusive",
    text: "4-stroke Titanium Krummer for Beta, Fantic and Yamaha 125 — built and TIG-welded by Thomas himself, available nowhere else.",
  },
  {
    label: "Hexagon Angel Eye",
    text: "Plug-and-play LED hexagon headlights with daytime running ring, E-approved and engineered specifically for current-gen Beta and Sherco frames.",
  },
  {
    label: "FuelX & ECU tuning",
    text: "Live air-fuel correction matched to our Krummer. Crisper throttle, no map loss, fully reversible.",
  },
];

export function UniqueClaim() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg py-14 md:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/2 -z-10 size-[420px] -translate-y-1/2 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,6,0,0.12), transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col gap-3 md:max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            Built only by SickMotos
          </span>
          <h2 className="font-display text-balance text-3xl uppercase leading-[1.05] tracking-tight md:text-5xl">
            Parts you cannot buy anywhere else.
          </h2>
          <p className="text-sm text-fg-muted md:text-base">
            Most of what we sell is engineered in-house and produced in
            small batches. Nothing is rebranded, nothing is generic.
          </p>
        </div>
        <ul className="grid gap-5 md:grid-cols-3">
          {points.map((p) => (
            <li
              key={p.label}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface/40 p-5"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                {p.label}
              </span>
              <p className="text-sm text-fg-muted md:text-base">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
