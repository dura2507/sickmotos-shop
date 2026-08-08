"use client";

// GDPR / TTDSG cookie banner + Google Consent Mode v2 gate for GTM.
//
// How this works:
// - layout.tsx sets Consent Mode DEFAULT = "denied" for ad + analytics BEFORE
//   GTM loads. GTM boots but tags that depend on consent stay dormant.
// - When the user picks "accept" or "reject", we push consent update to the
//   dataLayer. GTM then fires or holds tags accordingly.
// - Choice is persisted in localStorage. No banner shown on subsequent visits
//   unless the user opens preferences (via /legal footer link in the future).
//
// We keep it plain and honest: two big buttons ("accept all" / "reject non-
// essential"), no dark patterns, no pre-checked boxes.

import { useEffect, useState } from "react";
import { useDictionary } from "./LocaleProvider";
import { syncShopifyConsent } from "@/lib/shopifyConsent";

type Choice = "granted" | "denied";
const KEY = "sickmotos:consent:v1";

type Consent = {
  ad_storage: Choice;
  ad_user_data: Choice;
  ad_personalization: Choice;
  analytics_storage: Choice;
  functionality_storage: Choice;
  security_storage: Choice;
};

function apply(consent: Consent) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  // Push a raw arguments-style entry so GTM/gtag.js reads it as
  // gtag('consent','update',{...}). Works even if gtag helper isn't defined.
  w.dataLayer.push(["consent", "update", consent]);
  if (typeof w.gtag === "function") w.gtag("consent", "update", consent);
}

function persist(consent: Consent) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...consent, ts: Date.now() }));
  } catch {
    // ignore private-mode / disabled storage
  }
}

const ACCEPT_ALL: Consent = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
  functionality_storage: "granted",
  security_storage: "granted",
};

const REJECT: Consent = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "granted",
  security_storage: "granted",
};

export function CookieConsent({ shopifyToken }: { shopifyToken?: string }) {
  const dict = useDictionary();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        setShown(true);
        return;
      }
      // Wiederkehrender Besucher: die frühere Wahl liegt nur in localStorage,
      // der Checkout auf checkout.sickmotos.com kennt sie nicht. Einmal pro
      // Seitenaufruf an Shopify spiegeln, damit der _tracking_consent-Cookie
      // für die Root-Domain existiert, bevor der Kunde in den Checkout geht.
      const stored = JSON.parse(raw) as { ad_storage?: string };
      syncShopifyConsent(stored.ad_storage === "granted", shopifyToken);
    } catch {
      // If localStorage is unavailable, don't bother the user with the banner.
    }
  }, [shopifyToken]);

  if (!shown) return null;

  const accept = () => {
    apply(ACCEPT_ALL);
    persist(ACCEPT_ALL);
    syncShopifyConsent(true, shopifyToken);
    setShown(false);
  };
  const reject = () => {
    apply(REJECT);
    persist(REJECT);
    syncShopifyConsent(false, shopifyToken);
    setShown(false);
  };

  return (
    <div
      role="dialog"
      aria-label={dict.consent.dialogAria}
      className="fixed inset-x-3 bottom-3 z-[90] rounded-2xl border border-accent/40 bg-bg/95 p-4 shadow-2xl shadow-accent/10 ring-1 ring-accent/20 backdrop-blur-md md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md md:p-5"
    >
      <p className="text-sm font-semibold text-fg">{dict.consent.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">
        {dict.consent.body} You can change this any time in{" "}
        <a href="/legal/datenschutz" className="underline hover:text-fg">
          Datenschutz
        </a>
        .
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-2.5">
        <button
          type="button"
          onClick={reject}
          className="flex-1 rounded-full border border-border-strong bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-fg-muted transition-colors hover:border-fg hover:text-fg"
        >
          {dict.consent.onlyEssential}
        </button>
        <button
          type="button"
          onClick={accept}
          className="flex-1 rounded-full bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
        >
          {dict.consent.acceptAll}
        </button>
      </div>
    </div>
  );
}
