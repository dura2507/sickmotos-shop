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
    <section className="relative isolate border-y border-border py-16 md:py-20" style={{ overflowX: "clip" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, #141414 0%, #101010 50%, #141414 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 30%, black 70%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 30%, black 70%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="drift-glow pointer-events-none absolute right-[-18%] top-1/2 -z-10 size-[520px] -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,6,0,0.18), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(225,6,0,0.45) 50%, transparent 100%)",
        }}
      />
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
