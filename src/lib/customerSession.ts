// Session cookie helpers for the headless Customer Account flow. Three
// cookies are involved:
//  - sm_caa_at  access token (httpOnly, ~60min)
//  - sm_caa_rt  refresh token (httpOnly, longer)
//  - sm_caa_id  optional id_token (httpOnly) needed for Shopify logout
// Plus a short-lived PKCE state cookie during login:
//  - sm_caa_pk  JSON-encoded { v: codeVerifier, s: state } httpOnly,
//               cleared in the callback handler

import { cookies } from "next/headers";
import { refreshTokens, type TokenResponse } from "./customerAccount";

export const COOKIE = {
  access: "sm_caa_at",
  refresh: "sm_caa_rt",
  id: "sm_caa_id",
  pkce: "sm_caa_pk",
} as const;

const SECURE = process.env.NODE_ENV === "production";

export async function setSessionCookies(t: TokenResponse): Promise<void> {
  const jar = await cookies();
  // expires_in is seconds from now. Give the cookie ~95% of that so we
  // refresh before Shopify rejects.
  const accessMaxAge = Math.max(60, Math.floor(t.expires_in * 0.95));
  jar.set(COOKIE.access, t.access_token, {
    httpOnly: true,
    secure: SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });
  jar.set(COOKIE.refresh, t.refresh_token, {
    httpOnly: true,
    secure: SECURE,
    sameSite: "lax",
    path: "/",
    // Customer Account refresh tokens are long-lived; cap at 90 days so
    // a stale device can re-auth gracefully.
    maxAge: 60 * 60 * 24 * 90,
  });
  if (t.id_token) {
    jar.set(COOKIE.id, t.id_token, {
      httpOnly: true,
      secure: SECURE,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  for (const name of [COOKIE.access, COOKIE.refresh, COOKIE.id, COOKIE.pkce]) {
    jar.set(name, "", { path: "/", maxAge: 0 });
  }
}

// Returns the current access token, refreshing transparently if needed.
// Returns null when the user isn't logged in.
export async function getValidAccessToken(): Promise<string | null> {
  const jar = await cookies();
  const access = jar.get(COOKIE.access)?.value;
  if (access) return access;
  const refresh = jar.get(COOKIE.refresh)?.value;
  if (!refresh) return null;
  try {
    const fresh = await refreshTokens(refresh);
    await setSessionCookies(fresh);
    return fresh.access_token;
  } catch {
    await clearSessionCookies();
    return null;
  }
}

export async function setPkceCookie(value: { v: string; s: string }): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE.pkce, JSON.stringify(value), {
    httpOnly: true,
    secure: SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 min to complete the auth round-trip
  });
}

export async function readPkceCookie(): Promise<{ v: string; s: string } | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE.pkce)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { v: string; s: string };
  } catch {
    return null;
  }
}

export async function getIdToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE.id)?.value ?? null;
}
