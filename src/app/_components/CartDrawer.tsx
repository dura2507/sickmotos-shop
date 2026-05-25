"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { trackBeginCheckout } from "@/lib/analytics";
import {
  fetchCart,
  removeFromCart,
  subscribeCart,
  updateCartLine,
  type Cart,
  type CartLine,
} from "@/lib/cartStore";

const fmt = (amount: string, currency: string) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(
    parseFloat(amount)
  );

type Props = {
  open: boolean;
  onClose: () => void;
};

type CrossSellItem = {
  handle: string;
  title: string;
  price: number;
  compareAt: number | null;
  image: string;
};

export function CartDrawer({ open, onClose }: Props) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [busyLineId, setBusyLineId] = useState<string | null>(null);
  const [crossSell, setCrossSell] = useState<CrossSellItem[]>([]);

  useEffect(() => setMounted(true), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const c = await fetchCart();
      setCart(c);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return subscribeCart(() => refresh());
  }, [refresh]);

  // Pull cross-sell suggestions when the drawer opens. Exclude handles
  // already in the cart so we don't propose what's already there.
  useEffect(() => {
    if (!open) return;
    const excludes = (cart?.lines.nodes ?? [])
      .map((l) => l.merchandise.product.handle)
      .filter(Boolean);
    const qs = excludes.map((h) => `exclude=${encodeURIComponent(h)}`).join("&");
    fetch(`/api/cross-sell?${qs}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setCrossSell(d.items ?? []))
      .catch(() => setCrossSell([]));
  }, [open, cart]);

  // Lock background scroll while open. The drawer has its own scroll.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function changeQty(line: CartLine, next: number) {
    setBusyLineId(line.id);
    try {
      const updated = await updateCartLine(line.id, next);
      setCart(updated);
    } catch {
      // Silent — UI keeps last known state. We could toast here.
    } finally {
      setBusyLineId(null);
    }
  }

  async function removeLine(line: CartLine) {
    setBusyLineId(line.id);
    try {
      const updated = await removeFromCart([line.id]);
      setCart(updated);
    } catch {
      // ignore
    } finally {
      setBusyLineId(null);
    }
  }

  if (!mounted || !open) return null;

  const isEmpty = !cart || cart.lines.nodes.length === 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-bg/80 backdrop-blur-sm md:items-stretch md:justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Cart"
    >
      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div
        className="relative ml-auto flex h-full w-full flex-col bg-bg text-fg shadow-2xl md:w-[420px] md:border-l md:border-border"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl uppercase tracking-tight">
              Cart
            </span>
            {cart && cart.totalQuantity > 0 && (
              <span className="text-xs font-bold uppercase tracking-wider text-fg-muted">
                {cart.totalQuantity} {cart.totalQuantity === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close cart"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full border border-border-strong text-fg-muted transition-colors hover:border-accent hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto">
          {loading && !cart && (
            <div className="flex flex-1 items-center justify-center text-sm text-fg-muted">
              Loading...
            </div>
          )}

          {!loading && isEmpty && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="grid size-16 place-items-center rounded-full border border-border bg-surface text-fg-muted">
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M3 5h2l2.5 11h11l2-8H6.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="17" cy="20" r="1.4" />
                </svg>
              </div>
              <p className="font-display text-lg uppercase tracking-tight">
                Your cart is empty
              </p>
              <p className="max-w-xs text-sm text-fg-muted">
                Add parts from the shop and they will show up here.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
              >
                Continue browsing
              </button>
            </div>
          )}

          {!isEmpty && crossSell.length > 0 && (
            <div className="border-t border-border bg-surface/30 px-4 pt-4 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
                Add to your order
              </span>
              <ul className="mt-3 flex flex-col gap-2">
                {crossSell.map((cs) => (
                  <li key={cs.handle}>
                    <a
                      href={`/products/${cs.handle}`}
                      onClick={onClose}
                      className="group flex items-center gap-3 rounded-lg border border-border bg-bg p-2.5 transition-colors hover:border-accent"
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                        {cs.image && (
                          <Image
                            src={cs.image}
                            alt={cs.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="line-clamp-2 text-xs text-fg">
                          {cs.title}
                        </span>
                        <span className="mt-0.5 text-[11px] font-semibold text-accent">
                          {fmt(cs.price.toFixed(2), cart!.cost.subtotalAmount.currencyCode)}
                        </span>
                      </div>
                      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-muted transition-colors group-hover:text-accent" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isEmpty && (
            <ul className="flex flex-col divide-y divide-border">
              {cart!.lines.nodes.map((line) => {
                const img = line.merchandise.image || line.merchandise.product.featuredImage;
                const isBusy = busyLineId === line.id;
                const variantTitle = line.merchandise.selectedOptions
                  .filter((o) => o.value && o.name.toLowerCase() !== "title")
                  .map((o) => o.value)
                  .join(" / ");
                return (
                  <li key={line.id} className="flex gap-3 p-4">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                      {img && (
                        <Image
                          src={img.url}
                          alt={img.altText ?? line.merchandise.product.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <a
                        href={`/products/${line.merchandise.product.handle}`}
                        className="line-clamp-2 text-sm font-medium text-fg hover:text-accent"
                      >
                        {line.merchandise.product.title}
                      </a>
                      {variantTitle && (
                        <span className="truncate text-[11px] text-fg-dim">
                          {variantTitle}
                        </span>
                      )}
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1 rounded-full border border-border-strong">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={isBusy}
                            onClick={() => changeQty(line, line.quantity - 1)}
                            className="grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:text-accent disabled:opacity-50"
                          >
                            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M5 12h14" strokeLinecap="round" />
                            </svg>
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={isBusy}
                            onClick={() => changeQty(line, line.quantity + 1)}
                            className="grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:text-accent disabled:opacity-50"
                          >
                            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-fg">
                          {fmt(line.cost.totalAmount.amount, line.cost.totalAmount.currencyCode)}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => removeLine(line)}
                        className="self-start text-[11px] uppercase tracking-wider text-fg-dim transition-colors hover:text-accent disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="border-t border-border p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-fg-muted">
                Subtotal
              </span>
              <span className="font-display text-2xl text-fg">
                {fmt(cart!.cost.subtotalAmount.amount, cart!.cost.subtotalAmount.currencyCode)}
              </span>
            </div>
            <p className="mb-4 text-[11px] text-fg-dim">
              Shipping and taxes calculated at checkout.
            </p>
            <a
              href={cart!.checkoutUrl}
              onClick={() =>
                trackBeginCheckout({
                  value: parseFloat(cart!.cost.subtotalAmount.amount),
                  items: cart!.totalQuantity,
                })
              }
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-sm font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
            >
              Checkout
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
