// Produktsuche fuer den SickBot (Tool "search_products").
// Der Bot bekommt hier echte Treffer aus products.json mit der exakten URL,
// damit er Kunden direkt verlinken kann statt "such mal auf der Website".
// Alle Links, die der Bot verschicken darf, kommen aus dieser Datei; die
// Route prueft danach jede Produkt-URL in der Antwort gegen den Katalog.

import type Anthropic from "@anthropic-ai/sdk";
import {
  BIKE_BRANDS,
  allProducts,
  cleanTitle,
  getBikeBrands,
  getModels,
  getYears,
  isInStock,
  type ShopifyProduct,
} from "@/lib/products";

export const SITE = "https://sickmotos.com";

export const PRODUCT_SEARCH_TOOL: Anthropic.Tool = {
  name: "search_products",
  description:
    "Search the live SickMotos product catalog. Use it whenever the customer asks for a part, a product, a price, availability or a link, or names their bike and wants parts for it. Returns the best matching products with their exact page URL, price, stock status and variants (each variant has its own URL that opens the product page with that variant preselected). Only URLs returned by this tool exist on the shop.",
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

// Kleinschreibung, Umlaute und Schreibvarianten vereinheitlichen, damit
// "Krümmer", "Kruemmer" und der Handle "krummer" dasselbe Wort sind.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/euro\s*-?\s*5\s*\+/g, " e5+ ")
    .replace(/euro\s*-?\s*5\b/g, " e5 ")
    .replace(/fuel\s*-?\s*x/g, "fuelx")
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
    "schick schicke send me dazu auch noch so ja nein bike motorrad moped"
  ).split(" ")
);

const BRAND_WORDS = new Set(BIKE_BRANDS.map((b) => normalize(b)));

type Indexed = {
  p: ShopifyProduct;
  title: string;
  titleWords: Set<string>;
  extraWords: Set<string>;
  handle: string;
  brands: Set<string>;
  years: number[];
};

let INDEX: Indexed[] | null = null;
function index(): Indexed[] {
  if (INDEX) return INDEX;
  INDEX = allProducts.map((p) => {
    const title = normalize(cleanTitle(p.title));
    const extra = normalize(
      [
        p.product_type,
        p.tags.join(" "),
        p.options.map((o) => o.values.join(" ")).join(" "),
        p.variants.map((v) => v.title).join(" "),
        getBikeBrands(p).join(" "),
        getModels(p).join(" "),
      ].join(" ")
    );
    return {
      p,
      title,
      titleWords: new Set(title.split(" ")),
      extraWords: new Set(extra.split(" ")),
      handle: normalize(p.handle.replace(/-/g, " ")),
      brands: new Set(getBikeBrands(p).map((b) => normalize(b))),
      years: getYears(p),
    };
  });
  return INDEX;
}

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
};

export function searchProducts(query: string, limit = 5): BotProductHit[] {
  const q = normalize(query || "");
  const tokens = Array.from(new Set(q.split(" "))).filter(
    (t) => t && !STOPWORDS.has(t) && (t.length >= 2 || /\d/.test(t))
  );
  if (tokens.length === 0) return [];

  const queryBrands = tokens.filter((t) => BRAND_WORDS.has(t));
  // Teile-Begriffe (alles ausser Marke, Jahr und reinen Zahlen wie 125/50).
  // Gibt es welche, muss mindestens einer passen, sonst kommt bei
  // "Nockenwelle Beta" jedes Beta-Teil.
  const specific = tokens.filter(
    (t) => !BRAND_WORDS.has(t) && !/^\d+$/.test(t)
  );
  const scored: { it: Indexed; score: number; matched: number }[] = [];

  for (const it of index()) {
    let score = 0;
    let matched = 0;
    let specificHit = specific.length === 0;
    for (const t of tokens) {
      if (/^(19|20)\d{2}$/.test(t)) {
        const y = Number(t);
        if (it.years.length === 0) continue;
        if (it.years.includes(y)) {
          score += 2;
          matched++;
        } else {
          score -= 2;
        }
        continue;
      }
      let hit = true;
      if (it.titleWords.has(t)) {
        score += 3;
      } else if (t.length >= 4 && it.title.includes(t)) {
        score += 2;
      } else if (it.extraWords.has(t)) {
        score += 1.5;
      } else if (t.length >= 4 && it.handle.includes(t)) {
        score += 1;
      } else {
        hit = false;
      }
      if (hit) {
        matched++;
        if (!specificHit && specific.includes(t)) specificHit = true;
      }
    }
    if (!specificHit) continue;
    // Eine Marke im Suchtext, die nicht zum Teil passt (KTM-Teil bei
    // "Beta"), kostet viel. Universalteile ohne Marke bleiben drin.
    if (queryBrands.length > 0 && it.brands.size > 0) {
      if (!queryBrands.some((b) => it.brands.has(b))) score -= 4;
    }
    const needed = Math.max(1, Math.ceil(tokens.length * 0.4));
    if (score > 0 && matched >= needed) scored.push({ it, score, matched });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      Number(isInStock(b.it.p)) - Number(isInStock(a.it.p)) ||
      a.it.title.length - b.it.title.length
  );

  return scored.slice(0, limit).map(({ it }) => toHit(it));
}

