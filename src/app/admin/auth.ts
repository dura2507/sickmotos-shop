import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

// Tiny password + signed cookie auth for the internal admin panel. Not a full
// user system — one shared password for Thomas + Leon, session cookie signed
// with an HMAC secret so it can't be forged from the client.
//
// Required env in production:
//   ADMIN_PASSWORD=<the shared secret>
//   ADMIN_SESSION_SECRET=<random 32+ char string used to sign cookies>

const PASSWORD_ENV = "ADMIN_PASSWORD";
const SECRET_ENV = "ADMIN_SESSION_SECRET";
const COOKIE = "sm_admin";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function safeEq(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function secret(): string {
  return (
    process.env[SECRET_ENV] ||
    // Fallback so local dev works even without the secret set. Predictable
    // signature is fine locally because there's no password in dev either.
    "dev-secret-not-for-prod"
  );
}

export function verifyAdminPassword(input: string): boolean {
  const target = process.env[PASSWORD_ENV];
  if (!target) return false;
  return safeEq(input, target);
}

export function createSession(): string {
  const exp = Date.now() + MAX_AGE_MS;
  const payload = `${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifySession(token: string): boolean {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  if (!safeEq(sig, expected)) return false;
  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return true;
}

export async function isLoggedIn(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return false;
  return verifySession(token);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isLoggedIn())) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
}
