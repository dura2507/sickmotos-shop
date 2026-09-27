#!/usr/bin/env node
// Prueft fuer eine oder mehrere URLs, was Google im <head> sieht:
// Canonical, robots-Meta, Anzahl der hreflang-Links, ob das JS-Redirect-Snippet
// auf sickmotos.com drin ist und welches Shopify-Theme geantwortet hat.
//
// Aufruf:
//   node scripts/check-shopify-canonical.mjs <url> [<url> ...]
//
// Beispiele:
//   node scripts/check-shopify-canonical.mjs https://checkout.sickmotos.com/products/h4-adapter-montagehilfe
//   node scripts/check-shopify-canonical.mjs "https://<token>-<shopid>.shopifypreview.com/de/products/h4-adapter-montagehilfe"
//
// Shopify-Vorschau: ?preview_theme_id=... antwortet mit 302 auf denselben Pfad
// ohne Parameter und setzt Cookies (gemessen 27.09.2026 auf checkout.sickmotos.com,
// Cookie _shopify_essential). Deshalb haelt das Skript ein eigenes Cookie-Glas
// ueber alle Weiterleitungen, sonst wuerde man immer das Live-Theme sehen.
//
// Browser-User-Agent, weil Shopify-Kontodomains auf Standard-curl mit 406 antworten.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const MAX_HOPS = 10;

const urls = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (urls.length === 0) {
  console.error("Aufruf: node scripts/check-shopify-canonical.mjs <url> [<url> ...]");
  process.exit(2);
}

// Cookie-Glas: Host -> (Name -> Wert). Pfad und Ablauf werden bewusst ignoriert,
// es geht nur darum, die Vorschau-Auswahl ueber die Redirect-Kette zu tragen.
const jar = new Map();

function rememberCookies(res, host) {
  const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  if (setCookies.length === 0) return;
  const bag = jar.get(host) ?? new Map();
  for (const line of setCookies) {
    const first = line.split(";")[0];
    const eq = first.indexOf("=");
    if (eq <= 0) continue;
    bag.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim());
  }
  jar.set(host, bag);
}

function cookieHeader(host) {
  const bag = jar.get(host);
  if (!bag || bag.size === 0) return "";
  return [...bag.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function fetchFollowing(startUrl) {
  let url = startUrl;
  const hops = [];
  for (let i = 0; i < MAX_HOPS; i++) {
    const host = new URL(url).host;
    const headers = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" };
    const cookie = cookieHeader(host);
    if (cookie) headers.Cookie = cookie;
    const res = await fetch(url, { headers, redirect: "manual" });
    rememberCookies(res, host);
    hops.push(`${res.status} ${url}`);
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      url = new URL(loc, url).toString();
      continue;
    }
    return { finalUrl: url, status: res.status, html: await res.text(), hops };
  }
  throw new Error(`mehr als ${MAX_HOPS} Weiterleitungen ab ${startUrl}`);
}

function attrsOf(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return out;
}

function analyse(html) {
  const tags = html.match(/<(?:link|meta)\b[^>]*>/gi) ?? [];
  const canonicals = [];
  const robots = [];
  const hreflang = [];
  for (const tag of tags) {
    const a = attrsOf(tag);
    const isLink = /^<link/i.test(tag);
    const rel = (a.rel ?? "").toLowerCase();
    if (isLink && rel.split(/\s+/).includes("canonical")) canonicals.push(a.href ?? "");
    if (isLink && rel.split(/\s+/).includes("alternate") && a.hreflang) hreflang.push(a);
    if (!isLink && (a.name ?? "").toLowerCase() === "robots") robots.push(a.content ?? "");
  }
  const hreflangHosts = [...new Set(hreflang.map((a) => { try { return new URL(a.href, "https://x.invalid").host; } catch { return "?"; } }))];
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
  const themeRaw = html.match(/Shopify\.theme\s*=\s*(\{[^}]*\})/)?.[1];
  let theme = null;
  if (themeRaw) {
    try { theme = JSON.parse(themeRaw); } catch { theme = { raw: themeRaw }; }
  }
  const jsRedirect = /window\.location\.replace\("https:\/\/sickmotos\.com\//.test(html);
  return { canonicals, robots, hreflang, hreflangHosts, title, theme, jsRedirect };
}

let failures = 0;
for (const startUrl of urls) {
  console.log(`\n=== ${startUrl}`);
  try {
    const { finalUrl, status, html, hops } = await fetchFollowing(startUrl);
    const r = analyse(html);
    if (hops.length > 1) console.log(`Weiterleitungen: ${hops.length - 1}`);
    for (const h of hops) console.log(`  ${h}`);
    console.log(`Status:          ${status}`);
    console.log(`Finale URL:      ${finalUrl}`);
    console.log(`Title:           ${r.title || "(leer)"}`);
    console.log(`Canonical:       ${r.canonicals.length === 0 ? "(keins)" : r.canonicals.join(" | ")}${r.canonicals.length > 1 ? "  ACHTUNG: mehrere Canonicals" : ""}`);
    console.log(`Robots-Meta:     ${r.robots.length === 0 ? "(keins)" : r.robots.join(" | ")}`);
    console.log(`hreflang-Links:  ${r.hreflang.length}${r.hreflang.length ? ` (Hosts: ${r.hreflangHosts.join(", ")})` : ""}`);
    console.log(`JS-Redirect auf sickmotos.com im HTML: ${r.jsRedirect ? "ja" : "nein"}`);
    if (r.theme) console.log(`Shopify-Theme:   ${r.theme.name ?? "?"} (id ${r.theme.id ?? "?"}, role ${r.theme.role ?? "?"}, ${r.theme.schema_name ?? "?"} ${r.theme.schema_version ?? ""})`);
    if (status >= 400) failures++;
  } catch (err) {
    failures++;
    console.log(`FEHLER: ${err instanceof Error ? err.message : String(err)}`);
  }
}
process.exit(failures ? 1 : 0);
