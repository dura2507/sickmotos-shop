import Image from "next/image";

const cols = [
  {
    title: "Shop",
    links: [
      "LED Headlights",
      "Exhaust",
      "Carbon Parts",
      "ECU Tuning",
      "Merchandise",
      "Titanium Screws",
    ],
  },
  {
    title: "Service",
    links: ["Shipping", "Returns", "Warranty", "FAQ", "Contact"],
  },
  {
    title: "Contact",
    links: [
      "+49 176 34658003",
      "sickMotos-styles@freenet.de",
      "Obere Str. 18, 86554 Pöttmes",
      "Mon-Sat 9-22, Sun 10-18",
      "@sickmotos_official",
    ],
  },
];

const payments = [
  "Visa",
  "Mastercard",
  "Maestro",
  "Amex",
  "Apple Pay",
  "Bitcoin",
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1.4fr]">
          <div className="flex flex-col gap-4">
            <Image
              src="/sickmotos.svg"
              alt="SickMotos"
              width={280}
              height={180}
              className="h-24 w-auto"
            />
            <p className="max-w-xs text-sm text-fg-muted">
              Performance parts for Supermoto & Enduro. Engineered in Germany
              by Thomas Krawietz.
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-fg-dim">
                {c.title}
              </div>
              <ul className="flex flex-col gap-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-fg-dim">
            © {new Date().getFullYear()} Sickmotos-Styles · Terms · Imprint · Privacy
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {payments.map((p) => (
              <span
                key={p}
                className="rounded border border-border-strong bg-surface px-2 py-1 text-[10px] font-medium text-fg-muted"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
