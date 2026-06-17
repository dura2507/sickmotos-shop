#!/usr/bin/env node
/**
 * Pulls a fresh /products.json snapshot from the Shopify storefront and
 * writes it to src/data/products.json so the static build picks up the
 * latest titles, prices, inventory and variants.
 *
 * Runs automatically before every `next build` (see package.json
 * "prebuild"). When the Shopify webhook fires its deploy hook, Vercel
 * rebuilds, which triggers this script, which gives us fresh data.
 *
 * Configuration via env vars (with sensible defaults):
 *   SHOPIFY_STORE_DOMAIN  (e.g. sickmotos.myshopify.com)
 *   SHOPIFY_MARKET_COUNTRY (ISO code, e.g. DE) — pins the Market so prices
 *     are deterministic regardless of where the build runs.
 *
 * Why the country pin matters: Shopify Markets serves geo-adjusted prices
 * on /products.json based on the *requester's* region. Vercel build servers
 * run in the US, so without this pin the build baked US-market prices
 * (~+20%) into the static site and every EU customer saw inflated prices.
 * We pin to the primary market (DE/EU) so the baked prices match what real
 * customers see on www.sick-motos.com.
 *
 * /products.json is paginated 250 at a time. We loop until we get fewer
 * than 250 results back.
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "sickmotos.myshopify.com";
const COUNTRY = process.env.SHOPIFY_MARKET_COUNTRY || "DE";
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "products.json"
);

async function main() {
  const all = [];
  for (let page = 1; page < 50; page++) {
    const url = `https://${DOMAIN}/products.json?limit=250&page=${page}&country=${COUNTRY}`;
    const r = await fetch(url);
    if (!r.ok) {
      throw new Error(`Shopify products.json page ${page}: ${r.status}`);
    }
    const data = await r.json();
    const products = data.products ?? [];
    all.push(...products);
    if (products.length < 250) break;
  }
  // Write as a top-level array to match what src/lib/products.ts expects.
  await writeFile(OUT, JSON.stringify(all, null, 2));
  console.log(`[sync-products] wrote ${all.length} products to ${OUT}`);
}

main().catch((e) => {
  // Don't fail the build if Shopify is briefly unreachable — fall back
  // to the committed snapshot. We still want deploys to succeed.
  console.warn("[sync-products] failed, keeping existing snapshot:", e.message);
  process.exit(0);
});
