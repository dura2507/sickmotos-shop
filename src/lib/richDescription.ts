// Shopify-Beschreibung (body_html) als strukturierte Bloecke fuer die
// Produktseite. Bis 08.11.2026 wurde alles zu Klartext-Absaetzen plattgeklopft
// (htmlToBlocks), dadurch gingen Ueberschriften, Listen und Fettdruck verloren
// und lange Texte wurden zur Textwand (Thomas' Titan-Kruemmer). Hier bleibt die
// Struktur erhalten, ohne fremdes HTML ungeprueft in die Seite zu kippen: es
// entsteht ein eigener kleiner Baum, den InfoTabs als React-Elemente rendert.
//
// Ausserdem wird Struktur erkannt, die beim Kopieren aus Notizen oder Word
// verloren geht: kurze Zeilen mit Doppelpunkt am Ende sind Zwischentitel,
// eingerueckte oder mit Spiegelstrich beginnende Zeilen sind Listenpunkte,
// "Stichwort: Text" bekommt ein fettes Stichwort. Der Wortlaut bleibt Thomas'
// Text, nur Gedankenstriche werden zu Komma bzw. Bindestrich (Hausregel).

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "link"; href: string; c: Inline[] };

export type RichBlock =
  | { type: "heading"; c: Inline[] }
  | { type: "p"; c: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] };

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", euro: "€", bull: "•",
  auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß",
  deg: "°", times: "×", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", bdquo: "„",
};

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      // fromCodePoint wirft bei Werten ausserhalb von Unicode, die Seite darf
      // an einem kaputten Entity in Shopify nicht abstuerzen.
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e] ?? m;
  });
}

// Gedankenstriche: zwischen Zahlen ein Bindestrich (2021–2024), sonst ein Komma.
// Nur symmetrische Strich-Bereiche werden zusammengezogen ("2021–2024",
// "2021 – 2024"); "2017– 125ccm" ist ein offenes Baujahr und bleibt getrennt.
function dashes(s: string): string {
  return s
    .replace(/(\d)[–—](\d)/g, "$1-$2")
    .replace(/(\d) +[–—] +(\d)/g, "$1-$2")
    .replace(/\s+[–—]\s+/g, ", ")
    .replace(/[–—]/g, "-");
}

// Links aus Shopify zeigen oft auf die alte Domain oder den Shopify-Host.
// Interne Ziele werden relativ, tel:-Links (iOS-Autolinks auf Jahreszahlen)
// fliegen raus, alles andere muss http(s) oder mailto sein.
function safeHref(raw: string): string | null {
  const href = decode(raw.trim());
  if (/^mailto:/i.test(href)) return href;
  const m = href.match(/^https?:\/\/(?:www\.)?(sick-?motos\.(?:com|de)|checkout\.sickmotos\.com|sickmotos\.myshopify\.com)(\/[^\s]*)?$/i);
  if (m) {
    const path = (m[2] || "/").replace(/^\/(?:de|en|it|es)(?=\/)/i, "");
    return path.replace(/^\/collections\/[^/]+\/products\//, "/products/");
  }
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith("/")) return href;
  return null;
}

type Line = { c: Inline[]; indented: boolean; bullet: boolean };

// Tabellenzeilen enden sonst auf " · ".
function dropTrailingSeparator(c: Inline[]): Inline[] {
  const out = [...c];
  while (out.length) {
    const last = out[out.length - 1];
    if (last.t !== "text") break;
    const v = last.v.replace(/[\s·]+$/, "");
    if (v) {
      out[out.length - 1] = { t: "text", v };
      break;
    }
    out.pop();
  }
  return out;
}

// Plain text of an inline list.
export function inlineText(c: Inline[]): string {
  return c.map((x) => (x.t === "text" ? x.v : inlineText(x.c))).join("");
}

function trimInline(c: Inline[]): Inline[] {
  const out = c.map((x) => ({ ...x })) as Inline[];
  // trim leading whitespace
  while (out.length && out[0].t === "text" && !(out[0] as { v: string }).v.trim()) out.shift();
  if (out.length && out[0].t === "text") (out[0] as { v: string }).v = (out[0] as { v: string }).v.replace(/^\s+/, "");
  while (out.length && out[out.length - 1].t === "text" && !(out[out.length - 1] as { v: string }).v.trim()) out.pop();
  const last = out[out.length - 1];
  if (last && last.t === "text") last.v = last.v.replace(/\s+$/, "");
  return out;
}

// "-" nur vor Leerzeichen oder Buchstaben: "-2,23 kg" ist ein Minus, kein Punkt.
const BULLET_RE = /^\s*(?:[•▪●◦✅✔✓☑➤►▶→]|\*|-(?=\s|[A-Za-zÄÖÜäöü]))\s*/;

