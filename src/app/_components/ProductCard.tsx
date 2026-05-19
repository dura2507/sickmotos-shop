import Image from "next/image";

export type ProductCardData = {
  title: string;
  price: string;
  comparePrice?: string;
  image: string;
  fits?: string[];
  stockLeft?: number;
};

function parsePrice(price: string): number {
  const m = price.replace(/[^\d.,]/g, "").replace(",", ".").match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const discount =
    p.comparePrice && parsePrice(p.comparePrice) > parsePrice(p.price)
      ? Math.round(
          (1 - parsePrice(p.price) / parsePrice(p.comparePrice)) * 100
        )
      : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong">
      {discount !== null && discount > 0 && (
        <span className="absolute left-0 top-0 z-10 rounded-br-lg bg-accent px-2.5 py-1 text-xs font-bold text-fg">
          {discount}%
        </span>
      )}
      <div className="relative aspect-square overflow-hidden border-b border-border bg-white">
        <Image
          src={p.image}
          alt={p.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-sm font-medium leading-snug text-fg line-clamp-2">
          {p.title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl text-fg">{p.price}</span>
          {p.comparePrice && (
            <span className="text-sm text-fg-dim line-through">
              {p.comparePrice}
            </span>
          )}
        </div>
        {p.fits && p.fits.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-dim">
              Fits
            </span>
            {p.fits.map((f) => (
              <span
                key={f}
                className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-fg-muted"
              >
                {f}
              </span>
            ))}
          </div>
        )}
        {typeof p.stockLeft === "number" && p.stockLeft <= 3 && (
          <div className="mt-auto flex items-center gap-2 text-xs text-accent">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            Only {p.stockLeft} left in stock
          </div>
        )}
      </div>
    </article>
  );
}
