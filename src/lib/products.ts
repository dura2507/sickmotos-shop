import raw from "@/data/products.json";

export type ShopifyVariant = {
  id: number;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  sku: string | null;
  featured_image: {
    id: number;
    src: string;
    width: number;
    height: number;
    alt: string | null;
  } | null;
};

export type ShopifyImage = {
  id: number;
  src: string;
  width: number;
  height: number;
  position: number;
  alt?: string | null;
};

export type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: { name: string; position: number; values: string[] }[];
  created_at: string;
  updated_at: string;
  published_at: string;
};

// Strip Shopify demo/test products (e.g. "Demo T-Shirt | Automatic recoloring
// | Out of stock | test product" priced at 99999) so they never reach the
// shop, search, bestsellers or any other surface.
function isLiveProduct(p: ShopifyProduct): boolean {
  const t = (p.title || "").toLowerCase();
  if (t.includes("demo") || t.includes("test product") || t.includes("recoloring")) return false;
  const price = parseFloat(p.variants[0]?.price ?? "0");
  if (price >= 5000) return false;
  return true;
}

export const allProducts: ShopifyProduct[] = (
  raw as unknown as ShopifyProduct[]
).filter(isLiveProduct);

// ---------------------------------------------------------------------------
// Categories — derived from product_type + title + tags via keyword rules.

export const CATEGORIES = [
  "Exhaust",
  "LED Headlights",
  "Carbon Parts",
  "ECU Tuning",
  "Brakes",
  "Graphics",
  "Titanium Screws",
  "Merchandise",
  "Wheels",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

const categoryRules: { keywords: string[]; category: Category }[] = [
  { keywords: ["led", "scheinwerfer", "angel eye", "hexagon", "headlight"], category: "LED Headlights" },
  { keywords: ["auspuff", "krümmer", "krummer", "exhaust"], category: "Exhaust" },
  { keywords: ["carbon"], category: "Carbon Parts" },
  { keywords: ["ecu", "mapping", "tuning kit", "fuel-x", "powercommander"], category: "ECU Tuning" },
  { keywords: ["bremsscheibe", "brake", "bremse"], category: "Brakes" },
  { keywords: ["hoodie", "t-shirt", "tshirt", "shirt", "merch"], category: "Merchandise" },
  { keywords: ["titanschraube", "titanium screw", "titan-schraube"], category: "Titanium Screws" },
  { keywords: ["dekor", "graphic", "razor blade", "razor gold", "grand theft", "broken head"], category: "Graphics" },
  { keywords: ["felge", "wheel", "rim"], category: "Wheels" },
];

export function categorize(p: ShopifyProduct): Category {
  const hay = (
    p.title +
    " " +
    p.product_type +
    " " +
    p.tags.join(" ")
  ).toLowerCase();
  for (const rule of categoryRules) {
    if (rule.keywords.some((k) => hay.includes(k))) return rule.category;
  }
  return "Other";
}

// ---------------------------------------------------------------------------
// Bike brands

export const BIKE_BRANDS = [
  "Beta",
  "Husqvarna",
  "KTM",
  "Aprilia",
  "GasGas",
  "Fantic",
  "Yamaha",
  "Sherco",
  "Kreidler",
  "Rieju",
  "Derbi",
  "Suzuki",
  "Ducati",
  "BMW",
  "SWM",
  "Malaguti",
  "Mondial",
  "Honda",
] as const;

export type BikeBrand = (typeof BIKE_BRANDS)[number];

export function getBikeBrands(p: ShopifyProduct): BikeBrand[] {
  const brands = new Set<BikeBrand>();
  for (const tag of p.tags) {
    const m = BIKE_BRANDS.find((b) => b.toLowerCase() === tag.toLowerCase());
    if (m) brands.add(m);
  }
  // also scan title
  const t = p.title.toLowerCase();
  for (const b of BIKE_BRANDS) {
    if (t.includes(b.toLowerCase())) brands.add(b);
  }
  return Array.from(brands);
}

// ---------------------------------------------------------------------------
// Years — extract product-fit years from tags and titles.
//
// We deliberately ignore body_html (marketing copy mentions historical
// years that have nothing to do with bike fit) and standalone year tags
// like '2008-2013' on cross-compat products (those are the fit ranges
// for OTHER brand/model combos on the same SKU and would pollute the
// year row for unrelated models).

const YEAR_RE = /(20[0-2][0-9]|19[89][0-9])/g;
const RANGE_RE = /(20[0-2][0-9])\s*[-–]\s*(20[0-2][0-9])/g;

function yearsFromString(s: string, into: Set<number>) {
  for (const m of s.matchAll(YEAR_RE)) {
    const y = parseInt(m[1], 10);
    if (y >= 1990 && y <= 2030) into.add(y);
  }
  for (const m of s.matchAll(RANGE_RE)) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    for (let y = a; y <= b; y++) into.add(y);
  }
}

