// Gemeinsame Link-Erkennung fuer SickBot-Antworten. Die Route prueft damit
// die Antwort, das Chat-Widget macht damit Links klickbar. Beide muessen
// dieselben Stellen als Link erkennen, sonst landen ungepruefte Links im
// Chat. Keine Daten-Imports hier, die Datei laeuft auch im Browser.

// [Text](https://...)
export const MD_LINK_SRC = String.raw`\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)`;
// Nackte URL bis zum ersten Leerzeichen, Klammer oder Anfuehrungszeichen.
export const BARE_URL_SRC = String.raw`https?:\/\/[^\s<>()\[\]"'“”„«»]+`;

export function mdLinkRe(): RegExp {
  return new RegExp(String.raw`\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)`, "g");
}
export function bareUrlRe(): RegExp {
  return new RegExp(BARE_URL_SRC, "g");
}

// Satzzeichen und Markdown am URL-Ende gehoeren nicht zur URL.
const TRAIL_RE = /[.,;:!?*_'"“”„«»>]+$/;
export function splitTrail(url: string): [string, string] {
  const t = url.match(TRAIL_RE)?.[0] ?? "";
  return [t ? url.slice(0, -t.length) : url, t];
}

// Pfade auf sickmotos.com, die der Bot verlinken darf.
const EXACT = new Set(["/", "/shop", "/returns", "/blog"]);
const PREFIXES = ["/products/", "/legal/", "/account/", "/blog/"];

// Interner Pfad (inkl. Query) einer erlaubten sickmotos.com-URL, sonst null.
// Fremde Hosts, andere Protokolle und Pfade wie "//fremd.example" (wuerden
// im Browser auf einen anderen Host zeigen) liefern null.
export function shopPath(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  if (host !== "sickmotos.com" && host !== "www.sickmotos.com") return null;
  const p = u.pathname;
  if (/^\/[/\\]/.test(p)) return null;
  if (!EXACT.has(p) && !PREFIXES.some((x) => p.startsWith(x))) return null;
  return p + u.search;
}
