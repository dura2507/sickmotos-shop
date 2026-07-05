"use client";

import { useEffect, useMemo, useState } from "react";
import { trackAddToCart, trackViewItem } from "@/lib/analytics";
import { addLinesToCart } from "@/lib/cartStore";
import { isConverter, isLamp } from "@/lib/essentials";
import { leadTimeFor } from "@/lib/leadTime";
import type { DetailViewModel } from "@/lib/products";
import { useVariantImage } from "./VariantImageContext";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVariants = useMemo(
    () =>
      p.variantGroups.flatMap((g) =>
        g.variants.filter((v) => variantSel[g.key] === v.id)
      ),
    [p.variantGroups, variantSel]
  );

  // Resolve user selection against the flat variant list to find the
  // Shopify variant GID we need to send to the cart API.
  const activeVariant = useMemo(() => {
    if (p.variants.length === 0) return null;
    if (p.variants.length === 1) return p.variants[0];
    return (
      p.variants.find((v) =>
        Object.entries(variantSel).every(
          ([key, val]) => v.options[key] === val
        )
      ) ?? null
    );
  }, [p.variants, variantSel]);

  // Tell the gallery to switch to the selected variant's image.
  const vi = useVariantImage();
  useEffect(() => {
    if (activeVariant?.image && vi) vi.setActiveSrc(activeVariant.image);
  }, [activeVariant?.image, vi]);

  // Fire view_item once per product view (base price is stable per product).
  useEffect(() => {
    trackViewItem({
      item_id: p.handle,
      item_name: p.title,
      price: p.basePrice,
      item_brand: p.brand,
      item_category: p.category,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.handle]);

  const unitPrice = activeVariant?.price ?? p.basePrice;
  const compareAt = activeVariant?.compareAt ?? p.comparePrice;
  const total = unitPrice * qty;
  const inStock = activeVariant ? activeVariant.available : p.inStock;
  const discountPct =
    compareAt && compareAt > unitPrice
      ? Math.round((1 - unitPrice / compareAt) * 100)
      : null;
  const lead = leadTimeFor(p.category);
  const productIsLamp = isLamp(p.handle, p.title, p.category);
  const converterAddon = productIsLamp
    ? p.addOns.find((a) => isConverter(a.handle, a.title) && a.defaultVariantGid)
    : undefined;
  const [bundleConverter, setBundleConverter] = useState(true);

  async function handleAddToCart() {
    if (!activeVariant) {
      setError("Select a variant first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const lines = [{ merchandiseId: activeVariant.gid, quantity: qty }];
      if (converterAddon && bundleConverter && converterAddon.defaultVariantGid) {
        lines.push({ merchandiseId: converterAddon.defaultVariantGid, quantity: 1 });
      }
      await addLinesToCart(lines);
      trackAddToCart({
        item_id: p.handle,
        item_name: p.title,
        price: unitPrice,
        quantity: qty,
        item_brand: p.brand,
        item_category: p.category,
      });
      // Auto-open the cart drawer via a global event the header can listen to.
      window.dispatchEvent(new CustomEvent("sickmotos:open-cart"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
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
          {compareAt && compareAt > unitPrice && (
            <span className="text-base text-fg-dim line-through">
              {fmt(compareAt)}
            </span>
          )}
          <span className="text-[11px] text-fg-dim">incl. VAT</span>
        </div>
        {!inStock && (
          <div className="mt-1 text-xs text-accent">Currently sold out</div>
        )}
      </div>

      {lead && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3.5 ${
            lead.long
              ? "border-accent/40 bg-accent/[0.07]"
              : "border-border bg-surface/40"
          }`}
        >
          <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-fg">
              {lead.badge} · {lead.short}
            </span>
            <span className="text-xs leading-relaxed text-fg-muted">
              {lead.note}
            </span>
          </div>
        </div>
      )}

      {p.fitsOn.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface/40 p-3.5">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-fg-dim">
            <svg viewBox="0 0 24 24" className="size-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Fits on
          </span>
          <div className="flex flex-wrap gap-1.5">
            {p.fitsOn.map((m) => (
              <span
                key={m}
                className="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-medium text-fg"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

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

      {converterAddon && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-accent/50 bg-accent/[0.08] p-3.5 transition-colors hover:border-accent">
          <input
            type="checkbox"
            checked={bundleConverter}
            onChange={(e) => setBundleConverter(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
          />
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2 text-sm font-semibold text-fg">
              Add the required converter
              <span className="rounded bg-accent/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
                Required
              </span>
            </span>
            <span className="text-xs text-fg-muted">
              The LED does not work without it. Adds {fmt(converterAddon.price)} to your order.
              {!bundleConverter && (
                <span className="mt-1 block font-semibold text-accent">
                  Heads up: without the converter the lamp will not work.
                </span>
              )}
            </span>
          </div>
        </label>
      )}

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
          disabled={!inStock || busy}
          onClick={handleAddToCart}
          className="group flex flex-1 items-center justify-between gap-2 rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-dim md:text-sm"
        >
          <span>{busy ? "Adding..." : inStock ? "Add to cart" : "Sold out"}</span>
          {inStock && !busy && (
            <span className="font-display text-sm md:text-base">
              {fmt(total)}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="-mt-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[11px] text-fg-muted">
        <span className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface/40 p-2.5 text-center">
          <span className="text-fg">{lead ? "Made to order" : "Worldwide"}</span>
          <span className="text-fg-dim">{lead ? lead.short : "5-10 days"}</span>
        </span>
        <span className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface/40 p-2.5 text-center">
          <span className="text-fg">6 months</span>
          <span className="text-fg-dim">warranty</span>
        </span>
      </div>
    </div>
  );
}
