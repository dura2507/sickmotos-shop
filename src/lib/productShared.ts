// Catalog constants and formatters that client components need WITHOUT the
// product data. src/lib/products.ts imports the full products.json (about
// 3.9 MB) at module level, so any value import from it inside a "use client"
// file drags the entire catalog into the browser bundle (measured: a 3 MB
// chunk on /shop) and into a second server copy. Keep this module free of
// data imports; products.ts re-exports these names for server code.

export const CATEGORIES = [
  "Exhaust",
  "LED Headlights",
  "Carbon Parts",
  "ECU Tuning",
  "Brakes",
  "Graphics",
  "Titanium Screws",
  "Merchandise",
  "Wheels",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

const EUR = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});
export const fmtEUR = (n: number) => EUR.format(n);
