import "server-only";
import { redis, safe } from "./redisSafe";

// Shopify hat bis zum Umzug der Storefront auf Vercel jeden Besucher gezaehlt.
// Seit dem 10.07.2026 sieht Shopify nur noch die Kasse, die Besucherzahlen ab
// dann kommen aus unserem eigenen Zaehler (analyticsStore). Damit Thomas vorher
// und nachher vergleichen kann, liegt der Shopify-Verlauf einmalig importiert in
// Redis. Exportiert aus Shopify Analytics (ShopifyQL, sessions, nur "human",
// pro Tag), die Monatssummen wurden gegen Shopifys eigene Monatstabelle geprueft.
//
// Bewusst NICHT im Repo: das Repository ist oeffentlich.

const KEY = "sm:shopify:daily:v1";

// Letzter Tag, an dem Shopify die ganze Storefront gesehen hat. Am 09.07. wurde
// mittags umgestellt, der Tag ist in beiden Quellen unvollstaendig.
export const SHOPIFY_LAST_FULL_DAY = "2026-07-08";
// Erster voller Tag des eigenen Besucher-Zaehlers.
export const COUNTER_FIRST_DAY = "2026-07-10";
// Tag der Umstellung, fuer die Markierung in den Diagrammen.
export const CUTOVER_DAY = "2026-07-09";

export type ShopifyDay = {
  visitors: number;
  sessions: number;
  cartSessions: number;
  checkoutSessions: number;
};

let cache: { at: number; data: Map<string, ShopifyDay> } | null = null;
const CACHE_MS = 10 * 60_000;

// undefined = Redis antwortet nicht, leere Map = noch nichts importiert.
export async function loadShopifyHistory(): Promise<Map<string, ShopifyDay> | undefined> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  const raw = await safe<Record<string, string> | null | undefined>(
    "shopifyHistory.load",
    () => redis!.hgetall<Record<string, string>>(KEY),
    undefined
  );
  if (raw === undefined) return undefined;
  const data = new Map<string, ShopifyDay>();
  for (const [date, value] of Object.entries(raw ?? {})) {
    const [v, s, c, k] = String(value).split(",").map((n) => Number(n));
    data.set(date, {
      visitors: v || 0,
      sessions: s || 0,
      cartSessions: c || 0,
      checkoutSessions: k || 0,
    });
  }
  cache = { at: Date.now(), data };
  return data;
}

export type ImportResult =
  | { ok: true; days: number; from: string; to: string }
  | { ok: false; error: string };

// Erwartet die CSV aus dem Export: date,visitors,sessions,cart_sessions,checkout_sessions.
// Ersetzt den kompletten Verlauf in einem Rutsch, nichts wird halb geschrieben.
export async function importShopifyHistory(csv: string): Promise<ImportResult> {
  if (!redis) return { ok: false, error: "Redis ist nicht konfiguriert." };
  const rows = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.toLowerCase().startsWith("date"));
  const fields: Record<string, string> = {};
  for (const row of rows) {
    const parts = row.split(/[,;\t]/).map((p) => p.trim());
    const [date, ...nums] = parts;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
      return { ok: false, error: `Zeile ohne gueltiges Datum: ${row.slice(0, 40)}` };
    }
    if (date > SHOPIFY_LAST_FULL_DAY) continue; // danach zaehlt Shopify nur die Kasse
    const values = nums.slice(0, 4).map((n) => Number(n.replace(/\./g, "")));
    if (values.length < 2 || values.some((n) => !Number.isFinite(n) || n < 0)) {
      return { ok: false, error: `Zeile mit ungueltigen Zahlen: ${row.slice(0, 40)}` };
    }
    while (values.length < 4) values.push(0);
    fields[date] = values.join(",");
  }
  const dates = Object.keys(fields).sort();
  if (dates.length === 0) return { ok: false, error: "Keine Tage gefunden." };

  const ok = await safe(
    "shopifyHistory.import",
    async () => {
      const tx = redis!.multi();
      tx.del(KEY);
      tx.hset(KEY, fields);
      await tx.exec();
      return true;
    },
    false
  );
  if (!ok) return { ok: false, error: "Redis hat nicht geantwortet, nichts gespeichert." };
  cache = null;
  return { ok: true, days: dates.length, from: dates[0], to: dates[dates.length - 1] };
}
