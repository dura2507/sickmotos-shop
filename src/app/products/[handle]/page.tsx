import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";
import { PurchasePanel } from "./PurchasePanel";
import { InfoTabs } from "./InfoTabs";
import { Related } from "./Related";
import {
  cleanTitle,
  getPrice,
  getProductByHandle,
  getProductHandles,
  htmlToBlocks,
  toDetailViewModel,
} from "@/lib/products";

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
  if (!p) return { title: "Product not found — SickMotos" };
  const { price } = getPrice(p);
  const title = `${cleanTitle(p.title)} — SickMotos`;
  const desc = htmlToBlocks(p.body_html)[0]?.slice(0, 160) ??
    `Performance part for ${p.vendor || "SickMotos"}.`;
  const image = p.images[0]?.src;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "website",
      images: image ? [{ url: image }] : [],
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
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sick-motos.com";

  // Schema.org Product structured data for Google rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.highlights.join(" ").slice(0, 500),
    image: product.images.map((i) => i.src),
    sku: shopify.variants[0]?.sku ?? handle,
    brand: { "@type": "Brand", name: shopify.vendor || "SickMotos" },
    offers: product.variants.length > 1 ? {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: Math.min(...product.variants.map((v) => v.price)).toFixed(2),
      highPrice: Math.max(...product.variants.map((v) => v.price)).toFixed(2),
      offerCount: product.variants.length,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${base}/products/${handle}`,
    } : {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.basePrice.toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${base}/products/${handle}`,
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
        <nav className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-4 text-xs text-fg-muted">
          <Link href="/" className="hover:text-fg">
            Home
          </Link>
          <span className="text-fg-dim">/</span>
          <Link
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className="hover:text-fg"
          >
            {product.category}
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
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

        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-[1fr_1fr] md:gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="md:max-w-[520px]">
            <Gallery images={product.images} />
          </div>
          <div className="md:sticky md:top-32 md:self-start">
            <PurchasePanel product={product} />
          </div>
        </div>
      </section>

      <InfoTabs product={product} />
      <Related items={product.related} />
    </>
  );
}
