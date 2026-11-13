// Produktsuche fuer den SickBot (Tool "search_products").
// Der Bot bekommt hier echte Treffer aus products.json mit der exakten URL,
// damit er Kunden direkt verlinken kann statt "such mal auf der Website".
// Alle Links, die der Bot verschicken darf, kommen aus dieser Datei; die
// Route prueft danach jede Link-Stelle der Antwort (sanitizeBotReply).

import type Anthropic from "@anthropic-ai/sdk";
import {
  BIKE_BRANDS,
  allProducts,
  cleanTitle,
  getBikeBrands,
  getModels,
  getYears,
  isInStock,
  yearsInText,
  type ShopifyProduct,
} from "@/lib/products";
import { bareUrlRe, mdLinkRe, shopPath, splitTrail } from "@/lib/botLinks";

export const SITE = "https://sickmotos.com";

export const PRODUCT_SEARCH_TOOL: Anthropic.Tool = {
  name: "search_products",
  description:
    "Search the live SickMotos product catalog. Use it whenever the customer asks for a part, a product, a price, availability or a link, or names their bike and wants parts for it. Returns the best matching products with their exact page URL, price, stock status and all variants (each variant has its own URL that opens the product page with that variant preselected). Only URLs returned by this tool exist on the shop.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Search words in German or English: part type plus bike brand, model, ccm and year if known, e.g. 'Titan Krümmer Beta RR 125 LC 2024' or 'LED Scheinwerfer Fantic 50'.",
      },
    },
    required: ["query"],
  },
};

// ---------------------------------------------------------------------------
// Normalisierung

// Kleinschreibung, Umlaute und Schreibvarianten vereinheitlichen, damit
// "Krümmer", "Kruemmer" und der Handle "krummer" dasselbe Wort sind.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/euro\s*-?\s*5\s*\+/g, " e5+ ")
    .replace(/euro\s*-?\s*5\b/g, " e5 ")
    .replace(/fuel\s*-?\s*x/g, "fuelx")
    .replace(/gas\s*-?\s*gas/g, "gasgas")
    .replace(/(\d+)\s*(?:ccm|cc)\b/g, "$1")
    .replace(/\b((?:19|20)\d{2})\s*\+/g, "$1")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

const STOPWORDS = new Set(
  (
    "fur for mit der die das den dem des ein eine einen einem und oder ich hast habt " +
    "du ihr suche such link links bitte mein meine meinen meiner mir gibt es gib is " +
    "the a an to my i have you do need brauche welche welcher welches was wie kann " +
    "passt passend zu auf von im in am sickmotos produkt produkte teil teile gerne " +
    "hallo hi hey shop haben habe are there any kostet preis price wo where find finde " +
    "schick schicke send me dazu auch noch so ja nein bike motorrad moped baujahr model " +
    "modell year version"
  ).split(" ")
);

// Deutsch/Englisch und Shop-Jargon. Jede Gruppe gilt als ein Suchbegriff.
const SYNONYM_GROUPS: string[][] = [
  ["krummer", "header", "headers", "manifold"],
  ["auspuff", "exhaust", "endtopf", "schalldampfer", "muffler", "silencer", "auspuffanlage"],
  ["nockenwelle", "camshaft", "cam"],
  ["bremsscheibe", "bremsscheiben", "brake", "brakes", "disc", "disk", "discs"],
  ["einspritzduse", "einspritzdusen", "injector", "injektor", "duse"],
  ["akku", "battery", "batterie", "akkupack", "akkuset"],
  ["garantie", "warranty", "gewahrleistung"],
  ["schrauben", "schraube", "screws", "screw", "bolts", "bolt"],
  ["dekor", "dekorkit", "graphics", "graphic", "decals", "aufkleber", "sticker", "stickers"],
  ["felgen", "felge", "felgenset", "rims", "rim", "wheels", "wheel"],
  ["luftfilter", "airfilter", "filter"],
  ["converter", "konverter", "wandler", "spannungswandler"],
  ["scheinwerfer", "headlight", "headlights", "lampe", "lamp", "leuchte"],
  ["zylinder", "zylinderkit", "cylinder"],
  ["carbon", "karbon"],
  ["hoodie", "pullover", "sweatshirt"],
  ["lenker", "handlebar"],
];
const SYNONYMS = new Map<string, string[]>();
for (const g of SYNONYM_GROUPS) for (const w of g) SYNONYMS.set(w, g);

