import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function PromoBar() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <div className="relative z-50 bg-accent text-fg">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wider md:gap-3 md:px-6 md:text-xs">
        <span>{dict.promoBar.newHere}</span>
        <span className="h-3 w-px bg-fg/40" />
        <span>
          {dict.promoBar.code}{" "}
          <span className="rounded bg-fg/15 px-1.5 py-0.5 font-mono tracking-normal">
            {dict.promoBar.codeValue}
          </span>
        </span>
      </div>
    </div>
  );
}
