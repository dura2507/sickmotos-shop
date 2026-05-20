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

      <section className="relative isolate overflow-hidden border-b border-border py-10 md:py-16">
        <div
          aria-hidden
          className="drift-glow pointer-events-none absolute -left-40 top-1/3 -z-10 size-[640px] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(225,6,0,0.18), transparent 70%)",
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
          className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-1/3"
          style={{
            background:
              "linear-gradient(135deg, transparent 0%, rgba(225,6,0,0.06) 100%)",
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
