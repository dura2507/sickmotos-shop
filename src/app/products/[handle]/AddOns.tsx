import Image from "next/image";
import Link from "next/link";
import type { CardProduct } from "@/lib/products";
import { fmtEUR } from "@/lib/products";

// "Add-on Einblendung" Thomas asked for: complementary parts shown right under
// the buy panel so riders can add them to the build.
export function AddOns({ items }: { items: CardProduct[] }) {
  const list = items.slice(0, 5);
  if (list.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-5">
      <p className="mb-1 flex items-center gap-2 font-display text-lg uppercase tracking-tight text-fg">
        <span className="h-1 w-6 rounded-full bg-accent" />
        Complete your setup
      </p>
      <p className="mb-4 text-xs text-fg-muted">Add-ons that go well with this part.</p>

      <div className="flex flex-col divide-y divide-border">
        {list.map((p) => (
          <Link
            key={p.handle}
            href={`/products/${p.handle}`}
            className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2">
              {p.image && (
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="56px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-fg transition-colors group-hover:text-accent">
                {p.title}
              </p>
              <span className="text-sm font-semibold text-fg">{fmtEUR(p.price)}</span>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-fg/25 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-fg transition-colors group-hover:border-accent group-hover:text-accent">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Add
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
