import "server-only";
import { createHash } from "node:crypto";
import { redis, safe, storeStatus } from "./redisSafe";

// Lightweight self-hosted pageview counter, backed by Upstash Redis. One
// counter per (day, dimension) — no per-hit rows, so it stays cheap even at
// millions of pageviews. A daily-rotated session hash lets us count uniques
// without storing IPs or setting a cookie.

const KEY_VIEWS = (d: string) => `sm:vis:${d}:views`;
const KEY_VISITORS = (d: string) => `sm:vis:${d}:visitors`;
const KEY_PATHS = (d: string) => `sm:vis:${d}:paths`;
const KEY_COUNTRIES = (d: string) => `sm:vis:${d}:countries`;
const KEY_REFERRERS = (d: string) => `sm:vis:${d}:referrers`;
const KEY_LOCALES = (d: string) => `sm:vis:${d}:locales`;
// Tageswerte, die nach Tagesende aus den Hash-Sets festgeschrieben werden. Die
// Sets selbst (Hashes aus IP + Browser) laufen nach 90 Tagen ab, die Zahl bleibt.
const KEY_VCOUNT = (d: string) => `sm:vis:${d}:vcount`;
// Warenkorb und Kasse, gezaehlt wie Shopify: eindeutige Besucher pro Tag, die
// etwas in den Korb gelegt bzw. auf "Zur Kasse" geklickt haben.
const KEY_CART = (d: string) => `sm:fun:${d}:cart`;
const KEY_CCOUNT = (d: string) => `sm:fun:${d}:ccount`;
const KEY_CHECKOUT = (d: string) => `sm:fun:${d}:checkout`;
const KEY_KCOUNT = (d: string) => `sm:fun:${d}:kcount`;

// Nur noch die Hash-Sets laufen ab. Bis 03.11.2026 liefen ALLE Tageszaehler
// nach 90 Tagen ab, dadurch fehlen die Besucher vom 10.07. bis Anfang August.
const SET_TTL_SEC = 60 * 60 * 24 * 90;

// Erster voller Tag, fuer den Warenkorb und Kasse gezaehlt werden.
export const FUNNEL_FIRST_DAY = "2026-11-04";

