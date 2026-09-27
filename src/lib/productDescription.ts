import { BIKE_BRANDS, cleanTitle, type ShopifyProduct } from "./products";

// Product descriptions for <meta name="description"> and the JSON-LD
// Product.description, built ONLY from data that exists for the product:
// title, vendor, product type, the meaningful lines of the Shopify text, the
// price of the variants in stock and the stock wording. Nothing is generated
// or embellished; every word either comes from Shopify or is one of the fixed
// connectors below.
//
// Background (measured 2026-09-11): the old meta description was the first
// line of the Shopify text, 331 of 483 were under 50 characters, 180 were
// literally "FIRST CLASS QUALITY GRAPHIC KIT" and one was just "C".

// Google shows roughly 155 to 160 characters of a description.
export const META_MAX = 155;
// Lines shorter than this are labels, model names or slogans ("Designed
// for:", "KTM SMCR", "Vibrant colors"); they are skipped as long as the
// product has longer text.
const MIN_LINE = 25;

// Fixed German connectors. Crawlers without Accept-Language get the German
// site and the Shopify texts are German or English per product, so the
// description is not localized. "auf Lager" mirrors product.inStock in the
// DE dictionary.
const WORD_BY = "von";
const WORD_FROM = "ab";
const WORD_IN_STOCK = "auf Lager";

// Product types that are system or taxonomy buckets, not part categories.
const GENERIC_TYPES = new Set(["fahrzeuge & teile", "cpb_product"]);

const NUMBER = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ENTITIES: Record<string, string> = {
  amp: "&",
  nbsp: " ",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
};

