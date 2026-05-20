"use client";

import { useState } from "react";
import type { Product } from "./product-data";

const fmt = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

type TabKey = "description" | "specs" | "installation" | "reviews";

const tabs: { key: TabKey; label: string }[] = [
  { key: "description", label: "Description" },
  { key: "specs", label: "Specifications" },
  { key: "installation", label: "Installation" },
  { key: "reviews", label: "Reviews" },
];

export function InfoTabs({ product: p }: { product: Product }) {
  const [active, setActive] = useState<TabKey>("description");

  return (
    <section className="border-y border-border bg-surface/30 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="-mx-6 flex gap-1 overflow-x-auto whitespace-nowrap border-b border-border px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`relative shrink-0 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                active === t.key
                  ? "text-fg"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              {t.label}
              {active === t.key && (
                <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-[2fr_1fr]">
          <div className="text-sm leading-relaxed text-fg-muted">
            {active === "description" && (
              <div className="flex flex-col gap-4">
                <p className="text-base text-fg">{p.description}</p>
                <ul className="flex flex-col gap-2 text-fg-muted">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {active === "specs" && (
              <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
                {p.specs.map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col gap-1 bg-bg p-4"
                  >
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-fg-dim">
                      {s.label}
                    </dt>
                    <dd className="text-sm text-fg">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {active === "installation" && (
              <ol className="flex flex-col gap-4">
                {p.installation.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-display text-3xl leading-none text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="pt-1.5 text-fg">{step}</span>
                  </li>
                ))}
              </ol>
            )}

            {active === "reviews" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-bg p-5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl text-accent">
                      {p.rating.toFixed(1)}
                    </span>
                    <div className="flex gap-0.5 text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} viewBox="0 0 20 20" className="size-4 fill-current">
                          <path d="M10 1l2.59 5.95L19 7.95l-4.5 4.4 1.06 6.2L10 15.5l-5.56 3.05L5.5 12.35 1 7.95l6.41-1z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-fg-muted">
                    Based on {p.reviewCount} verified reviews
                  </span>
                </div>
                {p.reviews.map((r) => (
                  <article
                    key={r.name}
                    className="rounded-lg border border-border bg-bg p-5"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-semibold text-fg">{r.name}</span>
                      <span className="text-xs text-fg-dim">· {r.country}</span>
                      {r.verified && (
                        <span className="ml-auto rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="mb-2 flex gap-0.5 text-accent">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <svg key={i} viewBox="0 0 20 20" className="size-3.5 fill-current">
                          <path d="M10 1l2.59 5.95L19 7.95l-4.5 4.4 1.06 6.2L10 15.5l-5.56 3.05L5.5 12.35 1 7.95l6.41-1z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-fg">
                      &ldquo;{r.text}&rdquo;
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-3">
            <BundleCard product={p} />
          </aside>
        </div>
      </div>
    </section>
  );
}

function BundleCard({ product: p }: { product: Product }) {
  const total = p.bundle.items.reduce((s, i) => s + i.price, 0);
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-5">
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-fg-dim">
        Often paired
      </span>
      <h3 className="mt-2 font-display text-2xl uppercase tracking-tight">
        {p.bundle.title}
      </h3>
      <p className="mt-1 text-xs text-fg-muted">{p.bundle.subtitle}</p>
      <ul className="mt-4 flex flex-col gap-2 text-sm text-fg">
        {p.bundle.items.map((it) => (
          <li key={it.title} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent" />
            <span className="flex-1">{it.title}</span>
            <span className="text-fg-dim">{fmt(it.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-[10px] uppercase tracking-wider text-fg-dim">
          All three together
        </span>
        <span className="font-display text-2xl text-fg">{fmt(total)}</span>
      </div>
    </div>
  );
}