// Bucket by the shop's timezone (Europe/Berlin), same as the sales report, so
// the session days line up 1:1 with the revenue days in the dashboard. Using
// UTC here shifted the first ~2h of every Berlin day into the wrong bucket.
function today(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

function addDays(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateKey(offsetDaysFromToday: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDaysFromToday);
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

// Salted, daily-rotating hash so the same visitor counts once per day per
// device without us storing anything that ties back to them tomorrow.
function sessionHash(ip: string, ua: string): string {
  const day = today();
  const salt = process.env.ANALYTICS_SESSION_SALT || "sm-vis";
  return createHash("sha256")
    .update(`${salt}:${day}:${ip}:${ua}`)
    .digest("hex")
    .slice(0, 24);
}

// The hosts we consider "internal" — anything from them counts as direct
// navigation, not a referrer.
const INTERNAL_HOSTS = new Set([
  "sickmotos.com",
  "www.sickmotos.com",
  "sickmotos.de",
  "www.sickmotos.de",
  "sick-motos.com",
  "www.sick-motos.com",
  "sickmotos-shop.vercel.app",
]);

function normalizeReferrer(raw: string | null): string {
  if (!raw) return "(direct)";
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (INTERNAL_HOSTS.has(host)) return "(direct)";
    return host;
  } catch {
    return "(direct)";
  }
}

function normalizePath(p: string): string {
  const noQuery = p.split("?")[0];
  if (noQuery === "" || noQuery === "/") return "/";
  return noQuery.length > 80 ? `${noQuery.slice(0, 77)}…` : noQuery;
}

// Crawlers, previewers and scripted clients that execute JS (or just POST the
// beacon) would otherwise inflate the visitor numbers. Skip the obvious ones.
const BOT_UA =
  /bot|crawl|spider|slurp|mediapartners|bingpreview|headless|lighthouse|phantom|puppeteer|playwright|pingdom|uptime|monitor|curl|wget|python-requests|go-http|java\/|okhttp|facebookexternalhit|embedly|whatsapp|telegrambot|preview|scrap/i;

// Schreibt die Tageszahl eines abgeschlossenen Tages fest, solange das Set noch
// existiert. Ein Kommando fuer alle drei Sets, idempotent.
const FINALIZE_SCRIPT = `
for i = 1, #KEYS, 2 do
  if redis.call('EXISTS', KEYS[i + 1]) == 0 then
    local n = redis.call('SCARD', KEYS[i])
    if n > 0 then redis.call('SET', KEYS[i + 1], n) end
  end
end
return 1`;

function finalizeKeys(d: string): string[] {
  return [
    KEY_VISITORS(d), KEY_VCOUNT(d),
    KEY_CART(d), KEY_CCOUNT(d),
    KEY_CHECKOUT(d), KEY_KCOUNT(d),
  ];
}

// Einmal pro Tag und Instanz: TTL auf das Set des Tages und die Zahl von
// gestern festschreiben. Upstash rechnet jedes Kommando einer Pipeline einzeln
// ab, deshalb nicht bei jedem Aufruf. NX verhindert, dass eine kalte Instanz
// den Ablauf nach hinten schiebt.
const dayStamped = new Set<string>();

function stampDay(pipe: ReturnType<NonNullable<typeof redis>["pipeline"]>, d: string, setKey: string) {
  const mark = `${d}:${setKey}`;
  if (dayStamped.has(mark)) return null;
  pipe.expire(setKey, SET_TTL_SEC, "NX");
  pipe.eval(FINALIZE_SCRIPT, finalizeKeys(addDays(d, -1)), []);
  return mark;
}

function rememberStamp(mark: string | null) {
  if (!mark) return;
  if (dayStamped.size > 12) dayStamped.clear(); // gestern ist Ballast
  dayStamped.add(mark);
}

export async function recordVisit(input: {
  path: string;
  ip: string | null;
  ua: string | null;
  country: string | null;
  referrer: string | null;
  locale: string | null;
}) {
  if (!redis) return;
  // Don't count bots/crawlers/scripted clients as real visitors.
  if (!input.ua || BOT_UA.test(input.ua)) return;
  const d = today();
  const path = normalizePath(input.path || "/");
  // Zwei Zeichen, das Feld kommt aus einem Request-Header und landet als
  // Hash-Feldname in einem Key, den topN spaeter komplett liest.
  const country = (input.country || "??").toUpperCase().slice(0, 2);
  const referrer = normalizeReferrer(input.referrer);
  const locale = (input.locale || "??").slice(0, 5).toLowerCase();
  const sh = sessionHash(input.ip || "", input.ua || "");

  const pipe = redis.pipeline();
  pipe.incr(KEY_VIEWS(d));
  pipe.sadd(KEY_VISITORS(d), sh);
  pipe.hincrby(KEY_PATHS(d), path, 1);
  pipe.hincrby(KEY_COUNTRIES(d), country, 1);
  pipe.hincrby(KEY_REFERRERS(d), referrer, 1);
  pipe.hincrby(KEY_LOCALES(d), locale, 1);
  const mark = stampDay(pipe, d, KEY_VISITORS(d));
  const ok = await safe(
    "analytics.recordVisit",
    async () => {
      await pipe.exec();
      return true;
    },
    false
  );
  // Den Stempel erst merken, wenn der Schreibvorgang wirklich lief.
  if (ok) rememberStamp(mark);
}

// Warenkorb ("cart", serverseitig in /api/cart) und Kasse ("checkout", Beacon
// beim Klick auf "Zur Kasse"). Gleicher Tages-Hash wie bei den Besuchern, also
// zaehlt jeder Besucher pro Tag hoechstens einmal, wie bei Shopify.
export async function recordFunnel(
  kind: "cart" | "checkout",
  input: { ip: string | null; ua: string | null }
) {
  if (!redis) return;
  if (!input.ua || BOT_UA.test(input.ua)) return;
  const d = today();
  const key = kind === "cart" ? KEY_CART(d) : KEY_CHECKOUT(d);
  const pipe = redis.pipeline();
  pipe.sadd(key, sessionHash(input.ip || "", input.ua || ""));
  const mark = stampDay(pipe, d, key);
  const ok = await safe(
    "analytics.recordFunnel",
    async () => {
      await pipe.exec();
      return true;
    },
    false
  );
  if (ok) rememberStamp(mark);
}

export type DailyBucket = { date: string; views: number; visitors: number };
export type TopRow = { key: string; views: number };

export type AnalyticsSnapshot = {
  totalViews7d: number;
  totalVisitors7d: number;
  totalViews30d: number;
  totalVisitors30d: number;
  perDay: DailyBucket[]; // 30d oldest→today
  topPaths: TopRow[];
  topCountries: TopRow[];
  topReferrers: TopRow[];
  topLocales: TopRow[];
  // Gesetzt, wenn Redis zwar konfiguriert ist, aber nicht antwortet. Die Seiten
  // zeigen dann Striche statt Nullen, eine Null wuerde behaupten es habe keine
  // Besucher gegeben.
  fetchError?: string;
};

const EMPTY_SNAPSHOT: AnalyticsSnapshot = {
  totalViews7d: 0,
  totalVisitors7d: 0,
  totalViews30d: 0,
  totalVisitors30d: 0,
  perDay: [],
  topPaths: [],
  topCountries: [],
  topReferrers: [],
  topLocales: [],
};

async function topN(days: string[], key: (d: string) => string, n: number): Promise<TopRow[]> {
  if (!redis) return [];
  const results = await Promise.all(days.map((d) => redis!.hgetall<Record<string, string>>(key(d))));
  const merged = new Map<string, number>();
  for (const map of results) {
    if (!map) continue;
    for (const [k, v] of Object.entries(map)) {
      merged.set(k, (merged.get(k) ?? 0) + Number(v || 0));
    }
  }
  return Array.from(merged.entries())
    .map(([k, v]) => ({ key: k, views: v }))
    .sort((a, b) => b.views - a.views)
    .slice(0, n);
}

// Ein MGET fuer die Aufrufe, eins fuer die festgeschriebenen Besucherzahlen.
// Nur Tage ohne festgeschriebene Zahl (heute, oder gestern vor dem ersten
// Treffer des Tages) brauchen noch ein SCARD auf das Set.
async function readCounts(
  days: string[],
  countKey: (d: string) => string,
  setKey: (d: string) => string
): Promise<number[]> {
  const counts = await redis!.mget<(number | string | null)[]>(days.map(countKey));
  const missing = days
    .map((d, i) => (counts?.[i] == null ? i : -1))
    .filter((i) => i >= 0);
  const scards = await Promise.all(missing.map((i) => redis!.scard(setKey(days[i]))));
  const out = days.map((_, i) => Number(counts?.[i] ?? 0));
  missing.forEach((i, j) => {
    out[i] = Number(scards[j] ?? 0);
  });
  return out;
}

async function readDailyBuckets(days: string[]): Promise<DailyBucket[]> {
  if (!redis || days.length === 0) {
    return days.map((date) => ({ date, views: 0, visitors: 0 }));
  }
  const [views, visitors] = await Promise.all([
    redis.mget<(number | null)[]>(days.map(KEY_VIEWS)),
    readCounts(days, KEY_VCOUNT, KEY_VISITORS),
  ]);
  return days.map((date, i) => ({
    date,
    views: Number(views?.[i] ?? 0),
    visitors: visitors[i] ?? 0,
  }));
}

// Einmalige Umstellung vom 03.11.2026: bis dahin liefen alle Tageszaehler nach
// 90 Tagen ab. Was noch da ist, wird dauerhaft gemacht und die Besucherzahl
// festgeschrieben. Rund 120 Tage x 6 Kommandos, laeuft genau einmal.
const PERSIST_FLAG = "sm:vis:persisted:v1";
let persistChecked = false;

async function ensurePersistentHistory(): Promise<void> {
  if (!redis || persistChecked) return;
  const done = await safe("analytics.persistFlag", () => redis!.get(PERSIST_FLAG), "error");
  if (done === "error") return; // Redis nicht erreichbar, beim naechsten Mal
  if (done) {
    persistChecked = true;
    return;
  }
  const yesterday = dateKey(-1);
  const days: string[] = [];
  for (let d = "2026-07-10"; d <= yesterday; d = addDays(d, 1)) days.push(d);
  const ok = await safe(
    "analytics.persistHistory",
    async () => {
      for (let i = 0; i < days.length; i += 30) {
        const pipe = redis!.pipeline();
        for (const d of days.slice(i, i + 30)) {
          pipe.persist(KEY_VIEWS(d));
          pipe.persist(KEY_PATHS(d));
          pipe.persist(KEY_COUNTRIES(d));
          pipe.persist(KEY_REFERRERS(d));
          pipe.persist(KEY_LOCALES(d));
          pipe.eval(FINALIZE_SCRIPT, finalizeKeys(d), []);
        }
        await pipe.exec();
      }
      await redis!.set(PERSIST_FLAG, new Date().toISOString());
      return true;
    },
    false
  );
  if (ok) persistChecked = true;
}

export type TrafficDay = {
  date: string;
  // null = fuer diesen Tag gibt es keine Daten aus dem eigenen Zaehler
  // (vor dem Start, abgelaufen oder Ausfall). Eine 0 waere gelogen.
  views: number | null;
  visitors: number | null;
  carts: number | null;
  checkouts: number | null;
};

// Tageswerte des eigenen Zaehlers fuer beliebige Tage. undefined, wenn Redis
// konfiguriert ist, aber nicht antwortet.
export async function loadDailyTraffic(days: string[]): Promise<TrafficDay[] | undefined> {
  const empty = days.map((date) => ({ date, views: null, visitors: null, carts: null, checkouts: null }));
  if (!redis || days.length === 0) return empty;
  await ensurePersistentHistory();
  const funnelDays = days.filter((d) => d >= FUNNEL_FIRST_DAY);
  const result = await safe(
    "analytics.loadDailyTraffic",
    async () => {
      const [buckets, carts, checkouts] = await Promise.all([
        readDailyBuckets(days),
        funnelDays.length ? readCounts(funnelDays, KEY_CCOUNT, KEY_CART) : Promise.resolve([]),
        funnelDays.length ? readCounts(funnelDays, KEY_KCOUNT, KEY_CHECKOUT) : Promise.resolve([]),
      ]);
      const funnel = new Map(funnelDays.map((d, i) => [d, [carts[i] ?? 0, checkouts[i] ?? 0]]));
      return buckets.map((b): TrafficDay => {
        // Ein Shop-Tag ohne einen einzigen Aufruf heisst: keine Daten.
        const has = b.views > 0;
        const f = funnel.get(b.date);
        return {
          date: b.date,
          views: has ? b.views : null,
          visitors: has ? b.visitors : null,
          carts: has && f ? f[0] : null,
          checkouts: has && f ? f[1] : null,
        };
      });
    },
    undefined
  );
  return result;
}

// /admin und /admin/visitors rendern das bei jedem Request neu und beide sind
// force-dynamic. Ohne Cache kostete jedes Neuladen ueber hundert Kommandos.
const SNAPSHOT_TTL_MS = 60_000;
let snapshot: { at: number; data: AnalyticsSnapshot } | null = null;

export async function loadAnalytics(): Promise<AnalyticsSnapshot> {
  if (!redis) return EMPTY_SNAPSHOT;
  if (snapshot && Date.now() - snapshot.at < SNAPSHOT_TTL_MS) return snapshot.data;

  const days30: string[] = [];
  for (let i = 29; i >= 0; i--) days30.push(dateKey(-i));
  const days7 = days30.slice(-7);

  // Als Ganzes abgesichert, nicht pro Lesevorgang: ein halb gefuellter
  // Schnappschuss ist schlimmer als gar keiner, er sieht aus wie ein Einbruch.
  const data = await safe<AnalyticsSnapshot | null>(
    "analytics.loadAnalytics",
    async () => {
      const perDay = await readDailyBuckets(days30);
      const [topPaths, topCountries, topReferrers, topLocales] = await Promise.all([
        topN(days30, KEY_PATHS, 10),
        topN(days30, KEY_COUNTRIES, 10),
        topN(days30, KEY_REFERRERS, 10),
        topN(days7, KEY_LOCALES, 6),
      ]);
      return {
        totalViews7d: perDay.slice(-7).reduce((s, d) => s + d.views, 0),
        totalVisitors7d: perDay.slice(-7).reduce((s, d) => s + d.visitors, 0),
        totalViews30d: perDay.reduce((s, d) => s + d.views, 0),
        totalVisitors30d: perDay.reduce((s, d) => s + d.visitors, 0),
        perDay,
        topPaths,
        topCountries,
        topReferrers,
        topLocales,
      };
    },
    null
  );

  // Einen Fehlschlag nie cachen, der naechste Request muss es neu versuchen.
  if (!data) {
    return { ...EMPTY_SNAPSHOT, fetchError: storeStatus().error ?? "unbekannt" };
  }
  snapshot = { at: Date.now(), data };
  return data;
}

const COUNTRY_FLAGS: Record<string, string> = {
  DE: "🇩🇪", AT: "🇦🇹", CH: "🇨🇭", IT: "🇮🇹", ES: "🇪🇸",
  HR: "🇭🇷", FR: "🇫🇷", PL: "🇵🇱", GB: "🇬🇧", US: "🇺🇸",
  NL: "🇳🇱", BE: "🇧🇪", LU: "🇱🇺", SI: "🇸🇮", CZ: "🇨🇿",
  SK: "🇸🇰", HU: "🇭🇺", PT: "🇵🇹", DK: "🇩🇰", SE: "🇸🇪",
  NO: "🇳🇴", FI: "🇫🇮", RO: "🇷🇴",
};

export function countryLabel(code: string): string {
  const upper = code.toUpperCase();
  if (upper === "??") return "Unbekannt";
  const flag = COUNTRY_FLAGS[upper];
  return flag ? `${flag} ${upper}` : upper;
}

export function isPersistent(): boolean {
  return !!redis;
}
