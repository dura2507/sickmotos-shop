import "server-only";
import { redis, safe } from "./redisSafe";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "sickmotos.myshopify.com";
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-07";
const ENV_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

// Ein neuer Offline-Token aus dem OAuth-Callback landet direkt in Redis und
// geht damit vor dem Env-Wert. So muss nach einer neuen Berechtigung niemand
// einen Token abschreiben und in Vercel einfuegen. Faellt Redis aus, gilt der
// Env-Wert weiter.
const TOKEN_KEY = "sm:shopify:admin-token:v1";
type StoredToken = { token: string; scope: string; at: string };
let cached: { at: number; token: string | null } | null = null;

async function storedToken(): Promise<string | null> {
  if (cached && Date.now() - cached.at < 5 * 60_000) return cached.token;
  const v = await safe<StoredToken | null>(
    "shopifyAdmin.token",
    async () => (redis ? await redis.get<StoredToken>(TOKEN_KEY) : null),
    null
  );
  const token = v && typeof v.token === "string" && v.token.length > 0 ? v.token : null;
  cached = { at: Date.now(), token };
  return token;
}

async function resolveToken(): Promise<string | null> {
  return (await storedToken()) ?? (ENV_TOKEN && ENV_TOKEN.length > 0 ? ENV_TOKEN : null);
}

export async function hasAdminToken(): Promise<boolean> {
  return (await resolveToken()) !== null;
}

export async function saveAdminToken(token: string, scope: string): Promise<boolean> {
  if (!redis) return false;
  // Bewusst nicht ueber safe(): dessen Log schreibt die Fehlermeldung mit, und
  // die darf den Token nie enthalten koennen.
  try {
    await redis.set(TOKEN_KEY, { token, scope, at: new Date().toISOString() });
  } catch {
    console.error("[shopifyAdmin] saving the admin token to Redis failed");
    return false;
  }
  cached = { at: Date.now(), token };
  return true;
}

export async function adminGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  revalidateSec = 60
): Promise<T> {
  const token = await resolveToken();
  if (!token) {
    throw new Error("SHOPIFY_ADMIN_API_TOKEN is not set");
  }
  const res = await fetch(
    `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: revalidateSec },
    }
  );
  if (!res.ok) {
    throw new Error(`Shopify Admin API ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (json.errors?.length) {
    throw new Error(`Shopify Admin GraphQL error: ${json.errors[0].message}`);
  }
  if (!json.data) throw new Error("Shopify Admin API returned no data");
  return json.data;
}
