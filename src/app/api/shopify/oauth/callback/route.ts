import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidSession, SESSION_COOKIE_NAME } from "@/lib/adminSession";
import { saveAdminToken } from "@/lib/shopifyAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "sickmotos.myshopify.com";
const DEFAULT_CLIENT_ID = "51a9ceb44494acf6e7b089159c311a21";

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

  const clientId = process.env.SHOPIFY_APP_CLIENT_ID ?? DEFAULT_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_APP_CLIENT_SECRET;
  if (!clientSecret) {
    const present = Object.keys(process.env)
      .filter((k) => k.startsWith("SHOPIFY"))
      .sort()
      .join(", ");
    return new NextResponse(
      `SHOPIFY_APP_CLIENT_SECRET missing in env. Present SHOPIFY_* vars the app sees: ${present || "(none)"}`,
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

  // Der Token wird direkt gespeichert und nie angezeigt, damit ihn niemand
  // kopieren oder abschreiben muss. Fehlt Redis, bitte erneut autorisieren.
  const saved = await saveAdminToken(token, json.scope ?? "");
  const scope = (json.scope ?? "?").replace(/[<>&"]/g, "");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Shopify verbunden</title>
<style>body{font-family:system-ui;background:#0a0a0a;color:#eee;padding:2rem;max-width:720px;margin:0 auto}
h1{font-size:1.5rem}a{color:#e10600}.bad{color:#e10600}</style></head>
<body><h1>${saved ? "Shopify-Verbindung erneuert" : "Speichern fehlgeschlagen"}</h1>
<p>Berechtigungen: <strong>${scope}</strong></p>
${
  saved
    ? "<p>Der neue Schlüssel ist gespeichert und wird ab sofort benutzt. Kein Kopieren, kein Redeploy nötig.</p>"
    : '<p class="bad">Die Datenbank hat nicht geantwortet. Bitte die Autorisierung in ein paar Minuten wiederholen.</p>'
}
<p><a href="/admin/dashboard">→ zu Analytics</a></p>
</body></html>`;

  return new NextResponse(html, {
    status: saved ? 200 : 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