const BRAND_ALIASES: Record<string, string> = {
  husky: "husqvarna",
  derby: "derbi",
};
const BRAND_WORDS = new Set(BIKE_BRANDS.map((b) => normalize(b)));
const ENGINE_WORDS = new Set(["tayo", "minarelli", "zontes", "tpi", "tbi", "sohc"]);

// ---------------------------------------------------------------------------
// Index

// Marken eines Produkts, inkl. Schreibvarianten im Titel ("Derby" = Derbi).
function brandSet(p: ShopifyProduct, normTitle: string): Set<string> {
  const set = new Set(getBikeBrands(p).map((b) => normalize(b)));
  for (const w of normTitle.split(" ")) {
    const alias = BRAND_ALIASES[w];
    if (alias) set.add(alias);
  }
  return set;
}

type Indexed = {
  p: ShopifyProduct;
  title: string;
  titleNoSpace: string;
  titleWords: Set<string>;
  extraWords: Set<string>;
  handle: string;
  brands: Set<string>;
  years: Set<number>;
};

let INDEX: Indexed[] | null = null;
let MODEL_WORDS: Set<string> = new Set();
// Alle Titelwoerter des Katalogs, zum Zerlegen von Komposita ("titankrummer").
let VOCAB: Set<string> = new Set();

function index(): Indexed[] {
  if (INDEX) return INDEX;
  const models = new Set<string>();
  const vocab = new Set<string>();
  INDEX = allProducts.map((p) => {
    const title = normalize(cleanTitle(p.title));
    for (const w of title.split(" ")) if (w.length >= 4) vocab.add(w);
    const productModels = getModels(p);
    for (const m of productModels) for (const w of normalize(m).split(" ")) if (w) models.add(w);
    const extra = normalize(
      [
        p.product_type,
        p.tags.join(" "),
        p.options.map((o) => o.values.join(" ")).join(" "),
        p.variants.map((v) => v.title).join(" "),
        getBikeBrands(p).join(" "),
        productModels.join(" "),
      ].join(" ")
    );
    // Baujahre auch aus Variantennamen ("Beta RR 125 LC 2024- ... E5+"),
    // die Titel sind bei Thomas' Kopien oft veraltet.
    const years = new Set<number>(getYears(p));
    for (const v of p.variants) for (const y of yearsInText(v.title)) years.add(y);
    return {
      p,
      title,
      titleNoSpace: title.replace(/ /g, ""),
      titleWords: new Set(title.split(" ")),
      extraWords: new Set(extra.split(" ")),
      handle: normalize(p.handle.replace(/-/g, " ")),
      brands: brandSet(p, title),
      years,
    };
  });
  VOCAB = vocab;
  // Modellwoerter, die zugleich Marken, Teilebegriffe oder Zahlen sind, nicht als Modell zaehlen.
  for (const w of Array.from(models)) {
    if (BRAND_WORDS.has(w) || SYNONYMS.has(w) || /^\d+$/.test(w)) models.delete(w);
  }
  MODEL_WORDS = models;
  return INDEX;
}

// ---------------------------------------------------------------------------
// Suche

