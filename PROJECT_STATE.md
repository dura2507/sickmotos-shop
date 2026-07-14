# SickMotos — Projekt-Status & Handoff

> **Zweck:** geteilter Kontext zwischen mehreren Rechnern / Claude-Chats. Wird per
> `@PROJECT_STATE.md` in [CLAUDE.md](CLAUDE.md) automatisch in jede Session geladen.
> **Regel:** wenn sich am Stand etwas Wichtiges ändert (erledigt / neu offen / neue
> Entscheidung), diese Datei aktualisieren und committen + pushen. So bleibt jeder
> Rechner up to date. Keine Secrets hier rein (Tokens/Passwörter/API-Keys liegen in
> Vercel-Env bzw. Passwort-Manager, nie im Repo).
>
> Detaillierte Standing-Rules stehen in [AGENTS.md](AGENTS.md).
> Stand: 2026-07-14.

---

## 1. Was das ist

Headless **Next.js 16 + React 19 + Tailwind v4 (Turbopack)** Performance-Parts-Shop
für Supermoto/Enduro, auf **Vercel**. Kunde: **Thomas Krawietz**. Ersetzt den alten
Shopify-Storefront `sick-motos.com`. Design: premium, dunkel, rote Akzente (#E10600).

- **Repo:** `github.com/dura2507/sickmotos-shop` (branch `main`, Auto-Deploy bei push).
- **Projekt-Dir (dieser Rechner):** `/Users/kristian.durasin/Desktop/sickmotos-shop`.
- **Live:** primäre Domain **`sickmotos.com`** (Vercel). Vercel-URL: `sickmotos-shop.vercel.app`.
- **Admin-Panel:** `sickmotos.com/admin` (Passwort in Vercel-Env `ADMIN_PASSWORD`, kenne ich nicht hier).

## 2. Architektur (Kurzfassung)

- **Headless Shopify:** Storefront API für Browse/Cart, Shopify-hosted Checkout
  (nur brandbar, nicht selbst-hostbar ohne Plus). `fixCheckoutHost()` in
  `src/lib/shopify.ts` schreibt jede Checkout-URL auf `sickmotos.myshopify.com` um
  → Domain-Wechsel bricht den Checkout nie.
- **Auth:** on-site Login/Register/Forgot via Storefront API (kein OAuth-Redirect mehr).
- **i18n:** cookie-basiert (`sm_lang`), KEIN URL-Restructure. DE/EN/IT/ES. Server liest
  Locale, ganze Seite rendert in der Sprache. Client-Komponenten via `LocaleProvider`
  (`useDictionary()`/`useLocale()`). Sprache = **Browser-Sprache** (Accept-Language),
  nicht Geo/IP. Fallback für nicht unterstützte Sprachen = **Englisch**.
- **Preise:** `scripts/sync-products.mjs` läuft als `prebuild` und überschreibt
  `src/data/products.json` mit frischem Shopify-Fetch. Wichtig: `&country=DE` gepinnt,
  sonst backt der US-Build-Server ~+20% Preise ein.
- **Bot (SickBot):** Support-Chat-Widget, Anthropic SDK. Wissen in
  `src/lib/botKnowledge.ts` + Learning-Loop (siehe unten).

## 3. Status-Board

### Erledigt / live
- Design, Mobile (375px), on-site Auth, Produkte, Bike-Finder/Filter.
- Alle Zahlungsmethoden aktiv (Viva.com Gateway).
- 11 Kunden-Emails + Checkout gebrandet (SickMotos dark/rot).
- **SickBot** live, zweisprachig, on-brand.
- **Bot-Learning-Loop** live: pro Bot-Antwort ein Korrekturfeld in `/admin/chats/[id]`,
  merged sich in EIN Knowledge-Doc (`sm:bot:knowledge` in Redis), sofort im nächsten
  Prompt aktiv. Übersicht/Editor unter `/admin/bot`.
- **Storefront-i18n** DE/EN/IT/ES ~komplett (~450 Keys/Sprache). AI-Slop entfernt
  (keine Em-Dashes, kein „AI-Pill"-Look). Englisch-Fallback aktiv.
- **Domain-Migration** (2026-07-11): `sickmotos.com` ist primär; `sick-motos.com`,
  `sickmotos.de`, `sick-motos.de` (+ www-Varianten) → alle **301** auf sickmotos.com,
  Pfad + Query erhalten. DNS (GoDaddy) apex A `76.76.21.21`, www CNAME
  `cname.vercel-dns.com`. Code-Canonical überall auf sickmotos.com hardcodiert.
- **LED-Sicherheit** (2026-07-14, commit 223815a): Wandler-Warnung verschärft
  (Laderegler zerstört Controller durch Überspannung, Brandgefahr, keine Gewährleistung)
  + Pflicht-Hinweis „Keine Zulassung nach StVO / Rennsport-Teil" auf allen RGBW-Lampen-
  Produktseiten (amber Box, greift automatisch via `isLamp()`). Alle 4 Sprachen + Bot.
- Legal-Pages existieren (`src/app/legal/` + `src/data/legal/`).

### In Arbeit / muss verifiziert werden
- **Shopify Admin Orders** (`/admin/orders` = echte Bestellungen): OAuth-Offline-Token-
  Flow gebaut (`/api/shopify/oauth/callback`, `src/lib/shopifyAdmin.ts`, API-Version
  2026-07). Ablauf: `SHOPIFY_APP_CLIENT_SECRET` + `SHOPIFY_ADMIN_API_TOKEN` (Offline-
  Token, NICHT der Automation-Token — der gibt 401) in Vercel setzen → Reinstall-Link
  aus Dev Dashboard → Callback druckt Token → einsetzen → redeploy → `/admin/orders`
  prüfen. **Offen: verifizieren, dass echte Orders erscheinen.** App-/client-IDs siehe
  `src/app/api/shopify/oauth/callback/route.ts` (client_id dort als Fallback hardcoded).

### Offen / TODO
- **Google (extern, Thomas/User):** Search Console neue Property für sickmotos.com +
  Sitemap `https://sickmotos.com/sitemap.xml` einreichen; Merchant Center Feed-URL auf
  sickmotos.com; Google Ads auf sickmotos.com. (User schickt noch Details.)
- **Besucheranzeige/Dashboard für Thomas:** Shopify-App-ähnliches Panel
  (Sessions/Umsatz/Orders, Tag/Woche/Monat-Vergleich + Charts). User schickt noch Specs.
- **Plausible `data-domain`** noch `sick-motos.com` (Env `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`) —
  nur Analytics-Label, kein SEO/User-Problem. Thomas' Entscheidung.
- **Returns-Widerspruch:** `src/data/legal/widerruf.md` + Shopify-Policy sagen ALLE
  Elektronik nicht retournierbar, Thomas sagt nur GEBRAUCHTE Elektronik. Text angleichen.
  Außerdem: Shopify-Policy-Retourenadresse evtl. noch Pöttmes → muss die Zadar/HR-Adresse
  sein (korrekte Adresse steht in `widerruf.md` und im Bot; hier bewusst nicht wiederholt).
- **Phase-2-Sprachen** PL/CZ/SL/HR; Legal-Pages-Übersetzung (braucht Anwalt).
- **End-to-end Test-Kauf** (100%-Rabattcode, NICHT Shopify-Testmodus) vor „voll live".

## 4. Externe Systeme (Zugänge kennt der User)

- **Telegram:** Feedback läuft über die SickMotos-Shop-Monitoring-Gruppe mit eigenem
  Shop-Bot (IDs/Token liegen lokal in der Memory bzw. beim User, nicht hier). Rental-
  Gruppe strikt trennen. GetUpdates behält nur ~24h. **Feedback-Format-Regel:** Thomas'
  Nachricht 1:1 zeigen → ggf. Satz für Satz → meine Interpretation → mein Lösungsvorschlag,
  IMMER erst vorschlagen, nicht still umsetzen.
- **Shopify Admin:** `admin.shopify.com/store/sickmotos`. Fulfillment: Thomas versendet
  selbst (Location Pöttmes). Gateway: Viva.com.
- **Google:** Merchant Center + Google Ads (Account-IDs beim User).
- **Domain:** GoDaddy (DNS), Vercel (Hosting + Redirects).

## 5. Standing-Rules (Kurz — Details in AGENTS.md / Memory)

1. **Nie Em-/En-Dashes (— –).** Kommas/Punkte. Wichtigster „AI-Slop"-Trigger für den User.
2. **Nichts erfinden.** Nur was Thomas wörtlich gesagt hat; Content nur aus seiner Seite.
3. **Keine scammy/fake Patterns** (keine Fake-Reviews/Urgency/Specs).
4. **Mobile 375px muss perfekt sein.**
5. **Auto-commit + push nach jeder Änderung** (triggert Vercel-Deploy).
6. **Nie User-Passwörter/Kreditkarten eingeben; Secrets nie ins Repo.**
7. **Mac sauber halten** (alles Installierte muss deinstallierbar bleiben).
