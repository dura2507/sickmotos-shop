// Shopify CDN image sources for next/image.
//
// Thomas uploads originals of up to 6000 px. next/image hands the raw URL to
// the Vercel optimizer, which first downloads the whole original before it
// resizes (measured 27.09.: largest catalog photo 6000x3376, 1.5 MB, 2.2 s
// uncached; optimizer misses of 0.6 to 5.6 s on 11.09.). Shopify's CDN resizes
// on its own edge when the URL carries a width parameter, so every product
// image goes through this helper before it reaches next/image: the same photo
// at width=1600 is 1600x900, 146 KB, 0.2 s. Shopify never upscales, smaller
// originals come back unchanged.
//
// Only cdn.shopify.com URLs are touched, existing query params (the ?v= cache
// key) stay. Local files under /public and any other host pass through as is.
//
// Blog covers still point at the old storefront domain
// (www.sick-motos.com/cdn/shop/files/...). That domain 301s to sickmotos.com
// since the migration, where the path is a 404, so the covers were broken
// (live optimizer answered 404 on 27.09.). Shopify serves the same files on
// cdn.shopify.com under the shop's file store, so those URLs are mapped over.

const SHOPIFY_CDN_HOST = "cdn.shopify.com";

// The store's file root on cdn.shopify.com. The old storefront served the same
// files as /cdn/shop/files/... and /cdn/shop/products/...
const SHOP_FILES_ROOT = "/s/files/1/0534/7380/4477";

const LEGACY_STOREFRONT_HOSTS = new Set([
  "www.sick-motos.com",
  "sick-motos.com",
  "www.sickmotos.com",
  "sickmotos.com",
  "checkout.sickmotos.com",
  "sickmotos.myshopify.com",
]);

// Source width caps per placement. The browser still picks its own candidate
// from the next/image srcset (sizes attribute); these only bound what the
// optimizer has to download from Shopify.
export const SHOPIFY_IMAGE_WIDTH = {
  // 40 to 80 px thumbnails: cart lines, search typeahead, gallery strip,
  // add-ons, order history. 3x displays ask for at most a 256 px candidate.
  thumb: 320,
  // Product cards in 2 to 4 column grids and section backdrops.
  card: 1600,
  // Product gallery main image and the homepage highlight photo.
  hero: 2000,
} as const;

export function shopifyImage(
  src: string | null | undefined,
  maxWidth: number = SHOPIFY_IMAGE_WIDTH.card
): string {
  if (!src) return "";
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    // Relative path (local /public asset) or malformed: leave untouched.
    return src;
  }

  if (
    LEGACY_STOREFRONT_HOSTS.has(url.hostname) &&
    url.pathname.startsWith("/cdn/shop/")
  ) {
    url.protocol = "https:";
    url.hostname = SHOPIFY_CDN_HOST;
    url.port = "";
    url.pathname = SHOP_FILES_ROOT + url.pathname.slice("/cdn/shop".length);
  }

  if (url.hostname !== SHOPIFY_CDN_HOST) return src;

  const width = Math.max(1, Math.round(maxWidth));
  url.searchParams.set("width", String(width));
  return url.toString();
}