function fmtPrice(n: number): string {
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export type BotProductHit = {
  title: string;
  url: string;
  type: string;
  price: string;
  in_stock: boolean;
  fits_brands: string[];
  years: string | null;
  variants: { name: string; price: string; in_stock: boolean; url: string }[];
  same_title_designs?: number;
  all_designs_url?: string;
};

type Query = {
  part: string[][]; // je Teilebegriff die Synonym-Gruppe
  bike: string[]; // Modelle, Motoren, Hubraum
  brands: string[];
  years: number[];
};

function parseQuery(query: string): Query {
  index();
  const q: Query = { part: [], bike: [], brands: [], years: [] };
  const seen = new Set<string>();
  for (const raw of normalize(query).split(" ")) {
    if (!raw || STOPWORDS.has(raw)) continue;
    const t = BRAND_ALIASES[raw] ?? raw;
    if (seen.has(t)) continue;
    seen.add(t);
    if (BRAND_WORDS.has(t)) q.brands.push(t);
    else if (/^(19|20)\d{2}$/.test(t)) q.years.push(Number(t));
    else if (/^\d+$/.test(t)) q.bike.push(t);
    // Kurze reine Buchstaben-Kuerzel (rr, lc, wr, sm) sind Modellangaben,
    // kurze mit Ziffer (h4, v6, e5) dagegen Teilebegriffe.
    else if (
      ENGINE_WORDS.has(t) ||
      MODEL_WORDS.has(t) ||
      (t.length <= 2 && /^[a-z]+$/.test(t) && !SYNONYMS.has(t))
    )
      q.bike.push(t);
    else if (SYNONYMS.has(t) || VOCAB.has(t)) q.part.push(SYNONYMS.get(t) ?? [t]);
    else {
      // Kompositum in zwei bekannte Woerter zerlegen ("titankrummer" ->
      // "titan" + "krummer", "akkupack" -> "akku" + "pack").
      const known = (w: string) => SYNONYMS.has(w) || VOCAB.has(w);
      let split: [string, string] | null = null;
      for (let i = 3; i <= t.length - 3 && !split; i++) {
        const a = t.slice(0, i);
        const b = t.slice(i);
        if (known(a) && known(b)) split = [a, b];
      }
      if (split) for (const w of split) q.part.push(SYNONYMS.get(w) ?? [w]);
      else q.part.push([t]);
    }
  }
  return q;
}

function partScore(it: Indexed, group: string[]): number {
  let best = 0;
  for (const w of group) {
    let s = 0;
    if (it.titleWords.has(w)) s = 3;
    else if (w.length >= 4 && it.title.includes(w)) s = 2;
    else if (w.length >= 6 && it.titleNoSpace.includes(w)) s = 2;
    else if (it.extraWords.has(w)) s = 1.5;
    else if (w.length >= 4 && it.handle.includes(w)) s = 1;
    if (s > best) best = s;
  }
  return best;
}

export function searchProducts(query: string, limit = 5): BotProductHit[] {
  const q = parseQuery(query || "");
  if (q.part.length === 0 && q.bike.length === 0 && q.brands.length === 0) return [];
  // Erst streng nach Marke. Bleibt dabei nichts uebrig (Markenerkennung im
  // Katalog ist nicht perfekt), Marke nur noch als Abwertung.
  let scored = scoreAll(q, true);
  if (scored.length === 0 && q.brands.length > 0) scored = scoreAll(q, false);
  return pickHits(scored, limit);
}

type Scored = { it: Indexed; hits: number; score: number };

function scoreAll(q: Query, strictBrands: boolean): Scored[] {
  const scored: Scored[] = [];
  for (const it of index()) {
    // Teil einer anderen Marke (KTM-Teil bei "Beta") nicht anbieten.
    // Universalteile ohne Marke bleiben drin.
    const otherBrand =
      q.brands.length > 0 && it.brands.size > 0 && !q.brands.some((b) => it.brands.has(b));
    if (otherBrand && strictBrands) continue;
    let hits = 0;
    let score = 0;
    for (const g of q.part) {
      const s = partScore(it, g);
      if (s > 0) {
        hits++;
        score += s;
      }
    }
    // Gibt es Teilebegriffe, muss mindestens einer passen. Sonst kaeme bei
    // "Nockenwelle Beta RR" jedes Beta-Teil.
    if (q.part.length > 0 && hits === 0) continue;

    // Bike-Angaben zaehlen nur zweitrangig. Universalteile (ohne Marke)
    // bekommen dafuer eine neutrale Gutschrift, damit "H4 Adapter Beta RR 125"
    // nicht von irgendeinem Beta-Teil verdraengt wird.
    const universal = it.brands.size === 0;
    for (const t of q.bike) {
      if (it.titleWords.has(t)) score += 1.5;
      else if (it.extraWords.has(t)) score += 1;
      else if (universal) score += 0.75;
    }
    if (q.brands.length > 0) score += otherBrand ? -2 : universal ? 0.75 : 1.5;
    // Baujahr nur als Feinsortierung, nie staerker als ein Teilebegriff.
    for (const y of q.years) {
      if (it.years.size === 0) continue;
      score += it.years.has(y) ? 1 : -1;
    }
    if (q.part.length === 0 && score <= 0) continue;
    scored.push({ it, hits, score });
  }
  return scored;
}

function pickHits(scored: Scored[], limit: number): BotProductHit[] {
  scored.sort(
    (a, b) =>
      b.hits - a.hits ||
      b.score - a.score ||
      Number(isInStock(b.it.p)) - Number(isInStock(a.it.p)) ||
      a.it.title.length - b.it.title.length
  );

  // Thomas' Dekor-Kits haben oft denselben Titel (verschiedene Designs).
  // Einmal zeigen, mit Anzahl und Link auf die Shop-Suche fuer alle Designs.
  const out: BotProductHit[] = [];
  const byTitle = new Map<string, BotProductHit>();
  for (const { it } of scored) {
    const existing = byTitle.get(it.title);
    if (existing) {
      existing.same_title_designs = (existing.same_title_designs ?? 1) + 1;
      continue;
    }
    if (out.length >= limit) continue;
    const hit = toHit(it);
    byTitle.set(it.title, hit);
    out.push(hit);
  }
  for (const h of out) {
    if (h.same_title_designs && h.same_title_designs > 1) {
      h.all_designs_url = `${SITE}/shop?q=${encodeURIComponent(h.title)}`;
    }
  }
  return out;
}

function toHit(it: Indexed): BotProductHit {
  const p = it.p;
  const url = `${SITE}/products/${p.handle}`;
  const prices = p.variants.map((v) => parseFloat(v.price || "0")).filter((n) => n > 0);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const ys = Array.from(it.years);
  return {
    title: cleanTitle(p.title),
    url,
    type: p.product_type || "",
    price: min === max ? fmtPrice(min) : `ab ${fmtPrice(min)}`,
    in_stock: isInStock(p),
    fits_brands: getBikeBrands(p),
    years: ys.length ? `${Math.min(...ys)}-${Math.max(...ys)}` : null,
    variants:
      p.variants.length > 1
        ? p.variants.slice(0, 40).map((v) => ({
            name: v.title,
            price: fmtPrice(parseFloat(v.price || "0")),
            in_stock: v.available,
            url: `${url}?variant=${v.id}`,
          }))
        : [],
  };
}

// Tool-Aufruf ausfuehren. Gibt immer einen String fuer tool_result zurueck,
// dazu alle angebotenen URLs (fuer die Link-Pruefung der Antwort).
export function runProductSearchTool(input: unknown): {
  content: string;
  isError: boolean;
  urls: string[];
} {
  const query =
    input && typeof input === "object" && typeof (input as { query?: unknown }).query === "string"
      ? (input as { query: string }).query
      : "";
  if (!query.trim()) {
    return { content: "Missing 'query'.", isError: true, urls: [] };
  }
  const results = searchProducts(query.slice(0, 200));
  const urls = results.flatMap((r) => [
    r.url,
    ...r.variants.map((v) => v.url),
    ...(r.all_designs_url ? [r.all_designs_url] : []),
  ]);
  return {
    urls,
    content: JSON.stringify(
      results.length
        ? { results }
        : {
            results: [],
            note: "No matching product. Ask for brand, model and year, or try other words.",
          }
    ),
    isError: false,
  };
}

// ---------------------------------------------------------------------------
// Link-Pruefung der Antwort

const PRODUCT_INDEX: Map<string, Set<string>> = new Map(
  allProducts.map((p) => [p.handle, new Set(p.variants.map((v) => String(v.id)))])
);

// /products/<handle>, auch mit altem Sprach-Praefix (/de/products/...).
const PRODUCT_PATH_RE = /^(?:\/[a-z]{2}(?:-[a-z]{2})?)?\/products\/([^/]+)\/?$/i;

function safeDecode(s: string): string | null {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}

function productRef(raw: string): { handle: string; variant: string | null } | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (host !== "sickmotos.com" && host !== "www.sickmotos.com") return null;
    const m = u.pathname.match(PRODUCT_PATH_RE);
    if (!m) return null;
    const handle = safeDecode(m[1]);
    return handle ? { handle, variant: u.searchParams.get("variant") } : null;
  } catch {
    return null;
  }
}

