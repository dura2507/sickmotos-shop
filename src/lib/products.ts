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

export const allProducts: ShopifyProduct[] = raw as unknown as ShopifyProduct[];

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
  };
}

export function getAllCards(): CardProduct[] {
  return allProducts.map(toCard);
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

