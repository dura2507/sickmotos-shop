import "server-only";
import type { Locale } from "./config";
import type { Dictionary } from "./types";

// Each entry is a dynamic import so a page only ships with the dict it uses.
export type { Dictionary };

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  de: () => import("./dictionaries/de.json").then((m) => m.default as Dictionary),
  en: () => import("./dictionaries/en.json").then((m) => m.default as Dictionary),
  it: () => import("./dictionaries/it.json").then((m) => m.default as Dictionary),
  es: () => import("./dictionaries/es.json").then((m) => m.default as Dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}