// Strip a leading bullet glyph from the first text node.
function stripBullet(c: Inline[]): { c: Inline[]; had: boolean } {
  const first = c[0];
  // "*Hinweis*" ist Hervorhebung, kein Listenpunkt.
  if (first && first.t === "text" && /^\s*\*/.test(first.v) && inlineText(c).trim().slice(1).includes("*")) {
    return { c, had: false };
  }
  if (first && first.t === "text" && BULLET_RE.test(first.v)) {
    return { c: [{ t: "text", v: first.v.replace(BULLET_RE, "") }, ...c.slice(1)], had: true };
  }
  if (first && (first.t === "strong" || first.t === "em")) {
    const inner = stripBullet(first.c);
    if (inner.had) return { c: [{ ...first, c: inner.c }, ...c.slice(1)], had: true };
  }
  return { c, had: false };
}

// "Stichwort: Text" -> fettes Stichwort, wenn nicht ohnehin schon formatiert.
// Ein Listenpunkt, der selbst mit Doppelpunkt endet, ist ein Untertitel.
function boldLabel(c: Inline[]): Inline[] {
  if (c.some((x) => x.t === "strong")) return c;
  const whole = inlineText(c).trim();
  if (whole.endsWith(":") && whole.length <= 70) return [{ t: "strong", c }];
  const first = c[0];
  if (!first || first.t !== "text") return c;
  const m = first.v.match(/^([^:.!?]{2,40}):\s+(\S[\s\S]*)$/);
  if (!m || !/^[A-ZÄÖÜ0-9]/.test(m[1])) return c;
  return [{ t: "strong", c: [{ t: "text", v: `${m[1]}:` }] }, { t: "text", v: ` ${m[2]}` }, ...c.slice(1)];
}

function isHeadingLine(text: string, line: Line): boolean {
  const t = text.trim();
  if (!t.endsWith(":") || t.length > 60 || line.bullet) return false;
  if (t.split(/\s+/).length > 8) return false;
  // Ein Satz mit Punkt davor ist kein Zwischentitel ("Wichtig. Bitte beachten:")
  return !/[.!?]\s/.test(t);
}

