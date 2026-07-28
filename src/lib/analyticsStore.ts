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

const HIT_TTL_SEC = 60 * 60 * 24 * 90; // keep raw counters 90 days

// Bucket by the shop's timezone (Europe/Berlin), same as the sales report, so
// the session days line up 1:1 with the revenue days in the dashboard. Using
// UTC here shifted the first ~2h of every Berlin day into the wrong bucket.
function today(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
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

// A day's keys only need a TTL once. Upstash bills every command inside a
// pipeline separately, so re-stamping six expires on every hit doubled the
// price of a pageview for nothing. The set lives per lambda instance, a cold
// one stamps once more, and NX keeps that from sliding the expiry forward.
// Folge davon: die 90 Tage laufen ab dem ersten Treffer des Tages, nicht ab
// dem letzten.
const ttlStamped = new Set<string>();

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
  const stampTtl = !ttlStamped.has(d);
  if (stampTtl) {
    pipe.expire(KEY_VIEWS(d), HIT_TTL_SEC, "NX");
    pipe.expire(KEY_VISITORS(d), HIT_TTL_SEC, "NX");
    pipe.expire(KEY_PATHS(d), HIT_TTL_SEC, "NX");
    pipe.expire(KEY_COUNTRIES(d), HIT_TTL_SEC, "NX");
    pipe.expire(KEY_REFERRERS(d), HIT_TTL_SEC, "NX");
    pipe.expire(KEY_LOCALES(d), HIT_TTL_SEC, "NX");
  }
  const ok = await safe(
    "analytics.recordVisit",
    async () => {
      await pipe.exec();
      return true;
    },
    false
  );
  // Den TTL erst als gesetzt merken, wenn der Schreibvorgang wirklich lief.
  if (ok && stampTtl) {
    if (ttlStamped.size > 2) ttlStamped.clear(); // gestern ist Ballast
    ttlStamped.add(d);
  }
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

// Die Aufrufe eines ganzen Fensters kommen mit einem MGET zurueck. Die
// eindeutigen Besucher brauchen weiter ein SCARD pro Tag, fuer Sets gibt es
// kein Sammelkommando.
async function readDailyBuckets(days: string[]): Promise<DailyBucket[]> {
  if (!redis || days.length === 0) {
    return days.map((date) => ({ date, views: 0, visitors: 0 }));
  }
  const [views, visitors] = await Promise.all([
    redis.mget<(number | null)[]>(days.map(KEY_VIEWS)),
    Promise.all(days.map((d) => redis!.scard(KEY_VISITORS(d)))),
  ]);
  return days.map((date, i) => ({
    date,
    views: Number(views?.[i] ?? 0),
    visitors: Number(visitors[i] ?? 0),
  }));
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

export type SessionsComparison = {
  perDay: DailyBucket[]; // current window, oldest→newest
  prevPerDay: DailyBucket[]; // previous window, same length, index-aligned
  views: number;
  visitors: number;
  prevViews: number;
  prevVisitors: number;
  persistent: boolean;
  // True only when the whole previous window has real data. False when it
  // reaches back before the counter started (some days are zero because we
  // weren't tracking yet), which would otherwise produce a misleading
  // "+280%"-style delta against an artificially low baseline.
  prevComplete: boolean;
  // Wie bei AnalyticsSnapshot: Redis konfiguriert, aber keine Antwort.
  fetchError?: string;
};

// Sessions (views + unique visitors) for an explicit list of days, plus the
// same for the previous comparison window. Reads exactly the days the sales
// report uses so the two line up in the dashboard.
export async function loadSessionsForDays(
  currentDays: string[],
  prevDays: string[]
): Promise<SessionsComparison> {
  if (!redis) {
    return {
      perDay: currentDays.map((date) => ({ date, views: 0, visitors: 0 })),
      prevPerDay: prevDays.map((date) => ({ date, views: 0, visitors: 0 })),
      views: 0,
      visitors: 0,
      prevViews: 0,
      prevVisitors: 0,
      persistent: false,
      prevComplete: false,
    };
  }

  const both = await safe<DailyBucket[] | null>(
    "analytics.loadSessionsForDays",
    // Beide Fenster in einem Rutsch, so kostet ein 30-Tage-Bereich ein MGET
    // statt zwei.
    () => readDailyBuckets([...currentDays, ...prevDays]),
    null
  );
  if (!both) {
    return {
      perDay: currentDays.map((date) => ({ date, views: 0, visitors: 0 })),
      prevPerDay: prevDays.map((date) => ({ date, views: 0, visitors: 0 })),
      views: 0,
      visitors: 0,
      prevViews: 0,
      prevVisitors: 0,
      persistent: true,
      prevComplete: false,
      fetchError: storeStatus().error ?? "unbekannt",
    };
  }
  const cur = both.slice(0, currentDays.length);
  const prev = both.slice(currentDays.length);
  // A live shop has views every day; a zero-view day in the previous window
  // means we weren't tracking yet, so the comparison baseline is incomplete.
  const prevComplete = prev.length > 0 && prev.every((d) => d.views > 0);
  return {
    perDay: cur,
    prevPerDay: prev,
    views: cur.reduce((s, d) => s + d.views, 0),
    visitors: cur.reduce((s, d) => s + d.visitors, 0),
    prevViews: prev.reduce((s, d) => s + d.views, 0),
    prevVisitors: prev.reduce((s, d) => s + d.visitors, 0),
    persistent: true,
    prevComplete,
  };
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
