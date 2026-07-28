import "server-only";
import { Redis } from "@upstash/redis";

// One Redis client for the whole app, plus the guard rail around it. Upstash
// throws on every single command once the monthly command quota is used up, so
// an unguarded read takes down whatever page awaited it. That is exactly what
// happened on 2026-07-28: /admin answered with a server error because the
// pageview counter had burned the 500k free-tier commands. Nothing we keep in
// Redis is worth a 500, analytics and chat logs are nice to have, the admin has
// to stay reachable.

let client: Redis | null = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    client = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
} catch {
  client = null;
}

export const redis = client;

// Last command error, cleared on the next success. Lives per lambda instance,
// so it is only good enough for the message we display. Never branch on it, the
// readers return their own sentinel for that.
let lastError: string | null = null;
let loggedAt = 0;
const LOG_EVERY_MS = 60_000;

export function storeStatus(): { configured: boolean; error: string | null } {
  return { configured: !!client, error: lastError };
}

// Run a Redis operation and never throw. A dead Redis would otherwise write one
// log line per pageview, so failures are logged at most once a minute per
// instance. The caller decides what "no data" looks like via fallback.
export async function safe<T>(
  label: string,
  op: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!client) return fallback;
  try {
    const result = await op();
    lastError = null;
    return result;
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    const now = Date.now();
    if (now - loggedAt > LOG_EVERY_MS) {
      loggedAt = now;
      console.error(`[redis] ${label} failed:`, lastError);
    }
    return fallback;
  }
}