export function getYears(p: ShopifyProduct): number[] {
  const years = new Set<number>();
  // Only year tags that also mention a brand are kept (so a generic
  // '2008-2013' tag on a cross-compat brake disc doesn't bleed into
  // every brand's filter). The product title carries explicit fit
  // ranges and is always considered.
  for (const t of p.tags) {
    if (!BRAND_RE.test(t)) continue;
    yearsFromString(t, years);
  }
  yearsFromString(p.title, years);
  return Array.from(years).sort((a, b) => a - b);
}

export function getAllYears(): number[] {
  const all = new Set<number>();
  for (const p of allProducts) {
    for (const y of getYears(p)) all.add(y);
  }
  return Array.from(all).sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Bike models — extract from tags that look like "<Brand> <Model> [year]"

const BRAND_RE = new RegExp(
  `^(${BIKE_BRANDS.join("|")})\\s+`,
  "i"
);

function cleanModelString(s: string): string {
  // strip trailing year or year range
  return s
    .replace(/\s+\d{4}\s*[-–]\s*\d{4}\s*$/i, "")
    .replace(/\s+\d{4}\s*$/i, "")
    .trim();
}

export function getModels(p: ShopifyProduct): string[] {
  // Only use tags. The first option's values are product variant labels
  // (e.g. 'Beta RR 125 LC 2021-2024 Titan Power Bomb EG-ABE') which are
  // not bike models and pollute the BikeFinder with dozens of fake
  // entries per brand.
  const models = new Set<string>();
  for (const c of p.tags) {
    if (!BRAND_RE.test(c)) continue;
    if (c.length > 60) continue;
    const cleaned = cleanModelString(c);
    if (BIKE_BRANDS.includes(cleaned as BikeBrand)) continue;
    models.add(cleaned);
  }
  return Array.from(models);
}

export function getModelsForBrand(brand: string): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  const brandLower = brand.toLowerCase();
  for (const p of allProducts) {
    if (!getBikeBrands(p).includes(brand as BikeBrand)) continue;
    for (const model of getModels(p)) {
      if (!model.toLowerCase().startsWith(brandLower + " ")) continue;
      counts[model] = (counts[model] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// Years that actually apply for a given brand + optional model. Used by the
// Bike Finder so the year row only shows realistic options.
export function getYearsForFit(
  brand: string,
  model: string | null
): number[] {
  const years = new Set<number>();
  const brandLower = brand.toLowerCase();
  const modelLower = model?.toLowerCase();
  for (const p of allProducts) {
    if (!getBikeBrands(p).includes(brand as BikeBrand)) continue;
    if (modelLower) {
      const productModels = getModels(p).map((m) => m.toLowerCase());
      if (!productModels.includes(modelLower)) continue;
    } else {
      const productModels = getModels(p);
      if (
        productModels.length > 0 &&
        !productModels.some((m) =>
          m.toLowerCase().startsWith(brandLower + " ")
        )
      ) {
        continue;
      }
    }

    // Cross-compat products list multiple brands in their tags but only
    // reference one in the title (e.g. an injector titled "...Yamaha WR
    // 125 X/R 2009-2016" that's also tagged Beta RR 125 LC). Title-derived
    // years apply to THIS brand only when the title mentions it; otherwise
    // they belong to a different brand entirely.
    for (const t of p.tags) {
      const tagBrand = BIKE_BRANDS.find((b) =>
        t.toLowerCase().startsWith(b.toLowerCase() + " ")
      );
      if (tagBrand?.toLowerCase() !== brandLower) continue;
      yearsFromString(t, years);
    }
    if (p.title.toLowerCase().includes(brandLower)) {
      yearsFromString(p.title, years);
    }
  }
  return Array.from(years).sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Display helpers

export function getPrice(p: ShopifyProduct): { price: number; compareAt: number | null } {
  const v = p.variants[0];
  return {
    price: parseFloat(v?.price ?? "0"),
    compareAt: v?.compare_at_price ? parseFloat(v.compare_at_price) : null,
  };
}

export function isOnSale(p: ShopifyProduct): boolean {
  const { price, compareAt } = getPrice(p);
  return compareAt !== null && compareAt > price;
}

export function discountPct(p: ShopifyProduct): number | null {
  const { price, compareAt } = getPrice(p);
  if (!compareAt || compareAt <= price) return null;
  return Math.round((1 - price / compareAt) * 100);
}

export function isInStock(p: ShopifyProduct): boolean {
  return p.variants.some((v) => v.available);
}

const EUR = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});
export const fmtEUR = (n: number) => EUR.format(n);

// Strip "SICKMOTOS" prefix and similar for cleaner display
export function cleanTitle(t: string): string {
  return t
    .replace(/^SICKMOTOS\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Convert body_html (Shopify rich text) to plain paragraphs.
export function htmlToBlocks(html: string): string[] {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Lookup

export function getProductByHandle(handle: string): ShopifyProduct | undefined {
  return allProducts.find((p) => p.handle === handle);
}

export function getProductHandles(): string[] {
  return allProducts.map((p) => p.handle);
}

// ---------------------------------------------------------------------------
// Slim product card data for client lists

export type CardProduct = {
  handle: string;
  title: string;
  price: number;
  compareAt: number | null;
  image: string;
  brands: BikeBrand[];
  category: Category;
  inStock: boolean;
  fits: string[];
  years: number[];
  models: string[];
};

export function toCard(p: ShopifyProduct): CardProduct {
  const { price, compareAt } = getPrice(p);
  return {
    handle: p.handle,
    title: cleanTitle(p.title),
    price,
    compareAt,
    image: p.images[0]?.src ?? "",
    brands: getBikeBrands(p),
    category: categorize(p),
    inStock: isInStock(p),
    fits: p.options[0]?.values.slice(0, 4) ?? [],
    years: getYears(p),
    models: getModels(p),
  };
}

export function getAllCards(): CardProduct[] {
  return allProducts.map(toCard);
}

// Slim search index used by the live typeahead. Keep keys short to keep
// the client JS payload small.
export type SearchEntry = {
  h: string; // handle
  t: string; // clean title
  i: string; // image url
  p: number; // price
  f: string[]; // fits (first option values)
  b: string[]; // bike brands this product fits
  m: string[]; // bike models this product fits (lowercased for cheap matching)
};

export function getSearchIndex(): SearchEntry[] {
  return allProducts.map((p) => {
    const { price } = getPrice(p);
    return {
      h: p.handle,
      t: cleanTitle(p.title),
      i: p.images[0]?.src ?? "",
      p: price,
      f: p.options[0]?.values.slice(0, 3) ?? [],
      b: getBikeBrands(p),
      m: getModels(p).map((s) => s.toLowerCase()),
    };
  });
}

// Unique bike list across the whole catalog. Used by the hero typeahead
// so riders can pick their bike and jump to a pre-filtered /shop.
export type BikeEntry = {
  brand: string;
  model: string;   // full string like "Beta RR 125 LC"
  short: string;   // model without the brand prefix
  count: number;   // product count
};

export function getBikeIndex(): BikeEntry[] {
  const map = new Map<string, BikeEntry>();
  for (const p of allProducts) {
    for (const m of getModels(p)) {
      const brand = BIKE_BRANDS.find((b) =>
        m.toLowerCase().startsWith(b.toLowerCase() + " ")
      );
      if (!brand) continue;
      const short = m.slice(brand.length + 1);
      const key = `${brand}::${m}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { brand, model: m, short, count: 1 });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// Pick top selling — Shopify doesn't expose sales count via products.json,
// so we pick on-sale items with the deepest discounts as a proxy.
export function getTopSelling(n = 4): CardProduct[] {
  return allProducts
    .filter((p) => isOnSale(p) && isInStock(p))
    .sort((a, b) => (discountPct(b) ?? 0) - (discountPct(a) ?? 0))
    .slice(0, n)
    .map(toCard);
}

export function getLatestArrivals(n = 8): CardProduct[] {
  return [...allProducts]
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )
    .slice(0, n)
    .map(toCard);
}

export function countByCategory(): Record<Category, number> {
  const acc = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
    Category,
    number
  >;
  for (const p of allProducts) {
    acc[categorize(p)] += 1;
  }
  return acc;
}

export function countByBrand(): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const p of allProducts) {
    for (const b of getBikeBrands(p)) {
      acc[b] = (acc[b] ?? 0) + 1;
    }
  }
  return acc;
}

// ---------------------------------------------------------------------------
// Shop data, pre-computed once per server process. The previous code rebuilt
// every count/model/year map on every request (and getModels re-ran regex per
// call), which made /shop visibly slow under cold starts. This package is
// shipped to ShopBrowser as one frozen blob.

export type ShopData = {
  products: CardProduct[];
  categoryCounts: Record<Category, number>;
  brandCounts: Record<string, number>;
  years: number[];
  brandList: { name: string; count: number }[];
  modelsByBrand: Record<string, { name: string; count: number }[]>;
  yearsByFit: Record<string, number[]>;
};

let cachedShopData: ShopData | null = null;

export function getShopData(): ShopData {
  if (cachedShopData) return cachedShopData;

  const products = allProducts.map(toCard);
  const categoryCounts = countByCategory();
  const brandCounts = countByBrand();
  const years = getAllYears();

  const brandList = (BIKE_BRANDS as readonly string[])
    .map((name) => ({ name, count: brandCounts[name] ?? 0 }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count);

  const modelsByBrand: Record<string, { name: string; count: number }[]> = {};
  const yearsByFit: Record<string, number[]> = {};
  for (const b of BIKE_BRANDS) {
    const models = getModelsForBrand(b);
    if (models.length > 0) modelsByBrand[b] = models;
    const brandYears = getYearsForFit(b, null);
    if (brandYears.length > 0) yearsByFit[b] = brandYears;
    for (const m of models) {
      const k = `${b}::${m.name}`;
      const ys = getYearsForFit(b, m.name);
      if (ys.length > 0) yearsByFit[k] = ys;
    }
  }

  cachedShopData = {
    products,
    categoryCounts,
    brandCounts,
    years,
    brandList,
    modelsByBrand,
    yearsByFit,
  };
  return cachedShopData;
}

// ---------------------------------------------------------------------------
// Detail-page view model. Keeps the existing component API stable while
// reading from real Shopify product data.

export type DetailVariant = {
  id: string;
  label: string;
  sub?: string;
  priceModifier?: number;
  available: boolean;
};

export type DetailViewModel = {
  handle: string;
  title: string;
  category: string;
  brand: string;
  basePrice: number;
  comparePrice: number | null;
  inStock: boolean;
  images: { src: string; alt: string }[];
  fitOn: string[];
  highlights: string[];
  variantGroups: {
    title: string;
    key: string;
    variants: DetailVariant[];
  }[];
  description: string;
  specs: { label: string; value: string }[];
  related: CardProduct[];
};

const SPEC_PATTERNS: { label: string; rx: RegExp }[] = [
  { label: "Weight", rx: /Gewicht[:\s]+([^\n]+?)(?:\n|$)/i },
  { label: "Material", rx: /Material[:\s]+([^\n]+?)(?:\n|$)/i },
  { label: "Origin", rx: /(Made in [A-Za-zäöüÄÖÜß ]+)/ },
];

function extractSpecsFromHtml(html: string, p: ShopifyProduct) {
  const text = htmlToBlocks(html).join("\n");
  const specs: { label: string; value: string }[] = [];
  for (const { label, rx } of SPEC_PATTERNS) {
    const m = text.match(rx);
    if (m) specs.push({ label, value: m[1].trim() });
  }
  if (p.vendor) specs.push({ label: "Brand", value: p.vendor });
  if (p.product_type) specs.push({ label: "Category", value: p.product_type });
  specs.push({ label: "Delivery", value: "4-8 business days" });
  specs.push({
    label: "Warranty",
    value: "6 months on material and workmanship",
  });
  return specs;
}

export function toDetailViewModel(p: ShopifyProduct): DetailViewModel {
  const { price, compareAt } = getPrice(p);
  const inStock = isInStock(p);
  const blocks = htmlToBlocks(p.body_html);

  const variantGroups = p.options.map((opt) => ({
    title: opt.name,
    key: opt.name.toLowerCase().replace(/\s+/g, "-"),
    variants: opt.values.map((val) => {
      const variant = p.variants.find(
        (v) =>
          v.option1 === val ||
          v.option2 === val ||
          v.option3 === val
      );
      return {
        id: val,
        label: val,
        priceModifier: variant
          ? Math.round(parseFloat(variant.price) - price)
          : 0,
        available: variant ? variant.available : false,
      };
    }),
  }));

  const related = allProducts
    .filter((q) => q.handle !== p.handle)
    .filter((q) => {
      // pick products that share at least one bike brand
      const mine = new Set(getBikeBrands(p));
      return getBikeBrands(q).some((b) => mine.has(b));
    })
    .slice(0, 4)
    .map(toCard);

  return {
    handle: p.handle,
    title: cleanTitle(p.title),
    category: categorize(p),
    brand: p.options[0]?.values[0] ?? "",
    basePrice: price,
    comparePrice: compareAt,
    inStock,
    images: p.images.map((img) => ({ src: img.src, alt: img.alt ?? p.title })),
    fitOn: p.options[0]?.values ?? [],
    highlights: blocks.slice(0, 4),
    variantGroups,
    description: blocks.join("\n\n"),
    specs: extractSpecsFromHtml(p.body_html, p),
    related,
  };
}

