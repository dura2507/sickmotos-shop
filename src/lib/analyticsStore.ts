import "server-only";
import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

// Lightweight self-hosted pageview counter, backed by Upstash Redis. One
// counter per (day, dimension) — no per-hit rows, so it stays cheap even at
// millions of pageviews. A daily-rotated session hash lets us count uniques
// without storing IPs or setting a cookie.

let redis: Redis | null = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
} catch {
  redis = null;
}

const KEY_VIEWS = (d: string) => `sm:vis:${d}:views`;
const KEY_VISITORS = (d: string) => `sm:vis:${d}:visitors`;
const KEY_PATHS = (d: string) => `sm:vis:${d}:paths`;
const KEY_COUNTRIES = (d: string) => `sm:vis:${d}:countries`;
const KEY_REFERRERS = (d: string) => `sm:vis:${d}:referrers`;
const KEY_LOCALES = (d: string) => `sm:vis:${d}:locales`;

const HIT_TTL_SEC = 60 * 60 * 24 * 90; // keep raw counters 90 days

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateKey(offsetDaysFromToday: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDaysFromToday);
  return d.toISOString().slice(0, 10);
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

export async function recordVisit(input: {
  path: string;
  ip: string | null;
  ua: string | null;
  country: string | null;
  referrer: string | null;
  locale: string | null;
}) {
  if (!redis) return;
  const d = today();
  const path = normalizePath(input.path || "/");
  const country = (input.country || "??").toUpperCase();
  const referrer = normalizeReferrer(input.referrer);
  const locale = (input.locale || "??").slice(0, 5).toLowerCase();
  const sh = sessionHash(input.ip || "", input.ua || "");

  const pipe = redis.pipeline();
  pipe.incr(KEY_VIEWS(d));
  pipe.expire(KEY_VIEWS(d), HIT_TTL_SEC);
  pipe.sadd(KEY_VISITORS(d), sh);
  pipe.expire(KEY_VISITORS(d), HIT_TTL_SEC);
  pipe.hincrby(KEY_PATHS(d), path, 1);
  pipe.expire(KEY_PATHS(d), HIT_TTL_SEC);
  pipe.hincrby(KEY_COUNTRIES(d), country, 1);
  pipe.expire(KEY_COUNTRIES(d), HIT_TTL_SEC);
  pipe.hincrby(KEY_REFERRERS(d), referrer, 1);
  pipe.expire(KEY_REFERRERS(d), HIT_TTL_SEC);
  pipe.hincrby(KEY_LOCALES(d), locale, 1);
  pipe.expire(KEY_LOCALES(d), HIT_TTL_SEC);
  await pipe.exec();
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

export async function loadAnalytics(): Promise<AnalyticsSnapshot> {
  if (!redis) return EMPTY_SNAPSHOT;

  const days30: string[] = [];
  for (let i = 29; i >= 0; i--) days30.push(dateKey(-i));
  const days7 = days30.slice(-7);

  const [viewsRaw, visitorsRaw] = await Promise.all([
    Promise.all(days30.map((d) => redis!.get<number>(KEY_VIEWS(d)))),
    Promise.all(days30.map((d) => redis!.scard(KEY_VISITORS(d)))),
  ]);
  const perDay: DailyBucket[] = days30.map((d, i) => ({
    date: d,
    views: Number(viewsRaw[i] ?? 0),
    visitors: Number(visitorsRaw[i] ?? 0),
  }));

  const totalViews7d = perDay.slice(-7).reduce((s, d) => s + d.views, 0);
  const totalVisitors7d = perDay.slice(-7).reduce((s, d) => s + d.visitors, 0);
  const totalViews30d = perDay.reduce((s, d) => s + d.views, 0);
  const totalVisitors30d = perDay.reduce((s, d) => s + d.visitors, 0);

  const [topPaths, topCountries, topReferrers, topLocales] = await Promise.all([
    topN(days30, KEY_PATHS, 10),
    topN(days30, KEY_COUNTRIES, 10),
    topN(days30, KEY_REFERRERS, 10),
    topN(days7, KEY_LOCALES, 6),
  ]);

  return {
    totalViews7d,
    totalVisitors7d,
    totalViews30d,
    totalVisitors30d,
    perDay,
    topPaths,
    topCountries,
    topReferrers,
    topLocales,
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
