"use client";

import { useState } from "react";
import type { DetailViewModel } from "@/lib/products";

type TabKey = "description" | "specs";

const tabs: { key: TabKey; label: string }[] = [
  { key: "description", label: "Description" },
  { key: "specs", label: "Specifications" },
];

export function InfoTabs({ product: p }: { product: DetailViewModel }) {
  const [active, setActive] = useState<TabKey>("description");
  const blocks = p.description.split(/\n+/).filter(Boolean);

  return (
    <section className="border-y border-border bg-surface/30 py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
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

        <div className="mt-8 text-sm leading-relaxed text-fg-muted">
          {active === "description" && (
            <div className="flex flex-col gap-3">
              {blocks.length > 0 ? (
                blocks.map((b, i) => (
                  <p key={i} className="text-fg">
                    {b}
                  </p>
                ))
              ) : (
                <p>No description available.</p>
              )}
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
        </div>
      </div>
    </section>
  );
}
