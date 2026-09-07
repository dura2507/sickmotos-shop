import Image from "next/image";
import Link from "next/link";
import {
  cleanTitle,
  fmtEUR,
  getHighlightProducts,
  getPrice,
  htmlToBlocks,
  isInStock,
} from "@/lib/products";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

// Homepage highlight for a new product. Everything shown (title, price, photos,
// description excerpt) comes from the Shopify product Thomas tagged
// "Highlight"; nothing is authored here. Renders nothing while no product
// carries the tag, so the section can ship before the product exists.
export async function NewHighlight() {
  const product = getHighlightProducts(1)[0];
  if (!product) return null;

  const dict = await getDictionary(await getLocale());
  const t = dict.newHighlight;
  const { price, compareAt } = getPrice(product);
  const images = product.images.slice(0, 4);
  const [hero, ...thumbs] = images;
  const excerpt = htmlToBlocks(product.body_html)
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 260)
    .replace(/\s\S*$/, "");
  const title = cleanTitle(product.title);
  const href = `/products/${product.handle}`;

  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-bg py-16 md:py-24">
      <div
        aria-hidden
        className="drift-glow pointer-events-none absolute left-1/3 top-1/2 -z-10 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full md:size-[760px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,6,0,0.35), transparent 70%)",
        }}
      />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-[1.15fr_1fr] md:gap-14">
        <div className="flex flex-col gap-3">
          {hero && (
            <Link
              href={href}
              className="reveal-soft relative block aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface"
            >
              <Image
                src={hero.src}
                alt={hero.alt || title}
                fill
                priority={false}
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </Link>
          )}
          {thumbs.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {thumbs.map((img) => (
                <Link
                  key={img.id}
                  href={href}
                  className="reveal relative aspect-square overflow-hidden rounded-lg border border-border bg-surface"
                >
                  <Image
                    src={img.src}
                    alt={img.alt || title}
                    fill
                    sizes="(max-width: 768px) 33vw, 20vw"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            {t.kicker}
          </span>
          <h2 className="font-display text-balance text-4xl uppercase leading-[0.95] tracking-tight md:text-6xl">
            {title}
          </h2>
          {excerpt && (
            <p className="max-w-md text-base leading-relaxed text-fg-muted">
              {excerpt}
              {excerpt.length < htmlToBlocks(product.body_html).join(" ").length ? " ..." : ""}
            </p>
          )}
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl text-fg">{fmtEUR(price)}</span>
            {compareAt && compareAt > price && (
              <span className="text-sm text-fg-dim line-through">
                {fmtEUR(compareAt)}
              </span>
            )}
            {isInStock(product) && (
              <span className="rounded-full border border-border-strong px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                {t.inStock}
              </span>
            )}
          </div>
          <div className="pt-2">
            <Link
              href={href}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
            >
              {t.cta}
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
