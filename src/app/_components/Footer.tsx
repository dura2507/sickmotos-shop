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
    <footer className="relative border-t border-accent/40 bg-bg">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(225,6,0,0.8) 50%, transparent 100%)",
          boxShadow: "0 0 16px rgba(225,6,0,0.5)",
        }}
      />
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1.4fr]">
          <div className="flex flex-col gap-4">
            <Image
              src="/logo-alt-2.png"
              alt="SickMotos"
              width={974}
              height={626}
              sizes="240px"
              style={{ width: "auto", height: "96px" }}
              className="self-start"
            />
            <p className="max-w-xs text-sm text-fg-muted">
              Performance parts for Supermoto & Enduro. Engineered in Germany
              by Thomas Krawietz.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://wa.me/4917634658003"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="grid size-10 place-items-center rounded-full border border-border-strong text-fg-muted transition-all hover:border-accent hover:text-accent hover:-translate-y-0.5"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                  <path d="M20.5 3.5A11.8 11.8 0 0012 0C5.4 0 0 5.4 0 12c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.7 1.4 5.7 1.4 6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.5-8.3z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/sickmotos_official"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid size-10 place-items-center rounded-full border border-border-strong text-fg-muted transition-all hover:border-accent hover:text-accent hover:-translate-y-0.5"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
                </svg>
              </a>
              <a
                href="mailto:sickMotos-styles@freenet.de"
                aria-label="Email"
                className="grid size-10 place-items-center rounded-full border border-border-strong text-fg-muted transition-all hover:border-accent hover:text-accent hover:-translate-y-0.5"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" strokeLinecap="round" />
                </svg>
              </a>
              <a
                href="tel:+4917634658003"
                aria-label="Phone"
                className="grid size-10 place-items-center rounded-full border border-border-strong text-fg-muted transition-all hover:border-accent hover:text-accent hover:-translate-y-0.5"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-dim">
            <span>© {new Date().getFullYear()} Sickmotos-Styles</span>
            <a href="/legal/impressum" className="hover:text-fg">Impressum</a>
            <a href="/legal/agb" className="hover:text-fg">AGB</a>
            <a href="/legal/datenschutz" className="hover:text-fg">Datenschutz</a>
            <a href="/legal/widerruf" className="hover:text-fg">Widerruf</a>
            <a href="/legal/versand" className="hover:text-fg">Versand</a>
          </div>
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
