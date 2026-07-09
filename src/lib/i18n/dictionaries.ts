import "server-only";
import type { Locale } from "./config";

// Each entry is a dynamic import so a page only ships with the dict it uses.
// The default (German) dict is the source of truth for the type shape; TS
// then narrows missing keys in every other locale at compile time.

import type deDict from "./dictionaries/de.json";
export type Dictionary = typeof deDict;

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  de: () => import("./dictionaries/de.json").then((m) => m.default as Dictionary),
  en: () => import("./dictionaries/en.json").then((m) => m.default as Dictionary),
  it: () => import("./dictionaries/it.json").then((m) => m.default as Dictionary),
  es: () => import("./dictionaries/es.json").then((m) => m.default as Dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}
