import { AskSickBot } from "./AskSickBot";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function FAQ() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <section id="faq" className="scroll-mt-24 border-b border-border py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-10 font-display text-4xl uppercase tracking-tight md:text-5xl">
          {dict.faq.title}
        </h2>

        <div className="divide-y divide-border rounded-lg border border-border bg-surface/40">
          {dict.faq.items.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-base font-medium text-fg list-none [&::-webkit-details-marker]:hidden">
                {f.q}
                <svg
                  viewBox="0 0 24 24"
                  className="size-5 shrink-0 text-fg-muted transition-transform group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden
                >
                  <path
                    d="M12 5v14M5 12h14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-5 text-sm leading-relaxed text-fg-muted">
                {f.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-accent/30 bg-accent/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl uppercase tracking-tight text-fg">
              {dict.faq.stillNotSure}
            </p>
            <p className="mt-1 text-sm text-fg-muted">
              {dict.faq.stillNotSureBody}
            </p>
          </div>
          <AskSickBot label={dict.faq.askSickBot} className="shrink-0" />
        </div>
      </div>
    </section>
  );
}
