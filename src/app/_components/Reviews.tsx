import { Flag, type FlagCode } from "./Flag";

const reviews: { name: string; country: string; code: FlagCode; text: string }[] = [
  {
    name: "Dominic Lenk",
    country: "Austria",
    code: "AT",
    text: "Super quality and perfect fit. 👍",
  },
  {
    name: "Dominik M",
    country: "Romania",
    code: "RO",
    text: "Super fast shipping! The product looks great, I'm already looking forward to installing it 👍",
  },
  {
    name: "El HaMbRiO",
    country: "Germany",
    code: "DE",
    text: "I am really satisfied with the service. The questions are also answered quickly.",
  },
  {
    name: "Jim The Barber",
    country: "Luxembourg",
    code: "LU",
    text: "The graphics are sick 🔥🪒💪🏼",
  },
];

export function Reviews() {
  return (
    <section className="border-b border-border bg-surface/30 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
            What riders say
          </h2>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-bg px-5 py-3">
            <div className="flex gap-0.5 text-accent">
              {[0, 1, 2, 3, 4].map((i) => (
                <svg
                  key={i}
                  viewBox="0 0 20 20"
                  className="size-5 fill-current"
                >
                  <path d="M10 1l2.59 5.95L19 7.95l-4.5 4.4 1.06 6.2L10 15.5l-5.56 3.05L5.5 12.35 1 7.95l6.41-1z" />
                </svg>
              ))}
            </div>
            <div className="text-sm">
              <div className="font-bold text-fg">4.9 out of 5</div>
              <div className="text-xs text-fg-muted">Verified customer reviews</div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r) => (
            <article
              key={r.name}
              className="reveal flex flex-col gap-4 rounded-lg border border-border bg-bg p-5"
            >
              <div className="flex gap-0.5 text-accent">
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg
                    key={i}
                    viewBox="0 0 20 20"
                    className="size-3.5 fill-current"
                  >
                    <path d="M10 1l2.59 5.95L19 7.95l-4.5 4.4 1.06 6.2L10 15.5l-5.56 3.05L5.5 12.35 1 7.95l6.41-1z" />
                  </svg>
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-fg">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="border-t border-border pt-3 text-sm">
                <div className="font-semibold text-fg">{r.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                  <Flag code={r.code} className="h-3 w-[18px]" />
                  {r.country}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
