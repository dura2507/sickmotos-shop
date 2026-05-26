// OAuth callback. Shopify sends us back here with ?code=...&state=...
// We verify state, exchange code+verifier for tokens, set the session
// cookies, then bounce the user to whatever /account page they asked
// for (encoded in the state suffix).

import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/customerAccount";
import {
  clearSessionCookies,
  readPkceCookie,
  setSessionCookies,
} from "@/lib/customerSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bail(message: string) {
  const url = new URL(`/account/login-failed`, "http://placeholder");
  url.searchParams.set("reason", message);
  return NextResponse.redirect(url.toString().replace("http://placeholder", ""));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) return bail(error);
  if (!code || !state) return bail("missing_params");

  const stash = await readPkceCookie();
  if (!stash) return bail("no_pkce_cookie");
  if (stash.s !== state) return bail("state_mismatch");

  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const redirectUri = `${origin}/account/callback`;

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier: stash.v,
      redirectUri,
    });
    await setSessionCookies(tokens);
  } catch (e) {
    await clearSessionCookies();
    return bail(`exchange_failed: ${(e as Error).message}`);
  }

  // Pull returnTo back out of state
  let returnTo = "/account";
  const dot = state.indexOf(".");
  if (dot > 0) {
    try {
      returnTo = Buffer.from(state.slice(dot + 1), "base64url").toString("utf8") || returnTo;
      // Defensive: only allow same-origin relative paths.
      if (!returnTo.startsWith("/")) returnTo = "/account";
    } catch {
      // keep default
    }
  }
  return NextResponse.redirect(new URL(returnTo, origin).toString());
}
