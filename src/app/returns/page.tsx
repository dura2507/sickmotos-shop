import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ReturnForm } from "./ReturnForm";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(await getLocale());
  return {
    title: dict.returnsPage.metaTitle,
    description: dict.returnsPage.intro,
  };
}

export default async function ReturnsPage() {
  const dict = await getDictionary(await getLocale());
  const t = dict.returnsPage;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          {t.kicker}
        </span>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-tight md:text-5xl">
          {t.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-fg-muted">{t.intro}</p>
      </div>

      <div className="mb-8 flex flex-col gap-3">
        <p className="rounded-xl border border-border-strong bg-surface/60 px-4 py-3 text-xs leading-relaxed text-fg-muted">
          {t.noteNoAttachments}
        </p>
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          {t.noteElectronics}{" "}
          <Link href="/legal/widerruf" className="underline hover:text-fg">
            {t.noteElectronicsLink}
          </Link>
        </p>
      </div>

      <ReturnForm />
    </div>
  );
}
