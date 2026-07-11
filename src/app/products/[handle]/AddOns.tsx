import Image from "next/image";
import Link from "next/link";
import { isConverter } from "@/lib/essentials";
import type { CardProduct } from "@/lib/products";
import { fmtEUR } from "@/lib/products";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

// Complementary parts shown right under the buy panel so riders can add them.
export async function AddOns({ items, lampAutoBundled = false }: { items: CardProduct[]; lampAutoBundled?: boolean }) {
  const list = items.slice(0, 5);
  if (list.length === 0) return null;
  const dict = await getDictionary(await getLocale());
  const t = dict.product;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-5">
      <p className="mb-1 flex items-center gap-2 font-display text-lg uppercase tracking-tight text-fg">
        <span className="h-1 w-6 rounded-full bg-accent" />
        {t.completeSetup}
      </p>
      <p className="mb-4 text-xs text-fg-muted">{t.addOnsSubtitle}</p>

      <div className="flex flex-col divide-y divide-border">
        {list.map((p) => {
          const required = isConverter(p.handle, p.title);
          return (
            <Link
              key={p.handle}
              href={`/products/${p.handle}`}
              className={`group flex items-center gap-3 py-3 first:pt-0 last:pb-0 ${
                required ? "-mx-2 rounded-lg bg-accent/[0.06] px-2" : ""
              }`}
            >
              <div
                className={`relative size-14 shrink-0 overflow-hidden rounded-lg border bg-surface-2 ${
                  required ? "border-accent/60 ring-1 ring-accent/40" : "border-border"
                }`}
              >
                {p.image && (
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="56px"
                    className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {required && (
                  <span className="mb-0.5 inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.4}>
                      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    {t.requiredBadge}
                  </span>
                )}
                <p className="line-clamp-2 text-sm font-medium leading-snug text-fg transition-colors group-hover:text-accent">
                  {p.title}
                </p>
                <span className="text-sm font-semibold text-fg">{fmtEUR(p.price)}</span>
                {required && (
                  <span className="mt-0.5 block text-[11px] text-fg-muted">
                    {lampAutoBundled ? t.converterAutoIncluded : t.converterNeeded}
                  </span>
                )}
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  required
                    ? "border-accent bg-accent/10 text-accent group-hover:bg-accent/20"
                    : "border-fg/25 text-fg group-hover:border-accent group-hover:text-accent"
                }`}
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                {required && lampAutoBundled ? t.details : t.addShort}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
