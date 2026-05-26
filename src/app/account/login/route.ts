// Initiates the Customer Account OAuth flow. Generates a PKCE
// code_verifier + state, stashes them in a short-lived httpOnly cookie,
// then redirects the user to Shopify's hosted authorization screen.
// After they sign in (email + code), Shopify bounces back to
// /account/callback.

import { NextResponse } from "next/server";
import {
  CUSTOMER_ACCOUNT,
  codeChallengeFromVerifier,
  makeCodeVerifier,
  makeRandomState,
} from "@/lib/customerAccount";
import { setPkceCookie } from "@/lib/customerSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const redirectUri = `${origin}/account/callback`;
  const returnTo = url.searchParams.get("returnTo") || "/account";

  const verifier = makeCodeVerifier();
  const challenge = codeChallengeFromVerifier(verifier);
  const state = `${makeRandomState()}.${Buffer.from(returnTo).toString("base64url")}`;

  await setPkceCookie({ v: verifier, s: state });

  const auth = new URL(CUSTOMER_ACCOUNT.authUrl);
  auth.searchParams.set("client_id", CUSTOMER_ACCOUNT.clientId);
  auth.searchParams.set("scope", CUSTOMER_ACCOUNT.scopes);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("state", state);
  auth.searchParams.set("code_challenge", challenge);
  auth.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(auth.toString(), { status: 302 });
}
