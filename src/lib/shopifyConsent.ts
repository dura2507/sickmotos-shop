// Brücke zwischen unserem Cookie-Banner und Shopifys Consent-System.
//
// Problem: die Storefront läuft headless auf sickmotos.com, der Checkout auf
// checkout.sickmotos.com bei Shopify. Unser Banner schrieb die Zustimmung nur
// in localStorage, und localStorage ist origin-gebunden. Der Checkout wusste
// also nie, dass der Kunde zugestimmt hat, und Shopifys eigener Opt-in-Banner
// (aktiv in 31 EU-Regionen) blockierte dort die Kauf-Conversion der
// Google&YouTube-App. Sichtbar als 9 Ads-Käufe bei 198 Bestellungen.
//
// Fix, wie Hydrogen es macht: Shopifys consent-tracking-api setzt den
// _tracking_consent-Cookie. Mit storefrontRootDomain=sickmotos.com gilt der
// Cookie für die ganze Root-Domain, checkout.sickmotos.com liest ihn und die
// App-Pixel dürfen für zustimmende Kunden feuern. Wer ablehnt, bleibt
// abgelehnt, wir übertragen nur die echte Wahl des Kunden.

const SCRIPT_SRC =
  "https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js";

const CHECKOUT_ROOT_DOMAIN = "checkout.sickmotos.com";
const STOREFRONT_ROOT_DOMAIN = "sickmotos.com";

type CustomerPrivacy = {
  setTrackingConsent: (
    consent: Record<string, unknown>,
    callback: (result?: { error?: unknown }) => void
  ) => void;
};

let scriptPromise: Promise<CustomerPrivacy | null> | null = null;

function loadCustomerPrivacy(): Promise<CustomerPrivacy | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const w = window as unknown as {
    Shopify?: { customerPrivacy?: CustomerPrivacy };
  };
  if (w.Shopify?.customerPrivacy) {
    return Promise.resolve(w.Shopify.customerPrivacy);
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve(w.Shopify?.customerPrivacy ?? null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

// Überträgt die Banner-Entscheidung an Shopify. Fehler sind bewusst leise:
// scheitert der Sync (Adblocker, offline), verhält sich die Seite wie vorher,
// nur ohne die Checkout-Messung. Kein Feature darf daran hängen.
export function syncShopifyConsent(
  granted: boolean,
  storefrontAccessToken: string | undefined
): void {
  if (!storefrontAccessToken) return;
  loadCustomerPrivacy().then((cp) => {
    if (!cp) return;
    try {
      cp.setTrackingConsent(
        {
          marketing: granted,
          analytics: granted,
          preferences: granted,
          sale_of_data: granted,
          headlessStorefront: true,
          checkoutRootDomain: CHECKOUT_ROOT_DOMAIN,
          storefrontRootDomain: STOREFRONT_ROOT_DOMAIN,
          storefrontAccessToken,
        },
        (result) => {
          if (result && result.error) {
            console.warn("[consent] Shopify-Sync fehlgeschlagen:", result.error);
          }
        }
      );
    } catch (e) {
      console.warn("[consent] Shopify-Sync fehlgeschlagen:", e);
    }
  });
}
