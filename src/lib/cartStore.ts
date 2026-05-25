// Client-side cart store. Mirrors the bikeStore pattern: localStorage
// for persistence, a custom event for cross-component sync within the
// same tab, the native storage event for cross-tab sync. The actual
// cart data lives on Shopify; we keep only the cart ID locally and
// re-fetch the cart contents on mount.

import type { StorefrontCart, StorefrontCartLine } from "./shopify";

const KEY = "sickmotos:cart-id";
const EVT = "sickmotos:cart-changed";

export type CartLineInput = { merchandiseId: string; quantity: number };
export type Cart = StorefrontCart;
export type CartLine = StorefrontCartLine;

function readId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

function writeId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(KEY, id);
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent(EVT));
}

// ---------------------------------------------------------------------------
// API wrappers

async function api<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
  search?: Record<string, string>
): Promise<T> {
  const url = new URL("/api/cart", window.location.origin);
  if (search) for (const [k, v] of Object.entries(search)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `cart api ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchCart(): Promise<Cart | null> {
  const id = readId();
  if (!id) return null;
  try {
    const { cart } = await api<{ cart: Cart | null }>("GET", undefined, { id });
    if (!cart) {
      // Cart got invalidated server-side (expired, abandoned, completed).
      writeId(null);
      return null;
    }
    return cart;
  } catch {
    return null;
  }
}

export async function addToCart(line: CartLineInput): Promise<Cart> {
  const cartId = readId();
  const { cart } = await api<{ cart: Cart }>("POST", {
    cartId: cartId ?? undefined,
    lines: [line],
  });
  writeId(cart.id);
  return cart;
}

export async function updateCartLine(lineId: string, quantity: number): Promise<Cart> {
  const cartId = readId();
  if (!cartId) throw new Error("no cart");
  if (quantity <= 0) {
    return removeFromCart([lineId]);
  }
  const { cart } = await api<{ cart: Cart }>("PATCH", {
    cartId,
    lines: [{ id: lineId, quantity }],
  });
  writeId(cart.id);
  return cart;
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = readId();
  if (!cartId) throw new Error("no cart");
  const { cart } = await api<{ cart: Cart }>("DELETE", { cartId, lineIds });
  writeId(cart.id);
  return cart;
}

export function clearCart(): void {
  writeId(null);
}

// ---------------------------------------------------------------------------
// Subscriptions

export function subscribeCart(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
