// Supported locales for the SickMotos storefront. Order = display order in the
// switcher. First entry is the fallback when nothing else matches. Phase-1
// languages Thomas asked for; Phase-2 (PL/CZ/SL/HR) plugs in the same way.
export const LOCALES = ["de", "en", "it", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

import type { FlagCode } from "@/app/_components/Flag";

export const LOCALE_LABELS: Record<Locale, { short: string; name: string; flag: FlagCode }> = {
  de: { short: "DE", name: "Deutsch", flag: "DE" },
  en: { short: "EN", name: "English", flag: "GB" },
  it: { short: "IT", name: "Italiano", flag: "IT" },
  es: { short: "ES", name: "Español", flag: "ES" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Best-effort match of an Accept-Language header against our supported set.
// Ignores region tags (en-US → en, de-AT → de). Falls back to the default.
export function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const parsed = acceptLanguage
    .split(",")
    .map((p) => {
      const [tag, q] = p.trim().split(";q=");
      return { tag: tag.toLowerCase().slice(0, 2), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const p of parsed) {
    if (isLocale(p.tag)) return p.tag;
  }
  return DEFAULT_LOCALE;
}

export const LOCALE_COOKIE = "sm_lang";
