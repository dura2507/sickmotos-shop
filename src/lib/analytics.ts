// Thin wrappers around Plausible AND the GA4/GTM dataLayer. Both are
// fire-and-forget; never let analytics break the checkout. Use the
// high-level helpers (trackAddToCart, trackBeginCheckout, trackViewItem)
// so we send the right schema to both providers from one call.

type PlausibleProps = Record<string, string | number | boolean>;
type PlausibleFn = (
  event: string,
  options?: {
    props?: PlausibleProps;
    revenue?: { currency: string; amount: number };
  }
) => void;

type DataLayerPush = (payload: Record<string, unknown>) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
    dataLayer?: { push: DataLayerPush };
  }
}

function pushPlausible(
  event: string,
  options?: { props?: PlausibleProps; revenue?: { currency: string; amount: number } }
): void {
  if (typeof window === "undefined") return;
  if (typeof window.plausible !== "function") return;
  try {
    window.plausible(event, options);
  } catch {
    // swallow
  }
}

function pushDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!window.dataLayer) return;
  try {
    // GA4 wants a clean event boundary, so null out the prior ecommerce
    // payload before pushing the new one (Google's documented pattern).
    if ("ecommerce" in payload) {
      window.dataLayer.push({ ecommerce: null });
    }
    window.dataLayer.push(payload);
  } catch {
    // swallow
  }
}

export function trackEvent(
  event: string,
  options?: { props?: PlausibleProps; revenue?: { currency: string; amount: number } }
): void {
  pushPlausible(event, options);
  pushDataLayer({ event, ...(options?.props ?? {}) });
}

// Ecommerce helpers - send the GA4-shaped payload to dataLayer and a
// flatter version to Plausible.

export type EcommerceItem = {
  item_id: string; // gid or handle
  item_name: string;
  price: number;
  quantity?: number;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
};

export function trackViewItem(item: EcommerceItem): void {
  pushPlausible("view_item", {
    props: { item: item.item_name, handle: item.item_id },
    revenue: { currency: "EUR", amount: item.price },
  });
  pushDataLayer({
    event: "view_item",
    ecommerce: {
      currency: "EUR",
      value: item.price,
      items: [{ quantity: 1, ...item }],
    },
  });
}

export function trackAddToCart(item: EcommerceItem): void {
  const qty = item.quantity ?? 1;
  pushPlausible("add_to_cart", {
    props: { item: item.item_name, handle: item.item_id, qty },
    revenue: { currency: "EUR", amount: item.price * qty },
  });
  pushDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency: "EUR",
      value: item.price * qty,
      items: [{ quantity: qty, ...item }],
    },
  });
}

export function trackBeginCheckout(opts: {
  value: number;
  items: number;
}): void {
  pushPlausible("begin_checkout", {
    props: { items: opts.items },
    revenue: { currency: "EUR", amount: opts.value },
  });
  pushDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: "EUR",
      value: opts.value,
    },
  });
}
