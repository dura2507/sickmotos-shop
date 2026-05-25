// Google Merchant Center product feed.
//
// Submit URL: https://www.sick-motos.com/merchant-feed.xml
// at merchants.google.com -> Products -> Feeds -> Add primary feed.
//
// One entry per product (parent). For products with multiple variants
// you can either submit each variant as a separate item or use
// item_group_id. We aggregate to the parent for now; if Thomas needs
// per-variant pricing in Shopping Ads we can expand later.
//
// Spec reference:
// https://support.google.com/merchants/answer/7052112

import { NextResponse } from "next/server";
import { allProducts, categorize, cleanTitle, getPrice, htmlToBlocks } from "@/lib/products";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sick-motos.com";

// Refresh once an hour at the edge; matches the cadence we expect
// Shopify webhook -> Vercel rebuild to push fresh data anyway.
export const revalidate = 3600;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const items = allProducts
    .filter((p) => p.variants.some((v) => v.available))
    .map((p) => {
      const { price, compareAt } = getPrice(p);
      const description =
        htmlToBlocks(p.body_html).slice(0, 3).join(" ").slice(0, 5000) ||
        cleanTitle(p.title);
      const image = p.images[0]?.src || "";
      const inStock = p.variants.some((v) => v.available);
      const sku = p.variants[0]?.sku || p.handle;
      const gtin = "";

      const parts: string[] = [
        "<item>",
        `<g:id>${esc(p.handle)}</g:id>`,
        `<g:title>${esc(cleanTitle(p.title))}</g:title>`,
        `<g:description>${esc(description)}</g:description>`,
        `<g:link>${BASE}/products/${esc(p.handle)}</g:link>`,
        image ? `<g:image_link>${esc(image)}</g:image_link>` : "",
        `<g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>`,
        `<g:price>${price.toFixed(2)} EUR</g:price>`,
        compareAt && compareAt > price
          ? `<g:sale_price>${price.toFixed(2)} EUR</g:sale_price>`
          : "",
        `<g:condition>new</g:condition>`,
        `<g:brand>${esc(p.vendor || "SickMotos")}</g:brand>`,
        sku ? `<g:mpn>${esc(sku)}</g:mpn>` : "",
        gtin ? `<g:gtin>${esc(gtin)}</g:gtin>` : "",
        `<g:identifier_exists>${gtin ? "yes" : "no"}</g:identifier_exists>`,
        `<g:product_type>${esc(categorize(p))}</g:product_type>`,
        // Required for vehicles category: declare fits via custom labels.
        // Shopify-style "fits" tags map to Google Vehicle Universal feed
        // fields, but for the regular Apparel/Parts category we just put
        // it into product_type. If Thomas later wants vehicle-aware
        // Shopping ads we expand to <g:product_detail> + Vehicle taxonomy.
        "</item>",
      ];
      return parts.filter(Boolean).join("\n");
    });

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n` +
    `<channel>\n` +
    `<title>SickMotos</title>\n` +
    `<link>${BASE}</link>\n` +
    `<description>Performance parts for Beta, Fantic, KTM &amp; more.</description>\n` +
    items.join("\n") +
    `\n</channel>\n</rss>\n`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