// Aehnlichkeit zweier Handles (Bigramm-Dice, 0 bis 1).
function dice(a: string, b: string): number {
  if (a === b) return 1;
  const grams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const A = grams(a);
  const B = grams(b);
  let inter = 0;
  A.forEach((n, g) => (inter += Math.min(n, B.get(g) ?? 0)));
  return (2 * inter) / Math.max(1, a.length - 1 + b.length - 1);
}

// Nur echte Tippfehler auf ein angebotenes Produkt umbiegen. Verschiedene
// Produkte haben oft fast gleiche Handles (Sherco Angel Eye vs Hexagon
// 2013-2023: 0,94; Dekor-Kits, die sich nur im Jahr unterscheiden), ein
// Tippfehler liegt bei 0,99. Deshalb hohe Schwelle UND klarer Abstand.
function closestOffered(handle: string, offeredHandles: string[]): string | null {
  const scores = offeredHandles
    .map((oh) => ({ oh, s: dice(handle, oh) }))
    .sort((x, y) => y.s - x.s);
  const [first, second] = scores;
  if (first && first.s >= 0.96 && (!second || first.s - second.s >= 0.03)) return first.oh;
  return null;
}

function productUrl(handle: string, variant: string | null): string {
  const base = `${SITE}/products/${handle}`;
  return variant && PRODUCT_INDEX.get(handle)?.has(variant) ? `${base}?variant=${variant}` : base;
}

