// Logout. Revokes the Storefront customer access token (best-effort),
// clears our session cookie, and sends the user home. Everything stays
// on our domain - no Shopify redirect.

import { NextResponse } from "next/server";
import {
  clearCustomerToken,
  customerLogout,
  getCustomerToken,
} from "@/lib/customerStorefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const token = await getCustomerToken();
  if (token) await customerLogout(token);
  await clearCustomerToken();
  return NextResponse.redirect(new URL("/", origin).toString(), {
    status: 302,
  });
}
