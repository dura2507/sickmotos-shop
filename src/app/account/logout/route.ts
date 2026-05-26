// Local + Shopify logout. Clears our session cookies, then sends the
// user through Shopify's logout endpoint so the OAuth session ends
// there too. Shopify will redirect back to our home.

import { NextResponse } from "next/server";
import { CUSTOMER_ACCOUNT } from "@/lib/customerAccount";
import { clearSessionCookies, getIdToken } from "@/lib/customerSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const idToken = await getIdToken();
  await clearSessionCookies();

  const target = new URL(CUSTOMER_ACCOUNT.logoutUrl);
  if (idToken) target.searchParams.set("id_token_hint", idToken);
  target.searchParams.set("post_logout_redirect_uri", origin);
  return NextResponse.redirect(target.toString(), { status: 302 });
}
