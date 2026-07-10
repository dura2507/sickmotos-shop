import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidSession, SESSION_COOKIE_NAME } from "@/lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "sickmotos.myshopify.com";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !(await isValidSession(session, password))) {
    return NextResponse.redirect(new URL("/admin/login?from=/api/shopify/oauth/callback", req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const shop = url.searchParams.get("shop");
  if (!code) {
    return new NextResponse("Missing code parameter", { status: 400 });
  }
  if (shop && shop !== DOMAIN) {
    return new NextResponse(`Shop mismatch: got ${shop}, expected ${DOMAIN}`, { status: 400 });
  }

  const clientId = process.env.SHOPIFY_APP_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_APP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new NextResponse(
      "SHOPIFY_APP_CLIENT_ID or SHOPIFY_APP_CLIENT_SECRET missing in env",
      { status: 500 }
    );
  }

  const tokenRes = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    return new NextResponse(
      `Token exchange failed (${tokenRes.status}): ${body}`,
      { status: 502 }
    );
  }

  const json = (await tokenRes.json()) as {
    access_token?: string;
    scope?: string;
  };
  const token = json.access_token;
  if (!token) {
    return new NextResponse("No access_token in response", { status: 502 });
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Token</title>
<style>body{font-family:system-ui;background:#0a0a0a;color:#eee;padding:2rem;max-width:720px;margin:0 auto}
code{display:block;background:#1a1a1a;padding:1rem;border:1px solid #333;border-radius:6px;word-break:break-all;margin:1rem 0;font-size:12px}
h1{font-size:1.5rem}a{color:#e10600}</style></head>
<body><h1>Shopify Access Token</h1>
<p>Scope: <strong>${json.scope ?? "?"}</strong></p>
<p>Kopiere den Token, füge ihn in Vercel als <code>SHOPIFY_ADMIN_API_TOKEN</code> ein, dann Redeploy:</p>
<code id="t">${token}</code>
<p><a href="/admin/orders">→ zurück zu Bestellungen</a></p>
</body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