function toHit(it: Indexed): BotProductHit {
  const p = it.p;
  const url = `${SITE}/products/${p.handle}`;
  const prices = p.variants.map((v) => parseFloat(v.price || "0")).filter((n) => n > 0);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const years = it.years.length
    ? `${Math.min(...it.years)}-${Math.max(...it.years)}`
    : null;
  return {
    title: cleanTitle(p.title),
    url,
    type: p.product_type || "",
    price: min === max ? fmtPrice(min) : `ab ${fmtPrice(min)}`,
    in_stock: isInStock(p),
    fits_brands: getBikeBrands(p),
    years,
    variants:
      p.variants.length > 1
        ? p.variants.slice(0, 12).map((v) => ({
            name: v.title,
            price: fmtPrice(parseFloat(v.price || "0")),
            in_stock: v.available,
            url: `${url}?variant=${v.id}`,
          }))
        : [],
  };
}

// Tool-Aufruf ausfuehren. Gibt immer einen String fuer tool_result zurueck.
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
  const urls = results.flatMap((r) => [r.url, ...r.variants.map((v) => v.url)]);
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

// Prueft eine URL, die der Bot verschicken will. sickmotos.com-Produktlinks
// muessen im Katalog existieren (inkl. Variante), sonst sind sie erfunden.
const PRODUCT_INDEX: Map<string, Set<string>> = new Map(
  allProducts.map((p) => [p.handle, new Set(p.variants.map((v) => String(v.id)))])
);

export function isValidShopUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.hostname !== "sickmotos.com" && u.hostname !== "www.sickmotos.com") return true; // fremde Links nicht hier bewerten
  const m = u.pathname.match(/^\/products\/([^/]+)\/?$/);
  if (!m) return true; // /shop, /legal/... sind ok
  const variants = PRODUCT_INDEX.get(decodeURIComponent(m[1]));
  if (!variants) return false;
  const v = u.searchParams.get("variant");
  if (v && !variants.has(v)) return false;
  return true;
}

function productHandle(raw: string): { u: URL; handle: string } | null {
  try {
    const u = new URL(raw);
    if (u.hostname !== "sickmotos.com" && u.hostname !== "www.sickmotos.com") return null;
    const m = u.pathname.match(/^\/products\/([^/]+)\/?$/);
    return m ? { u, handle: decodeURIComponent(m[1]) } : null;
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
  const total = Math.max(1, a.length - 1 + b.length - 1);
  return (2 * inter) / total;
}

// Ungueltige Produkt-URL reparieren: falsche Variante weglassen, oder einen
// leicht verschriebenen Handle auf das aehnlichste Produkt aus den
// Suchtreffern dieser Anfrage (offered) korrigieren. Sonst null.
export function repairShopUrl(raw: string, offered: string[] = []): string | null {
  const h = productHandle(raw);
  if (!h) return null;
  let handle: string | null = PRODUCT_INDEX.has(h.handle) ? h.handle : null;
  if (!handle) {
    // Nur echte Tippfehler reparieren: verschiedene Produkte haben oft fast
    // gleiche Handles (Sherco Angel Eye vs Hexagon 2013-2023: 0,94, ein
    // Tippfehler im Jahr: 0,99). Deshalb hohe Schwelle UND klarer Abstand
    // zum zweitbesten Handle, sonst lieber keinen Link als den falschen.
    const scores = Array.from(
      new Set(offered.map((o) => productHandle(o)?.handle).filter((x): x is string => !!x))
    )
      .map((oh) => ({ oh, score: dice(h.handle, oh) }))
      .sort((x, y) => y.score - x.score);
    const [first, second] = scores;
    if (first && first.score >= 0.96 && (!second || first.score - second.score >= 0.03)) {
      handle = first.oh;
    }
  }
  if (!handle || !PRODUCT_INDEX.has(handle)) return null;
  const v = h.u.searchParams.get("variant");
  const base = `${SITE}/products/${handle}`;
  return v && PRODUCT_INDEX.get(handle)!.has(v) ? `${base}?variant=${v}` : base;
}

// Produktlinks pruefen (erfundene reparieren oder entfernen, Linktext bleibt
// stehen) und Gedankenstriche ersetzen (Hausregel, Haiku streut sie gern
// ein, auch Shopify-Titel enthalten welche).
export function sanitizeBotReply(text: string, offered: string[] = []): string {
  let out = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (m, label: string, url: string) => {
      if (isValidShopUrl(url)) return m;
      const fixed = repairShopUrl(url, offered);
      console.warn("[chat] invalid product link", fixed ? "repaired" : "removed", url);
      return fixed ? `[${label}](${fixed})` : label;
    }
  );
  out = out.replace(/(^|[\s(])(https?:\/\/[^\s)\]]+)/g, (m, pre: string, url: string) => {
    const trail = url.match(/[.,;:!?]+$/)?.[0] ?? "";
    const clean = trail ? url.slice(0, -trail.length) : url;
    if (isValidShopUrl(clean)) return m;
    const fixed = repairShopUrl(clean, offered);
    console.warn("[chat] invalid product link", fixed ? "repaired" : "removed", clean);
    return fixed ? pre + fixed + trail : pre;
  });
  return out.replace(/\s[–—]\s/g, ", ").replace(/[–—]/g, "-");
}