// Shopify stores "&" as "&amp;" (200 products), which the plain tag stripper
// in htmlToBlocks leaves in place.
function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const hex = entity[1] === "x" || entity[1] === "X";
      const code = parseInt(hex ? entity.slice(2) : entity.slice(1), hex ? 16 : 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

// Em and en dashes are banned in everything this shop publishes, but 78
// Shopify titles and 84 texts contain them. Between digits they become a
// hyphen (2013-2025), everywhere else a comma.
export function stripDashes(s: string): string {
  return s
    .replace(/[\u2010\u2011\u2012\u2212]/g, "-")
    .replace(/(\d)\s*[\u2013\u2014\u2015]\s*(?=\d)/g, "$1-")
    .replace(/\s*[\u2013\u2014\u2015]+\s*/g, ", ")
    .replace(/,(\s*,)+/g, ",")
    .replace(/^,\s*/, "")
    .replace(/,\s*$/, "");
}

// Collapse whitespace, drop list markers and emoji, tighten "Modelle !".
function tidy(s: string): string {
  return s
    .replace(/\p{Extended_Pictographic}|\uFE0F/gu, "")
    .replace(/^[\s•*·▪●■✓✔➤►>-]+/, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

// Plain text lines of a Shopify body_html, cleaned but not filtered.
export function textLines(html: string): string[] {
  const stripped = (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|ul|ol|table|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(stripped)
    .split(/\n+/)
    .map((line) => tidy(stripDashes(line)))
    .filter(Boolean);
}

const isLabel = (line: string) => /:$/.test(line);
const isAllCaps = (line: string) =>
  /[A-ZÄÖÜ]/.test(line) && !/[a-zäöüß]/.test(line);

// Abbreviations a sentence must not be split after ("bzgl. Anschluss").
const ABBREVIATION =
  /(?:^|\s)(?:bzgl|inkl|exkl|zzgl|ca|bzw|evtl|ggf|nr|bj|art|std|min|max|mod|approx|incl|excl|etc|vs|u|o|e\.g|i\.e|z\.b|u\.a|o\.ä|d\.h)$/i;

// A Shopify paragraph is one line with several sentences; split it so a
// description can quote whole sentences instead of cutting a paragraph.
export function splitSentences(line: string): string[] {
  const out: string[] = [];
  const boundary = /[.!?]+\s+(?=[A-ZÄÖÜ0-9(])/g;
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(line))) {
    if (ABBREVIATION.test(line.slice(start, m.index))) continue;
    out.push(line.slice(start, m.index + m[0].length).trim());
    start = m.index + m[0].length;
  }
  const rest = line.slice(start).trim();
  if (rest) out.push(rest);
  return out;
}

// A heading that only repeats the product title ("SickMotos Angel Eye LED
// RGBW V6.1 Scheinwerfer") adds nothing next to the title.
function repeatsTitle(sentence: string, title: string): boolean {
  const lower = title.toLowerCase();
  const words = sentence
    .toLowerCase()
    .split(" ")
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((w) => w.length >= 3);
  if (words.length < 3) return false;
  const shared = words.filter((w) => lower.includes(w)).length;
  return shared / words.length >= 0.6;
}

// A paragraph break in the middle of a sentence ("Bitte bei Fragen zu ihrem"
// / "Krümmer Modell und Baujahr angeben!!") leaves a line that ends in a
// function word without punctuation; that is not a sentence.
const DANGLING =
  /\s(zu|zum|zur|ihrem|ihren|ihrer|ihre|dem|den|der|die|das|des|ein|eine|einen|einem|einer|und|oder|für|mit|bei|von|vom|im|am|auf|in|an|the|for|with|and|or|of|to|your|a|an|on|at|by|is|are)$/i;
const isDangling = (s: string) => !/[.!?]$/.test(s) && DANGLING.test(s);
// Social handles, web addresses and the old domain are not product text.
const isContact = (s: string) =>
  /(www\.|https?:|\.com\b|\.de\b|@|\bfollow( us|:))/i.test(s);

// The sentences worth quoting: no labels ("Passend für:"), and while the
// product has longer text no short lines, no all-caps slogans, no title
// repeats, no dangling half sentences and no contact lines. A product whose
// text is only short lines keeps them, better than nothing.
export function meaningfulSentences(html: string, title: string): string[] {
  const sentences = textLines(html)
    .filter((line) => !isLabel(line))
    .flatMap(splitSentences);
  const long = sentences.filter(
    (s) =>
      s.length >= MIN_LINE &&
      !isAllCaps(s) &&
      !repeatsTitle(s, title) &&
      !isDangling(s) &&
      !isContact(s),
  );
  return long.length > 0 ? long : sentences.filter((s) => !isContact(s));
}

function asSentence(line: string): string {
  const trimmed = line.replace(/[\s,;:-]+$/, "");
  return /[.!?\u2026]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

// Shorten to `max` characters at a word boundary, ending in "..." with no
// dangling punctuation before it.
export function cutAtWord(s: string, max: number): string {
  if (s.length <= max) return s;
  if (max <= 3) return "";
  const raw = s.slice(0, max - 3);
  // Only a word cut in the middle is dropped; a complete last word stays.
  const head = /\s/.test(s.charAt(max - 3)) ? raw : raw.replace(/\s*\S*$/, "");
  const clean = head.replace(/[\s,.;:!?(-]+$/, "");
  return clean ? `${clean}...` : "";
}

// Fill `budget` characters with whole sentences in source order. A sentence
// that does not fit is skipped in favour of later shorter ones; only when no
// sentence fits at all is the first one cut at a word boundary.
function fillSentences(lines: string[], budget: number): string {
  const sentences = lines.map(asSentence);
  let out = "";
  for (const sentence of sentences) {
    const needed = sentence.length + (out ? 1 : 0);
    if (out.length + needed <= budget) out += (out ? " " : "") + sentence;
  }
  if (!out && sentences.length > 0) return cutAtWord(sentences[0], budget);
  return out;
}

// The Shopify product type is kept only when it is a plain part category that
// adds words the title does not have. Types starting with the shop name are
// collection names in Shopify ("SICKMOTOS Beta Angel EYES" sits on a voltage
// stabilizer, "SickMotos KTM Angel EYES" on GasGas lamps) and types naming a
// bike brand are unreliable for the same reason, so both are left out.
export function usableType(p: ShopifyProduct, title: string): string | null {
  const raw = tidy(stripDashes(p.product_type || ""));
  if (!raw) return null;
  if (/^sickmotos\b/i.test(raw)) return null;
  if (GENERIC_TYPES.has(raw.toLowerCase())) return null;
  if (BIKE_BRANDS.some((b) => new RegExp(`\\b${b}\\b`, "i").test(raw))) return null;
  const lower = title.toLowerCase();
  const words = raw.split(" ").filter((w) => w.length >= 3);
  if (words.every((w) => lower.includes(w.toLowerCase()))) return null;
  return raw;
}

function vendorOf(p: ShopifyProduct): string {
  return tidy(stripDashes(p.vendor || "SickMotos")) || "SickMotos";
}

// Title without the shop prefix, dashes or a stray trailing slash
// ("... 250/300 2024- /"). A trailing hyphen stays, it means "onwards".
function titleOf(p: ShopifyProduct): string {
  return tidy(stripDashes(cleanTitle(p.title))).replace(/[\s/]+$/, "");
}

// "ab 129,00 EUR, auf Lager." from the variants in stock: "ab" only when
// their prices differ, the stock wording only when something is in stock.
// With nothing in stock the price still comes from the cheapest variant, but
// without the stock wording.
export function priceTail(p: ShopifyProduct): string {
  const available = p.variants.filter((v) => v.available);
  const pool = available.length > 0 ? available : p.variants;
  const prices = pool
    .map((v) => parseFloat(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  const differ = new Set(prices.map((n) => n.toFixed(2))).size > 1;
  const amount = `${NUMBER.format(min)} EUR`;
  const price = differ ? `${WORD_FROM} ${amount}` : amount;
  return available.length > 0 ? `${price}, ${WORD_IN_STOCK}.` : `${price}.`;
}

function endSentence(s: string): string {
  return /[.!?\u2026]$/.test(s) ? s : `${s}.`;
}

// Meta description, at most META_MAX characters:
// "{title}, {type} von {vendor}. {sentences from the Shopify text} {price}"
// Type, then vendor, are dropped when a long title leaves no room; the title
// itself is only cut when it does not fit next to the price alone.
export function buildMetaDescription(p: ShopifyProduct): string {
  const title = titleOf(p);
  const vendor = vendorOf(p);
  const type = usableType(p, title);
  const tail = priceTail(p);
  const room = META_MAX - (tail ? tail.length + 1 : 0);

  const heads = [
    type ? `${title}, ${type} ${WORD_BY} ${vendor}` : null,
    `${title} ${WORD_BY} ${vendor}`,
    title,
  ].filter((h): h is string => Boolean(h));
  const fitting = heads.map(endSentence).find((h) => h.length <= room);
  const head = fitting ?? cutAtWord(title, room);

  const budget = room - head.length - 1;
  const body =
    budget >= MIN_LINE ? fillSentences(meaningfulSentences(p.body_html, title), budget) : "";

  return [head, body, tail].filter(Boolean).join(" ");
}

// JSON-LD Product.description: the meaningful Shopify text up to `max`
// characters. 4 products have no Shopify text at all (adapter-kabel,
// montagehilfe-neue-modelle, h4-adapter-montagehilfe, extended warranty); an
// empty string made Search Console flag "Feld description fehlt", so they
// fall back to title, type and vendor, all real data.
export function buildStructuredDescription(p: ShopifyProduct, max = 500): string {
  const title = titleOf(p);
  const text = fillSentences(meaningfulSentences(p.body_html, title), max);
  if (text) return text;
  const type = usableType(p, title);
  return `${title}${type ? `, ${type}` : ""} ${WORD_BY} ${vendorOf(p)}`;
}
