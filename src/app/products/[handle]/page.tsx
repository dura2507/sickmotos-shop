import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";
import { PurchasePanel } from "./PurchasePanel";
import { InfoTabs } from "./InfoTabs";
import { Related } from "./Related";
import { product } from "./product-data";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  // For now only one hardcoded product. Will branch by handle once Shopify
  // is wired up.
  if (handle !== product.handle) notFound();

  return (
    <>
      <div className="border-b border-border bg-bg">
        <nav className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-4 text-xs text-fg-muted">
          <Link href="/" className="hover:text-fg">
            Home
          </Link>
          <span className="text-fg-dim">/</span>
          <Link href={product.categoryHref} className="hover:text-fg">
            {product.category}
          </Link>
          <span className="text-fg-dim">/</span>
          <span className="text-fg">{product.title}</span>
        </nav>
      </div>

      <section className="border-b border-border py-10 md:py-16">
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
