"use client";

import { useEffect, useState } from "react";
import { fetchCart, subscribeCart } from "@/lib/cartStore";
import { CartDrawer } from "./CartDrawer";

export function CartButton() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const c = await fetchCart();
      if (!cancelled) setCount(c?.totalQuantity ?? 0);
    };
    refresh();
    const unsub = subscribeCart(refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
        onClick={() => setOpen(true)}
        className="relative grid size-9 place-items-center rounded-full border border-border-strong text-fg-muted transition-colors hover:border-accent hover:text-fg"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M3 5h2l2.5 11h11l2-8H6.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
        </svg>
        <span
          className={`absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-fg transition-opacity ${
            count > 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
