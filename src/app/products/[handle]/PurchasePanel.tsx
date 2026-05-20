"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Product } from "./product-data";

const fmt = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export function PurchasePanel({ product: p }: { product: Product }) {
  const [variantSel, setVariantSel] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    p.variantGroups.forEach((g) => {
      const first = g.variants.find((v) => v.available);
      if (first) init[g.key] = first.id;
    });
    return init;
  });
  const [addOns, setAddOns] = useState<Set<string>>(new Set());
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
  const addOnTotal = p.addOns
    .filter((a) => addOns.has(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const unitPrice = p.basePrice + variantSurcharge;
  const total = unitPrice * qty + addOnTotal;
  const discountPct =
    p.comparePrice && p.comparePrice > p.basePrice
      ? Math.round((1 - p.basePrice / p.comparePrice) * 100)
      : null;

  const toggleAddon = (id: string) => {
    setAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-fg/20 bg-bg/60 px-2.5 py-1 font-semibold uppercase tracking-wider text-fg-muted">
            Fits {p.brand}
          </span>
          {discountPct && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase text-fg">
              {discountPct}% off
            </span>
          )}
          <span className="flex items-center gap-1 text-fg-muted">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} viewBox="0 0 20 20" className="size-3.5 fill-accent">
                <path d="M10 1l2.59 5.95L19 7.95l-4.5 4.4 1.06 6.2L10 15.5l-5.56 3.05L5.5 12.35 1 7.95l6.41-1z" />
              </svg>
            ))}
            <span className="font-bold text-fg">{p.rating.toFixed(1)}</span>
            <span>({p.reviewCount})</span>
          </span>
        </div>
        <h1 className="font-display text-2xl uppercase leading-tight tracking-tight md:text-3xl">
          {product_full_title(p)}
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
        {p.stockLeft <= 3 && (
          <div className="mt-1 flex items-center gap-2 text-xs text-accent">
            <span className="pulse-accent inline-flex size-1.5 rounded-full bg-accent" />
            Only {p.stockLeft} left in stock
          </div>
        )}
      </div>

      {p.variantGroups.map((g) => (
        <div key={g.key} className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-dim">
            {g.title}
          </span>
          <div className="grid grid-cols-3 gap-2">
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
                  className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors ${
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
                  {v.sub && (
                    <span className="text-[10px] text-fg-dim">{v.sub}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-dim">
            Add-ons
          </span>
          <span className="text-xs text-fg-muted">
            {addOns.size > 0
              ? `+${fmt(addOnTotal)} extras`
              : "Make the most of it"}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {p.addOns.map((a) => {
            const checked = addOns.has(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAddon(a.id)}
                className={`group flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                  checked
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface hover:border-fg/30"
                }`}
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded border-2 transition-colors ${
                    checked
                      ? "border-accent bg-accent text-fg"
                      : "border-fg/30 bg-bg"
                  }`}
                >
                  {checked && (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-border bg-gradient-to-br from-surface-2 to-bg">
                  <Image
                    src={a.image}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-fg">
                    {a.title}
                  </span>
                  <span className="text-xs text-fg-muted">{a.sub}</span>
                </div>
                <span className="shrink-0 text-sm font-semibold text-accent">
                  +{fmt(a.price)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
          className="group flex flex-1 items-center justify-between gap-2 rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi md:text-sm"
        >
          <span>Add to cart</span>
          <span className="font-display text-sm md:text-base">{fmt(total)}</span>
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

function product_full_title(p: Product) {
  return `${p.title} ${p.brand}`;
}
