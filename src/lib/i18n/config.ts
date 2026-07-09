// Supported UI locales for the SickMotos shop. Order here is the order
// shown in the language switcher. First entry is the default fallback.
export const LOCALES = ["de", "en", "it", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  de: { short: "DE", name: "Deutsch" },
  en: { short: "EN", name: "English" },
  it: { short: "IT", name: "Italiano" },
  es: { short: "ES", name: "Español" },
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
