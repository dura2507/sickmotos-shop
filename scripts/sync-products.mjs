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
 * Configuration via env var (with sensible default):
 *   SHOPIFY_STORE_DOMAIN  (e.g. sickmotos.myshopify.com)
 *
 * /products.json is paginated 250 at a time. We loop until we get fewer
 * than 250 results back.
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "sickmotos.myshopify.com";
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
    const url = `https://${DOMAIN}/products.json?limit=250&page=${page}`;
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
