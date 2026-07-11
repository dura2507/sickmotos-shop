import Image from "next/image";
import { AskSickBot } from "./AskSickBot";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

type FooterLink = { label: string; href: string };

const payments = [
  "Visa",
  "Mastercard",
  "Maestro",
  "Amex",
  "Apple Pay",
  "Bitcoin",
];

export async function Footer() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const catCards = dict.categoryCards as Record<string, { name: string }>;
  const cn = (c: string) => catCards[c]?.name ?? c;
  const cols: { title: string; links: FooterLink[] }[] = [
    {
      title: dict.footer.shopCol,
      links: [
        { label: cn("Exhaust"), href: "/shop?category=Exhaust" },
        { label: cn("LED Headlights"), href: "/shop?category=LED+Headlights" },
        { label: cn("Carbon Parts"), href: "/shop?category=Carbon+Parts" },
        { label: cn("Graphics"), href: "/shop?category=Graphics" },
        { label: cn("Merchandise"), href: "/shop?category=Merchandise" },
        { label: dict.header.allParts, href: "/shop" },
      ],
    },
    {
      title: dict.footer.serviceCol,
      links: [
        { label: dict.footer.shippingDelivery, href: "/legal/versand" },
        { label: dict.footer.returns, href: "/legal/widerruf" },
        { label: dict.footer.blog, href: "/blog" },
        { label: dict.footer.helpFaq, href: "/#faq" },
      ],
    },
    {
      title: dict.footer.contactCol,
      links: [
        { label: "sickMotos-styles@freenet.de", href: "mailto:sickMotos-styles@freenet.de" },
        { label: "Obere Str. 18, 86554 Pöttmes", href: "https://maps.google.com/?q=Obere+Str.+18,+86554+P%C3%B6ttmes" },
        { label: dict.footer.hours, href: "#" },
        { label: "@sickmotos_official", href: "https://instagram.com/sickmotos_official" },
      ],
    },
  ];
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
              {dict.footer.engineeredIn}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <AskSickBot variant="icon" label={dict.bot.askSickBot} />
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
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-fg-dim">
                {c.title}
              </div>
              <ul className="flex flex-col gap-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-fg-muted transition-colors hover:text-fg"
                      {...(l.href.startsWith("http") && !l.href.includes("sick-motos.com")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {l.label}
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
