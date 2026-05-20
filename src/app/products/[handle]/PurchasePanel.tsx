"use client";

import { useMemo, useState } from "react";
import type { DetailViewModel } from "@/lib/products";

const fmt = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export function PurchasePanel({ product: p }: { product: DetailViewModel }) {
  const [variantSel, setVariantSel] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    p.variantGroups.forEach((g) => {
      const first = g.variants.find((v) => v.available) ?? g.variants[0];
      if (first) init[g.key] = first.id;
    });
    return init;
  });
  const [qty, setQty] = useState(1);

  const selectedVariants = useMemo(
    () =>
      p.variantGroups.flatMap((g) =>
        g.variants.filter((v) => variantSel[g.key] === v.id)
      ),
    [p.variantGroups, variantSel]
  );

  const variantSurcharge = selectedVariants.reduce(
    (sum, v) => sum + (v.priceModifier ?? 0),
    0
  );

  const unitPrice = p.basePrice + variantSurcharge;
  const total = unitPrice * qty;
  const discountPct =
    p.comparePrice && p.comparePrice > p.basePrice
      ? Math.round((1 - p.basePrice / p.comparePrice) * 100)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {p.fitOn[0] && (
            <span className="rounded-full border border-fg/20 bg-bg/60 px-2.5 py-1 font-semibold uppercase tracking-wider text-fg-muted">
              Fits {p.fitOn[0]}
            </span>
          )}
          {discountPct && (
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold uppercase text-accent">
              Save {discountPct}%
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl uppercase leading-tight tracking-tight md:text-3xl">
          {p.title}
        </h1>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-3xl text-fg md:text-4xl">
            {fmt(unitPrice)}
          </span>
          {p.comparePrice && (
            <span className="text-base text-fg-dim line-through">
              {fmt(p.comparePrice)}
            </span>
          )}
          <span className="text-[11px] text-fg-dim">incl. VAT</span>
        </div>
        {!p.inStock && (
          <div className="mt-1 text-xs text-accent">Currently sold out</div>
        )}
      </div>

      {p.variantGroups
        .filter((g) => g.variants.length > 1)
        .map((g) => (
          <div key={g.key} className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-dim">
              {g.title}
            </span>
            <div className="flex flex-wrap gap-2">
              {g.variants.map((v) => {
                const selected = variantSel[g.key] === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!v.available}
                    onClick={() =>
                      setVariantSel((prev) => ({ ...prev, [g.key]: v.id }))
                    }
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      selected
                        ? "border-accent bg-accent/10 text-fg"
                        : v.available
                        ? "border-border bg-surface text-fg-muted hover:border-fg/30"
                        : "border-border bg-surface/30 text-fg-dim line-through opacity-60"
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {v.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      <div className="flex items-stretch gap-3">
        <div className="flex items-center rounded-full border border-border-strong">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-11 place-items-center text-fg-muted hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
          <span className="min-w-6 text-center text-sm font-bold text-fg">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => q + 1)}
            className="grid size-11 place-items-center text-fg-muted hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          disabled={!p.inStock}
          className="group flex flex-1 items-center justify-between gap-2 rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-dim md:text-sm"
        >
          <span>{p.inStock ? "Add to cart" : "Sold out"}</span>
          {p.inStock && (
            <span className="font-display text-sm md:text-base">
              {fmt(total)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-fg-muted">
        <span className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface/40 p-2.5 text-center">
          <span className="text-fg">Worldwide</span>
          <span className="text-fg-dim">5-10 days</span>
        </span>
        <span className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface/40 p-2.5 text-center">
          <span className="text-fg">6 months</span>
          <span className="text-fg-dim">warranty</span>
        </span>
      </div>
    </div>
  );
}
