import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";
import { PurchasePanel } from "./PurchasePanel";
import { InfoTabs } from "./InfoTabs";
import { Related } from "./Related";
import { AddOns } from "./AddOns";
import { VariantImageProvider } from "./VariantImageContext";
import { isLamp } from "@/lib/essentials";
import {
  cleanTitle,
  getPrice,
  getProductByHandle,
  getProductHandles,
  htmlToBlocks,
  toDetailViewModel,
} from "@/lib/products";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const dynamicParams = true;

export function generateStaticParams() {
  return getProductHandles().map((handle) => ({ handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = getProductByHandle(handle);
  if (!p) return { title: "Product not found | SickMotos" };
  const { price } = getPrice(p);
  const title = `${cleanTitle(p.title)} | SickMotos`;
  const desc = htmlToBlocks(p.body_html)[0]?.slice(0, 160) ??
    `Performance part for ${p.vendor || "SickMotos"}.`;
  return {
    title,
    description: desc,
    // Canonical against the duplicate storefront on checkout.sickmotos.com,
    // which declares itself canonical; without this tag the main domain
    // leaves that call entirely to Google (SC flags it as "Duplikat, vom
    // Nutzer nicht als kanonisch festgelegt"). metadataBase in layout.tsx
    // resolves the relative path to https://sickmotos.com.
    alternates: { canonical: `/products/${handle}` },
    openGraph: {
      title,
      description: desc,
      type: "website",
      // No images here on purpose: an explicit list wins over the generated
      // card in opengraph-image.tsx, which would put the bare Shopify photo
      // back into every link preview.
    },
    other: {
      "product:price:amount": price.toFixed(2),
      "product:price:currency": "EUR",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const shopify = getProductByHandle(handle);
  if (!shopify) notFound();
  const product = toDetailViewModel(shopify);
  const base = "https://sickmotos.com";
  const dict = await getDictionary(await getLocale());

  const productUrl = `${base}/products/${handle}`;
  const availability = (ok: boolean) =>
    ok ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  // Google builds its own offer for the Merchant Center by crawling this
  // markup, and its extractor needs an unambiguous single price per Offer: a
  // lowPrice/highPrice range makes it fail and Merchant rejects the product
  // as "Produktpreis fehlt" (confirmed by Google support, case
  // 6-7428000041097). So no AggregateOffer; every variant is a plain Offer
  // with an explicit price, the default variant first to match the price the
  // page initially displays. Google caps sku at 50 chars, longer values are
  // flagged by Search Console, so anything over that is dropped.
  const skuOf = (raw?: string | null) =>
    raw && raw.length <= 50 ? raw : undefined;
  const variantOffers = product.variants.map((v, i) => ({
    "@type": "Offer",
    priceCurrency: "EUR",
    price: v.price.toFixed(2),
    availability: availability(v.available),
    url: productUrl,
    sku: skuOf(shopify.variants[i]?.sku),
    name: Object.values(v.options).filter(Boolean).join(" / ") || undefined,
  }));

  // Schema.org Product structured data for Google rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.highlights.join(" ").slice(0, 500),
    image: product.images.map((i) => i.src),
    sku: skuOf(shopify.variants[0]?.sku),
    brand: { "@type": "Brand", name: shopify.vendor || "SickMotos" },
    offers: product.variants.length > 1 ? variantOffers : {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.basePrice.toFixed(2),
      availability: availability(product.inStock),
      url: productUrl,
      sku: skuOf(shopify.variants[0]?.sku),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category,
        item: `${base}/shop?category=${encodeURIComponent(product.category)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `${base}/products/${handle}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="border-b border-border bg-bg">
        <nav className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-4 text-xs text-fg-muted md:px-6">
          <Link href="/" className="hover:text-fg">
            {dict.product.breadcrumbHome}
          </Link>
          <span className="text-fg-dim">/</span>
          <Link
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className="hover:text-fg"
          >
            {(dict.categoryCards as Record<string, { name: string }>)[product.category]?.name ?? product.category}
          </Link>
          <span className="text-fg-dim">/</span>
          <span className="line-clamp-1 text-fg">{product.title}</span>
        </nav>
      </div>

      <section
        className="relative isolate border-b border-border py-10 md:py-16"
        style={{ overflowX: "clip" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-48 top-1/4 -z-10 size-[520px] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(225,6,0,0.10), transparent 70%)",
          }}
        />
        {/* soft cool glow bottom-left for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 bottom-0 -z-10 size-[460px] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(80,110,160,0.07), transparent 70%)",
          }}
        />
        {/* subtle diagonal light sweep instead of the boxy grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(118deg, transparent 33%, rgba(255,255,255,0.035) 49%, rgba(225,6,0,0.06) 53%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,20,20,0.5) 0%, transparent 30%, transparent 70%, rgba(20,20,20,0.5) 100%)",
          }}
        />

        <VariantImageProvider>
          <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-[1fr_1fr] md:gap-12 md:px-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="min-w-0 md:max-w-[520px]">
              <Gallery images={product.images} />
            </div>
            <div className="min-w-0 md:sticky md:top-32 md:self-start">
              <PurchasePanel product={product} />
              <AddOns
                items={product.addOns}
                lampAutoBundled={isLamp(product.handle, product.title, product.category)}
              />
            </div>
          </div>
        </VariantImageProvider>
      </section>

      <InfoTabs product={product} />
      <Related items={product.related} />
    </>
  );
}
