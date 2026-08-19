import "server-only";
import { redis, safe } from "@/lib/redisSafe";

// Return requests submitted through /returns. Thomas' inbox was flooded with
// unstructured return mails, so the form is the only channel: complete data or
// nothing gets sent. Requests live in Redis and are worked off in
// /admin/returns; the customer gets the return address by email per case.

export type ReturnRequest = {
  id: string;
  ts: number;
  orderNumber: string;
  name: string;
  email: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  reason: string;
  locale: string | null;
  status: "open" | "done";
};

const INDEX = "sm:returns:index";
const itemKey = (id: string) => `sm:returns:item:${id}`;
const TTL_SEC = 60 * 60 * 24 * 180;

// True only when the request is actually persisted. The API turns false into
// a 503 so the customer retries instead of the request silently vanishing.
export async function saveReturnRequest(r: ReturnRequest): Promise<boolean> {
  if (!redis) return false;
  return safe(
    "returns.save",
    async () => {
      await redis!.set(itemKey(r.id), JSON.stringify(r), { ex: TTL_SEC });
      await redis!.lpush(INDEX, r.id);
      await redis!.ltrim(INDEX, 0, 499);
      return true;
    },
    false
  );
}

// undefined = the store did not answer (same convention as adminStore); an
// empty array would claim there are no requests.
export async function listReturnRequests(
  limit = 200
): Promise<ReturnRequest[] | undefined> {
  if (!redis) return undefined;
  return safe<ReturnRequest[] | undefined>(
    "returns.list",
    async () => {
      const ids = await redis!.lrange(INDEX, 0, limit - 1);
      if (ids.length === 0) return [];
      const raw = await redis!.mget<(string | ReturnRequest | null)[]>(
        ...ids.map(itemKey)
      );
      return raw
        .filter((x): x is string | ReturnRequest => Boolean(x))
        .map((x) => (typeof x === "string" ? JSON.parse(x) : x));
    },
    undefined
  );
}

export async function setReturnStatus(
  id: string,
  status: "open" | "done"
): Promise<boolean> {
  if (!redis) return false;
  return safe(
    "returns.status",
    async () => {
      const raw = await redis!.get<string | ReturnRequest | null>(itemKey(id));
      if (!raw) return false;
      const item: ReturnRequest =
        typeof raw === "string" ? JSON.parse(raw) : raw;
      item.status = status;
      const ttl = await redis!.ttl(itemKey(id));
      await redis!.set(itemKey(id), JSON.stringify(item), {
        ex: ttl > 0 ? ttl : TTL_SEC,
      });
      return true;
    },
    false
  );
}

// Max 5 submissions per IP per hour. Fails open: a dead Redis must not block
// customers, the junk protection then falls back to honeypot + validation.
export async function returnRateLimited(ip: string): Promise<boolean> {
  if (!redis || !ip) return false;
  return safe(
    "returns.rl",
    async () => {
      const key = `sm:returns:rl:${ip}`;
      const n = await redis!.incr(key);
      if (n === 1) await redis!.expire(key, 3600);
      return n > 5;
    },
    false
  );
}