export function parseRichDescription(html: string | null | undefined): RichBlock[] {
  if (!html) return [];
  const src = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|svg|noscript)[\s\S]*?<\/\1>/gi, "");

  const blocks: RichBlock[] = [];
  // Stack of inline containers; index 0 is the current line.
  let line: Line = { c: [], indented: false, bullet: false };
  let stack: Inline[][] = [line.c];
  let pendingLines: Line[] = [];
  let list: { ordered: boolean; items: Inline[][] } | null = null;
  let inItem = false;
  let heading = false;
  let lineStarted = false;

  const top = () => stack[stack.length - 1];

  const endLine = () => {
    const c = trimInline(dropTrailingSeparator(line.c));
    if (inlineText(c).trim()) pendingLines.push({ ...line, c });
    line = { c: [], indented: false, bullet: false };
    stack = [line.c];
    lineStarted = false;
  };

  const flushParagraph = () => {
    endLine();
    for (const l of pendingLines) {
      const text = inlineText(l.c);
      if (heading) {
        blocks.push({ type: "heading", c: l.c });
        continue;
      }
      // Eine Zeile, die nur aus Fettdruck besteht, ist ein Zwischentitel.
      const solid = l.c.filter((x) => !(x.t === "text" && !x.v.trim()));
      if (solid.length === 1 && solid[0].t === "strong" && text.trim().length <= 80 && !l.indented) {
        blocks.push({ type: "heading", c: solid[0].c });
        continue;
      }
      const { c, had } = stripBullet(l.c);
      if (had || l.indented) {
        const prev = blocks[blocks.length - 1];
        const item = boldLabel(trimInline(c));
        if (prev && prev.type === "list" && !prev.ordered) prev.items.push(item);
        else blocks.push({ type: "list", ordered: false, items: [item] });
        continue;
      }
      if (isHeadingLine(text, l)) {
        blocks.push({ type: "heading", c: l.c });
        continue;
      }
      blocks.push({ type: "p", c: boldLabel(l.c) });
    }
    pendingLines = [];
  };

  const finishItem = () => {
    const c = boldLabel(trimInline(dropTrailingSeparator(stripBullet(line.c).c)));
    if (inlineText(c).trim()) {
      if (!list) {
        list = { ordered: false, items: [] };
        blocks.push({ type: "list", ordered: false, items: list.items });
      }
      list.items.push(c);
    }
    inItem = false;
    line = { c: [], indented: false, bullet: false };
    stack = [line.c];
    lineStarted = false;
  };

  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const [, rawTag, attrs = "", text] = m;
    if (text !== undefined) {
      // Am Zeilenanfang erst die Leerzeichen weg, sonst wird " – Text" zu ", Text".
      const raw = lineStarted ? decode(text) : decode(text).replace(/^\s+/, "");
      const v = dashes(raw).replace(/\s+/g, " ");
      if (!v.trim() && !lineStarted) continue;
      top().push({ t: "text", v });
      if (v.trim()) lineStarted = true;
      continue;
    }
    const tag = rawTag.toLowerCase();
    const closing = m[0][1] === "/";
    switch (tag) {
      case "p":
      case "div":
      case "tr":
        // Absaetze innerhalb eines Listenpunkts gehoeren zum Punkt.
        if (inItem) {
          if (lineStarted) top().push({ t: "text", v: " " });
          break;
        }
        flushParagraph();
        break;
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
        // Ueberschrift in einem Listenpunkt: bleibt im Punkt, fett.
        if (inItem) {
          if (!closing) {
            const c: Inline[] = [];
            top().push({ t: "strong", c });
            stack.push(c);
          } else {
            if (stack.length > 1) stack.pop();
            top().push({ t: "text", v: " " });
          }
          break;
        }
        flushParagraph();
        heading = !closing;
        break;
      case "br":
        if (inItem) top().push({ t: "text", v: " " });
        else endLine();
        break;
      case "ul":
      case "ol":
        // Verschachtelte Liste: den offenen Punkt erst abschliessen, damit
        // sein Text an seiner Stelle bleibt.
        if (inItem) finishItem();
        flushParagraph();
        if (!closing) {
          list = { ordered: tag === "ol", items: [] };
          blocks.push({ type: "list", ordered: list.ordered, items: list.items });
        } else {
          list = null;
        }
        break;
      case "li":
        if (!closing) {
          if (inItem) finishItem(); // <li> ohne </li> davor
          flushParagraph();
          inItem = true;
          line = { c: [], indented: false, bullet: false };
          stack = [line.c];
        } else if (inItem) {
          finishItem();
        }
        break;
      case "td":
      case "th":
        if (closing) top().push({ t: "text", v: " · " });
        break;
      case "strong":
      case "b":
      case "em":
      case "i":
      case "a": {
        if (!closing) {
          const c: Inline[] = [];
          let node: Inline;
          if (tag === "a") {
            const href = safeHref(attrs.match(/href\s*=\s*"([^"]*)"|href\s*=\s*'([^']*)'/i)?.slice(1).find(Boolean) ?? "");
            // Ohne gueltiges Ziel bleibt nur der Text (Platzhalter, wird unten aufgeloest).
            node = href ? { t: "link", href, c } : ({ t: "plain", c } as unknown as Inline);
          } else {
            node = { t: tag === "strong" || tag === "b" ? "strong" : "em", c };
          }
          top().push(node);
          stack.push(c);
        } else if (stack.length > 1) {
          stack.pop();
        }
        break;
      }
      case "span":
        // Apple-converted-space am Zeilenanfang = eingerueckter Listenpunkt,
        // der beim Kopieren sein Aufzaehlungszeichen verloren hat.
        if (!closing && /Apple-converted-space/.test(attrs) && !lineStarted && !inItem) {
          line.indented = true;
        }
        break;
      default:
        // meta, img, u, font, ... werden ignoriert, ihr Text bleibt erhalten
        break;
    }
  }
  flushParagraph();

  // "plain"-Knoten (Links ohne gueltiges Ziel) in Text aufloesen.
  const unwrap = (c: Inline[]): Inline[] =>
    c.flatMap((x): Inline[] => {
      if ((x as { t: string }).t === "plain") return unwrap((x as unknown as { c: Inline[] }).c);
      if (x.t === "text") return [x];
      return [{ ...x, c: unwrap(x.c) }];
    });
  const cleaned: RichBlock[] = [];
  // Eine kurze erste Zeile ohne Satzzeichen ist der Titel des Textes.
  const first = blocks[0];
  if (first && first.type === "p") {
    const t = inlineText(first.c).trim();
    if (t.length <= 90 && !/[.!?:]/.test(t)) blocks[0] = { type: "heading", c: first.c };
  }
  // Zwischentitel ohne Doppelpunkt am Ende, als Ueberschrift gesetzt wirkt er doppelt.
  const dropColon = (c: Inline[]): Inline[] => {
    const out = [...c];
    const last = out[out.length - 1];
    if (!last) return out;
    out[out.length - 1] =
      last.t === "text" ? { t: "text", v: last.v.replace(/\s*:\s*$/, "") } : { ...last, c: dropColon(last.c) };
    return out;
  };
  for (const b of blocks) {
    if (b.type === "heading") {
      const c = dropColon(unwrap(b.c));
      if (inlineText(c).trim()) cleaned.push({ type: "heading", c });
      continue;
    }
    if (b.type === "list") {
      const items = b.items.map(unwrap).filter((i) => inlineText(i).trim());
      if (items.length) cleaned.push({ ...b, items });
    } else {
      const c = unwrap(b.c);
      if (inlineText(c).trim()) cleaned.push({ ...b, c });
    }
  }
  return cleaned;
}
