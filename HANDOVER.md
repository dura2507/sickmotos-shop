# SickMotos Shop — Handover

Last updated: 2026-06-28

Headless storefront that replaces the Shopify-themed shop at sick-motos.com.
Client: Thomas Krawietz. Performance parts for supermoto / enduro.

---

## 1. Stack & hosting

- **Next.js 16.2.6 (App Router) + React 19 + Tailwind v4 (Turbopack)**.
- **Headless Shopify**: Storefront API for browse/cart, **Shopify-hosted checkout**
  (cart -> `checkoutUrl` redirect). Payments, taxes, order emails, fulfillment all
  live on Shopify's side.
- **Repo**: `github.com/dura2507/sickmotos-shop`, default branch `main`.
- **Deploy**: Vercel **auto-deploys on every push to `main`**. So local -> GitHub
  -> live. Production URL: `https://sickmotos-shop.vercel.app` (custom domain
  pending, see §7).
- AGENTS.md rule: this Next.js has breaking changes vs training data. Read
  `node_modules/next/dist/docs/` before writing Next code.

## 2. Local dev

```
npm install
npm run dev          # Turbopack dev server
```

`.env.local` (gitignored, never commit) needs at least:

```
SHOPIFY_STORE_DOMAIN=sickmotos.myshopify.com
SHOPIFY_STOREFRONT_API_TOKEN=...
SHOPIFY_API_VERSION=...
# optional / feature-gated:
SHOPIFY_MARKET_COUNTRY=DE          # see pricing gotcha below
ANTHROPIC_API_KEY=...              # SickBot
SICKMOTOS_BOT_MODEL=claude-haiku-4-5
NEXT_PUBLIC_GTM_ID=... | NEXT_PUBLIC_PLAUSIBLE_DOMAIN=...   # analytics, off until set
TELEGRAM_BOT_TOKEN=...             # only for the feedback-poll workflow, not the app
```

## 3. Architecture notes / gotchas

- **`prebuild` regenerates product data.** `scripts/sync-products.mjs` runs on every
  Vercel build and OVERWRITES `src/data/products.json` from Shopify `/products.json`.
  The committed file is NOT what ships. Comparing committed JSON to live is misleading.
- **Shopify Markets geo-pricing bug (fixed).** `/products.json` returns prices for the
  requester's region. Vercel builds run in the US -> baked +~20% US prices. Fix: the
  sync script pins `&country=${SHOPIFY_MARKET_COUNTRY||"DE"}`. Keep `SHOPIFY_MARKET_COUNTRY=DE`.
- **Static data lives in `src/data/`**: `products.json` (regenerated), `addons.json`
  (per-product cross-sell, scraped 1:1 from the old site), `fitment.json` ("Fits on"
  model lists), `bestsellers.json` (featured top-5), `legal/*.md` (policy texts).
- `src/lib/products.ts` is the data layer: categorize(), ADDON_MAP, FITMENT_MAP,
  BIKE_BRANDS, getTopSelling(), DetailViewModel.
- Legal pages render markdown from `src/data/legal/*.md` via `src/app/legal/`.

## 4. SickBot (support chat)

- Goal: deflect repetitive customer questions so the team isn't pinged. It resolves
  questions itself; it never points customers to WhatsApp.
- Files: `src/lib/botKnowledge.ts` (system prompt / knowledge base),
  `src/app/api/chat/route.ts` (POST, Anthropic SDK, model via `SICKMOTOS_BOT_MODEL`,
  knowledge cached via `cache_control`), `src/app/_components/SupportChat.tsx` (widget),
  `src/app/_components/AskSickBot.tsx` (CTA that fires `sickmotos:open-chat`).
- Needs `ANTHROPIC_API_KEY` in Vercel. Cost estimate: Haiku ~5-15 EUR/mo at ~1k convos.
- Tone rules in the prompt: human, no AI-slop, **no dashes as connectors** (incl. the
  spaced hyphen " - "), basically no emojis.
- Top real questions (from Shopify Inbox): #1 LED converter vs Akku set; made-to-order
  timing; fitment (H4/H1); returns; pricing.

## 5. Status: done

- Full storefront, 483 products with variants + add-ons + "Fits on".
- Pricing bug fixed; category/brand tiles, reviews (SVG flags), banners reworked;
  mobile pass.
