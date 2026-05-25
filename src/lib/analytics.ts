// Thin wrapper around Plausible's window.plausible API. No-op if the
// script never loaded (NEXT_PUBLIC_PLAUSIBLE_DOMAIN unset, ad blocker,
// SSR). Add conversion goals at plausible.io/sites/<domain>/goals.

type PlausibleFn = (
  event: string,
  options?: { props?: Record<string, string | number | boolean>; revenue?: { currency: string; amount: number } }
) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

export function trackEvent(
  event: string,
  options?: {
    props?: Record<string, string | number | boolean>;
    revenue?: { currency: string; amount: number };
  }
): void {
  if (typeof window === "undefined") return;
  if (typeof window.plausible !== "function") return;
  try {
    window.plausible(event, options);
  } catch {
    // never let analytics break the checkout
  }
}
