# SickMotos Shop — Handover

Last updated: 2026-07-06

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
  BIKE_BRANDS, getTopSelling(), DetailViewModel, defaultVariantGid on CardProduct.
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
- Akku-Set logic per Thomas: Akku Set needed when bike is modified (removed limiter,
  tuning header, big-bore cylinder, tuned charging system or regulator) OR when the
  model has no battery from the factory. Otherwise the Converter (3-pin or 4-pin).
- Returns are **email-registration only**. Bot never posts a physical return address;
  it directs customers to email `SickMotos-styles@freenet.de` with their order number.

## 5. Status: done

- Full storefront, 483 products with variants + add-ons + "Fits on".
- Pricing bug fixed; category/brand tiles, reviews (SVG flags), banners reworked;
  mobile pass.
- 11 Shopify email templates branded + checkout branding done.
- SickBot live (red-header design, registration-based returns answer, Akku logic).
- Promo bar targets new customers ("New here? 5% off your first order").
- **Made-to-order UX** (`src/lib/leadTime.ts`): made-to-order badge + lead time for
  LED lamps and titanium headers (~2-3 weeks) and a highlighted "made to order,
  6+ weeks" notice for wheels on the product page, in the shop grid, and per line
  in the cart. No fake stock counters.
- **301 redirects** old Shopify URLs -> new routes in `next.config.ts` (308, verified).
- **Analytics wired**: GTM Consent Mode v2 default DENIED before gtm.js loads; cookie
  banner (`CookieConsent.tsx`) writes consent update on Accept / Only-essential; GA4
  `view_item`, `add_to_cart`, `begin_checkout` events. Plausible fallback via env.
- **Converter guard-rail** (Thomas): on LED lamp product pages a red "REQUIRED"
  checkbox pre-adds the matching converter when the customer clicks Add-to-cart;
  cart drawer shows a red "Your LED will not work." banner if a lamp is in the
  cart without a converter. `src/lib/essentials.ts` + `PurchasePanel.tsx` +
  `CartDrawer.tsx` + `addLinesToCart()` in `cartStore.ts`.
- **My garage** (Thomas): `/account/bikes` lets riders save their bikes (brand /
  model / year) in localStorage; ShopBrowser shows a "Your garage · N bikes saved
  · Show what fits" tile that filters the grid to matching brand + year. Not
  synced across devices (localStorage-only); post-launch sync via Shopify
  customer metafield is deferred unless data shows it's needed.
- **Idiot-proof cart warnings** (Thomas): red-framed "Before you continue, please
  check" panel above the Checkout button with two numbered items — (1) full
  address including house number, (2) enter a real email or you get no tracking.
- **Public return address removed** everywhere on our side (widerruf.md, Shopify
  Refund policy). Returns run by email registration only. Impressum still lists
  the business address (§ 5 TMG requirement).
- **Krümmer typo fix**: user-facing "Krummer" strings replaced with "Krümmer" on
  Signature parts, Featured builds, Test center cards.

## 6. Pending before go-live

**Code / repo:**
- [ ] Reviews on the site are static; Judge.me/Trustpilot are Shopify-theme apps
      and won't render headless. Decide: keep static or integrate via API.
- [ ] Optional: remove unused `WhatsAppFloat.tsx`.

**Shopify admin:**
- [x] Return & refund policy: address removed, email-registration wording.
- [x] EXTRA5 limited to "Customers who haven't purchased" + one use per customer.
      TODO with Thomas: today it only applies to 11 specific collections (his
      original setup); clarify whether this stays or should be widened to "All
      products".
- [x] Confirmed Thomas receives order notifications (email + iPhone push, all orders).
- [ ] Klarna: enable in Settings -> Payments -> Add payment method, requires a
      Klarna merchant account on Klarna's side. Thomas can add it any time after
      launch, it does not block go-live.

**Go-live (technical):**
- [ ] End-to-end test order via a 100%-discount code (not Shopify test mode,
      which would disturb the still-live old store; gateway is Viva.com). Then
      one real low-value order + refund as the final proof. Test mobile + desktop.
- [ ] Stage on `new.sick-motos.com` (CNAME -> `cname.vercel-dns.com`), then DNS
      switch: apex A `23.227.38.32` -> `76.76.21.21`, www CNAME -> `cname.vercel-dns.com`
      (GoDaddy). Lower TTL first. Keep the old shop as fallback for rollback.
- [ ] Vercel prod env is complete (Shopify tokens, `SHOPIFY_MARKET_COUNTRY=DE`,
      `ANTHROPIC_API_KEY`, GTM + Plausible ids). Verified.

**Marketing / tracking:**
- [ ] Conversion tracking across the headless/checkout boundary (critical for ads).
      Set up in GTM after DNS switch.
- [ ] Google Merchant Center feed on the new domain; Search Console sitemap post-DNS.
- [ ] Google Ads: external contractor runs a 1-month trial, then reassess in-house.
      Keep Thomas as owner of all Google accounts; contractor only as a manager.

**Security / housekeeping:**
- [ ] Rotate `ANTHROPIC_API_KEY`.

## 7. External systems

- **Shopify admin**: `admin.shopify.com/store/sickmotos`. Payment gateway: Viva.com.
  Fulfillment in-house (Thomas ships). Shopify Inbox is the real customer-Q&A source.
- **Domain**: sick-motos.com on GoDaddy, DNS switch to Vercel pending (see §6).
- **Google**: Merchant Center + Ads (feed apps "Nabu for Google Feed" / "Casa Google
  Shopping" already installed on the old Shopify theme).
- **Telegram**: client feedback flows through a monitoring bot in a shop group; used to
  collect Thomas's instructions. Token lives only in `.env.local`, never in git.

## 8. Compliance notes (important)

- **No fake scarcity.** Showing "only 3 left" while backend stock is unlimited is an
  unfair commercial practice under the German UWG / EU Omnibus directive (abmahnbar).
  Use truthful made-to-order messaging instead (these items genuinely are built to
  order), which delivers the same urgency legally.
- **Returns by email registration only.** No physical return address is published on
  our public site or in the Shopify Refund policy — customers must email to receive
  it. The Impressum still lists the business address (Obere Str. 18, Pöttmes) which
  satisfies § 5 TMG and Art. 246a EGBGB; withdrawal declarations go there.
- **Returns rules (per Thomas):** customer pays return shipping; sale items, gift
  cards, custom items and electronic items are non-returnable (matches the original
  written policy). Electronics returns can incur testing / repackaging / storage costs.

## 9. Post-launch cleanup (money and hygiene)

Once the DNS points to Vercel and the old Shopify shop is not in use anymore:

- **Uninstall two paid Shopify apps** the new site replaces; they only exist for the
  old theme. Saves **$58/month (~€650/year)** for Thomas:
  - `EasySearch - YMM` — $19/mo. Year/Make/Model bike filter widget. Replaced by
    our built-in Bike Finder (`/shop`) and My Garage (`/account/bikes`).
  - `Instant AI Page Builder` — $39/mo. Drag-and-drop landing pages on the theme.
    Replaced by our coded pages.
- **Do NOT uninstall before the old shop is fully offline** — DNS rollback would
  break those widgets on the fallback shop otherwise. Order: (1) DNS switch stable
  for a week, (2) uninstall apps.
- Consider whether to uninstall the model-filter app / other apps that Thomas
  never actually used.