- 11 Shopify email templates branded + checkout branding done.
- SickBot live (red-header design, registration-based returns answer, Akku logic).
- Promo bar targets new customers ("New here? 5% off your first order").

## 6. Pending before go-live

**Code:**
- [x] Honest made-to-order / low-stock UX (`src/lib/leadTime.ts`): made-to-order badge +
      lead time for LED lamps & titanium headers (~2-3 weeks) and a highlighted "made to
      order, 6+ weeks" notice for wheels on the product page, in the shop grid, and per
      line in the cart. No fake stock counters.
- [x] **301 redirects** old Shopify URLs -> new routes in `next.config.ts` (308, verified).
- [ ] Cookie-consent banner on this site once analytics is enabled (the Shopify theme's
      consent app does not run headless).
- [ ] Reviews are static; Judge.me/Trustpilot are Shopify-theme apps and won't render
      headless. Decide: keep static or integrate via API.

**Shopify admin:**
- [x] Reverted the Return & refund policy address back to the Zadar address.
- [x] EXTRA5 limited to new customers ("Customers who haven't purchased") and
      one use per customer. TODO with Thomas: today it only applies to
      11 specific collections (his original setup); clarify whether this stays
      or should be widened to "All products".
- [ ] Confirm Thomas receives order notifications.
- [ ] Klarna: separate Shopify Payment method still to be enabled and connected
      to Thomas's Klarna merchant account.

**Go-live (technical):**
- [ ] Full Vercel prod env (Shopify tokens, `SHOPIFY_MARKET_COUNTRY=DE`,
      `ANTHROPIC_API_KEY`, analytics id).
- [ ] Stage on `new.sick-motos.com` (CNAME -> `cname.vercel-dns.com`), then DNS switch:
      apex A `23.227.38.32` -> `76.76.21.21`, www CNAME -> `cname.vercel-dns.com`
      (GoDaddy). Lower TTL first. Keep the old shop as fallback for rollback.
- [ ] End-to-end test order via a 100%-discount code (not Shopify test mode, which would
      disturb the still-live old store; gateway is Viva.com). Then one real low-value
      order + refund as the final proof. Test mobile + desktop.

**Marketing / tracking:**
- [ ] Conversion tracking across the headless/checkout boundary (critical for ads).
- [ ] Google Merchant Center feed on the new domain; Search Console sitemap post-DNS.
- [ ] Analytics: pick GTM or Plausible, set the id in Vercel.
- [ ] Google Ads: external contractor runs a 1-month trial, then reassess in-house.
      Keep Thomas as owner of all Google accounts; contractor only as a manager.

**Security / housekeeping:**
- [ ] Rotate `ANTHROPIC_API_KEY`.
- [ ] Optional: remove unused `WhatsAppFloat.tsx`.

## 7. External systems

- **Shopify admin**: `admin.shopify.com/store/sickmotos`. Payment gateway: Viva.com.
  Fulfillment in-house (Thomas ships). Shopify Inbox is the real customer-Q&A source.
- **Domain**: sick-motos.com on GoDaddy, DNS switch to Vercel pending (see §6).
- **Google**: Merchant Center + Ads (feed apps "Nabu for Google Feed" / "Casa Google
  Shopping" already installed).
- **Telegram**: client feedback flows through a monitoring bot in a shop group; used to
  collect Thomas's instructions. Token lives only in `.env.local`, never in git.

## 8. Compliance notes (important)

- **No fake scarcity.** Showing "only 3 left" while backend stock is unlimited is an
  unfair commercial practice under the German UWG / EU Omnibus directive (abmahnbar).
  Use truthful made-to-order messaging instead (these items genuinely are built to
  order), which delivers the same urgency legally.
- **Returns by registration is fine; do not obstruct returns.** Routing returns through
  an email registration (customer emails for the return address) is a normal RMA flow.
  Deliberately hiding the address behind a broken/unsolvable captcha is not acceptable:
  the 14-day right of withdrawal is protected, and the Widerrufsbelehrung/Impressum must
  legally contain a contact address (Art. 246a EGBGB). Keep the required address in the
  legal pages; run the operational flow via email registration.
- **Returns rules (per Thomas):** customer pays return shipping; used electronics are not
  returnable (new/unused electronics are); electronics returns may incur testing /
  repackaging / storage costs. Align the legal Widerruf text with "only USED electronics
  excluded" (currently it reads as all electronics).