// Prueft eine Link-URL aus der Antwort. Ergebnis: die URL, die gezeigt werden
// darf (evtl. korrigiert), oder null (Link entfernen, Text bleibt stehen).
// Fremde Hosts bleiben unveraendert, das Widget zeigt sie nur als Text.
export function checkLink(raw: string, offered: string[] = []): string | null {
  let host = "";
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host !== "sickmotos.com" && host !== "www.sickmotos.com") return raw;

  const ref = productRef(raw);
  if (!ref) {
    // Kein Produktlink: nur erlaubte Shop-Pfade, alles mit /products/ in
    // anderer Form ist erfunden.
    return shopPath(raw) && !/\/products\//i.test(raw) ? raw : null;
  }

  const offeredHandles = Array.from(
    new Set(offered.map((o) => productRef(o)?.handle).filter((x): x is string => !!x))
  );
  const exists = PRODUCT_INDEX.has(ref.handle);
  // Existiert das Produkt, wurde aber in dieser Anfrage nicht angeboten,
  // kann es ein Tippfehler auf ein anderes echtes Produkt sein.
  if (exists && (offeredHandles.length === 0 || offeredHandles.includes(ref.handle))) {
    return productUrl(ref.handle, ref.variant);
  }
  const near = offeredHandles.length ? closestOffered(ref.handle, offeredHandles) : null;
  if (near) return productUrl(near, ref.variant);
  return exists ? productUrl(ref.handle, ref.variant) : null;
}

// Produktlinks pruefen (Link-Stellen genau wie das Chat-Widget erkennen) und
// Gedankenstriche ersetzen (Hausregel, auch Shopify-Titel enthalten welche).
export function sanitizeBotReply(text: string, offered: string[] = []): string {
  const kept: string[] = [];
  const hold = (s: string) => {
    kept.push(s);
    return `\u0000${kept.length - 1}\u0000`;
  };

  let out = text.replace(mdLinkRe(), (m, label: string, url: string) => {
    const [clean, trail] = splitTrail(url);
    const ok = checkLink(clean, offered);
    if (ok !== clean) console.warn("[chat] product link", ok ? "repaired" : "removed", clean);
    return ok ? hold(`[${label}](${ok})`) + trail : label + trail;
  });
  out = out.replace(bareUrlRe(), (m) => {
    const [clean, trail] = splitTrail(m);
    const ok = checkLink(clean, offered);
    if (ok !== clean) console.warn("[chat] product link", ok ? "repaired" : "removed", clean);
    return ok ? hold(ok) + trail : trail;
  });

  out = out
    // Spanne nur zwischen zwei Jahreszahlen oder zwei kleinen Zahlen
    // ("7 bis 14", "2021 bis 2024"), nicht "Duke 390, 2012-2016".
    .replace(/(\d+)[ \t]*[\u2013\u2014][ \t]*(\d+)/g, (m, a: string, b: string) => {
      const year = (x: string) => /^(19|20)\d{2}$/.test(x);
      return (year(a) && year(b)) || (a.length <= 3 && b.length <= 3) ? `${a}-${b}` : `${a}, ${b}`;
    })
    .replace(/^([ \t]*)[\u2013\u2014][ \t]+/gm, "$1- ")
    .replace(/[ \t][\u2013\u2014][ \t]/g, ", ")
    .replace(/[\u2013\u2014]/g, "-");

  // Entfernte Links in Klammern hinterlassen sonst "()".
  out = out.replace(/[ \t]*\([ \t]*\)/g, "");
  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => kept[Number(i)]);
}
