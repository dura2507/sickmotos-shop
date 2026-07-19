# SickMotos — Projekt-Status & Handoff

> **Zweck:** geteilter Kontext zwischen mehreren Rechnern / Claude-Chats. Wird per
> `@PROJECT_STATE.md` in [CLAUDE.md](CLAUDE.md) automatisch in jede Session geladen.
> **Regel:** wenn sich am Stand etwas Wichtiges ändert (erledigt / neu offen / neue
> Entscheidung), diese Datei aktualisieren und committen + pushen. So bleibt jeder
> Rechner up to date. Keine Secrets hier rein (Tokens/Passwörter/API-Keys liegen in
> Vercel-Env bzw. Passwort-Manager, nie im Repo).
>
> Detaillierte Standing-Rules stehen in [AGENTS.md](AGENTS.md).
> Stand: 2026-07-18.

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
  `src/lib/shopify.ts` pinnt jede Checkout-URL auf `CHECKOUT_HOST` (seit 2026-07-19
  **`checkout.sickmotos.com`**, vorher `sickmotos.myshopify.com`). Rollback = die eine
  Konstante zurücksetzen + redeploy. Der Checkout läuft jetzt auf einer sickmotos.com-
  Subdomain (Shopify-Primary, eigenes TLS), gleiche Root wie die Storefront → behebt
  Googles „mismatched checkout URL". End-to-end getestet (echtes Checkout rendert auf
  checkout.sickmotos.com, alle Zahlarten). **ACHTUNG DNS/Shopify-Falle:** eine Custom-
  Domain in Shopify zu „connecten" macht sie AUTOMATISCH zur Primary (myshopify wird
  Redirect) → bei noch nicht fertigem TLS bricht das den Live-Checkout kurz. Immer erst
  TLS-fertig abwarten, dann promoten, sofort per curl + echtem Checkout testen.
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
- **Bot-Korrektur-Verlust gefixt** (2026-07-17): das Merge-Modell warf ältere Korrekturen
  weg (Deckel `max_tokens: 1500` + „remove redundancy"-Prompt) → 5 von Thomas' Korrekturen
  fehlten im aktiven Doc. Wurzel in `src/lib/botCorrections.ts` gefixt („never lose
  information"-Regel + `max_tokens` 4000). Verlorene via `/admin/bot`-Editor wiederhergestellt
  (H4-Adapter, Felgen Beta 50/125, ECU MSE 6.0/8.0, Rabattcode EXTRA5, Beschimpfungs-Konter
  — letzterer auf Thomas' ausdrücklichen Wunsch + Verantwortung). Aktives Doc jetzt ~5256
  Zeichen, live verifiziert (Bot nutzt H4/EXTRA5). Merke: das aktive Doc ist bereits gededupt,
  Doppler sieht man nur im Audit-Verlauf (geht NICHT in den Bot).
- **Bot 2.0 — Merge kompakt + Hang-Fix** (2026-07-18): (1) **Hang gefixt** (Thomas: „kann keine
  Infos senden / nicht als gelesen markieren"): der synchrone Haiku-Merge beim Korrektur-Absenden
  überschritt Vercels ~10s-Default-Timeout → `export const maxDuration = 60` in
  `src/app/admin/chats/[id]/page.tsx`. (2) **Merge bläht nicht mehr auf:** `max_tokens 4000`
  ließ Haiku bei jeder Korrektur das ganze Doc neu ausformulieren (eine Test-Korrektur wuchs
  das Doc um +2270 Zeichen). Prompt-Regel „CHANGE AS LITTLE AS POSSIBLE, copy every line
  unchanged" in `botCorrections.ts` → live verifiziert: eine neue Korrektur (Rieju in die H4-Zeile)
  wuchs das Doc nur um **+7 Zeichen**, alle Alt-Korrekturen intakt (Test danach wieder entfernt).
  (3) **Merge-Prompt verbietet jetzt Em-/En-Dashes** (Haiku streute „–" in den Wissens-Doc,
  verletzt Rule 1). Achtung: bestehende En-Dashes in Alt-Korrekturen (u.a. in der Akku-Laufzeit-
  Zeile) sind noch drin, nicht still gelöscht (könnten Thomas-Content sein) → bei Gelegenheit
  mit Thomas klären. Dieselbe Zeile hat auch eine erfundene Zahl (Akku-Laufzeit) = separater
  Prüfpunkt, steht schon unter „Akku-Set Restpunkte".
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
- **Google-Anbindung repariert** (2026-07-16): (1) Merchant-Center-Website-Inhaberschaft
  war nie bestätigt (dadurch Approved 0 / fast alles Limited/Not-approved) → per HTML-Tag
  verifiziert (zwei `google-site-verification`-Tokens in `src/app/layout.tsx` via
  `metadata.verification.google`), Merchant zeigt jetzt **Verified + Claimed**. (2) **GTM
  war tot:** Vercel-Env `NEXT_PUBLIC_GTM_ID` stand 52 Tage auf dem wörtlichen Platzhalter
  statt der Container-ID → auf `GTM-NN3V8K3D` gesetzt (Production), GA4 (`G-CJ8F4XV6F9`) +
  Google-Ads-Conversion (`AW-395813654`) feuern wieder, im Browser live verifiziert. Die
  „731 Produktseite nicht erreichbar" waren veraltet (Seiten liefern 200), klären beim
  Re-Crawl. Preview-Env bewusst ohne GTM (Test-Deploys sollen echte Analytics nicht verfälschen).
- **Full-Site-Audit** (2026-07-16): alle 499 Sitemap-Seiten HTTP 200, i18n DE/EN/IT/ES,
  Checkout-Host `sickmotos.myshopify.com` (fixCheckoutHost greift), Warenkorb/Cross-Sell,
  SickBot-Widget, Mobile 375px, `/api/chat`, EUR-Preise, alles grün.
- **LED-Converter/Akku-Logik** (2026-07-16, Thomas' Regel): JEDE LED-Lampe braucht immer
  den **Wandler/Converter** (auto-gebundelt via `src/lib/essentials.ts`). Das **Akku Set**
  kommt ZUSÄTZLICH (nie statt) bei 2-Takt ohne Starterbatterie / getunten Bikes und bei
  **ALLEN 50ern**. Pin-Regel: **Beta 50 → 3-Pin Akku Pack**, **Sherco/Fantic/Aprilia/Rieju
  50 → 4-Pin Akku Pack** (nur 2 Akku-Produkte im Katalog). Umgesetzt: alle 14 50er-Lampen
  haben in `src/data/addons.json` das passende Pack. Lampen erkannt via `product_type`
  „Angel EYES" + `\b50\b` im Titel + Marke, NICHT über Tags (die matchen sonst Tuning-Teile
  wie Nockenwellen/FuelX). Bot (`src/lib/botKnowledge.ts`) kennt die Differenzierung inkl.
  Pin-Mapping, live getestet (Beta 50 → 3-Pin, Sherco 50 → 4-Pin).

### In Arbeit / muss verifiziert werden
- **Shopify Admin Orders** (`/admin/orders` = echte Bestellungen): OAuth-Offline-Token-
  Flow gebaut (`/api/shopify/oauth/callback`, `src/lib/shopifyAdmin.ts`, API-Version
  2026-07). Ablauf: `SHOPIFY_APP_CLIENT_SECRET` + `SHOPIFY_ADMIN_API_TOKEN` (Offline-
  Token, NICHT der Automation-Token — der gibt 401) in Vercel setzen → Reinstall-Link
  aus Dev Dashboard → Callback druckt Token → einsetzen → redeploy → `/admin/orders`
  prüfen. **Offen: verifizieren, dass echte Orders erscheinen.** App-/client-IDs siehe
  `src/app/api/shopify/oauth/callback/route.ts` (client_id dort als Fallback hardcoded).
- **Analytics-Dashboard für Thomas** (`/admin/dashboard`, Nav „Analytics"): Shopify-Style
  Übersicht mit **Alt-vs-Neu-Vergleich** (1/7/30 Tage, jede Periode gegen die Vorperiode,
  Delta-% + Balken-Chart mit gestrichelter Vergleichslinie). Kennzahlen: **Gesamtumsatz,
  Bestellungen, Ø Warenkorb, Sitzungen** + 2 Charts (Umsatz/Zeit, Sitzungen/Zeit).
  - **Umsatz/Orders** aus der **Orders-Admin-API** neu berechnet (`src/lib/salesReport.ts`),
    Berlin-Zeit-Bucketing, Test-/stornierte Orders raus, minus Refunds. Deckt sich mit
    Shopify Analytics „Total sales" auf **~0,1%** (verifiziert Jul 9-15: 8.700 EUR / 54 Orders;
    Orders + Steuern matchen exakt). **Wichtig:** die feine **Netto/Brutto/Rabatt/Versand-
    Aufschlüsselung matcht NICHT** auf den Cent, weil der Shop **Brutto** (tax-inclusive)
    verkauft und die Order-Felder dann nicht Shopifys steuer-exklusiven Report-Zeilen
    entsprechen → diese Aufschlüsselung wurde bewusst **entfernt**. Für 1:1 braucht es
    **`read_reports`/ShopifyQL-Scope** (Level-2, Token hat's nicht) → Freelancer/Thomas.
  - **Sitzungen** aus dem **eigenen Besucher-Zähler** (`analyticsStore.ts`, Redis pro Tag),
    der den echten headless-Traffic sieht, den Shopify seit dem Umzug NICHT mehr zählt
    (Shopify-Sessions ~0, weil Storefront auf Vercel läuft). Kein Shopify-Backfill für die
    Vergangenheit möglich → Session-Historie beginnt ab Zähler-Start; Order-Historie ist voll da.
  - **Live gegen Shopify gegengecheckt (2 Fenster, 2026-07-18/19):** Jul 9-15 = 8.700,31 EUR
    (Shopify) vs. Recompute ~8.708 (0,1%); Jul 12-18 = 9.342,01 EUR (Shopify) vs. Dashboard
    9.350,41 (0,09%), **Orders 59=59 exakt, Steuern 1.386,39 = 1.386,39 exakt**. Mein Wert liegt
    systematisch ~0,09% höher (Brutto-inklusive Order-Totals), kein Zufallsfehler.
  - **Coverage ehrlich:** Umsatz/Orders kommen aus der Orders-API = rückwirkend voll da
    (nicht ans Deploy-Datum gebunden), aber die UI zeigt nur 1/7/30 Tage rollierend (kein
    freier Datumsbereich, kein „Alt-Shop vs. Neu-Shop"-Stichtag, nur Periode vs. Vorperiode).
    **Sitzungen erst ab 2026-07-10** (Zähler-Deploy), kein Backfill möglich.
  - **Tracking-Audit-Fixes (2026-07-19, commit nach Multi-Agent-Audit):** (1) Pagination-Cap
    in `salesReport.ts` von 12 auf 200 Seiten (kein stiller Undercount mehr bei grossen
    Fenstern, laut geloggt bei Überlauf). (2) Besucher-Zähler bucketet jetzt **Berlin-Zeit**
    (war UTC → ~2h/Tag im falschen Bucket, jetzt deckungsgleich mit Umsatz). (3) **Bot-/Crawler-
    User-Agents zählen nicht mehr** als Sitzungen. (4) **`prevComplete`-Flag:** Sitzungs-Vergleich
    zeigt „—" statt irreführendem +XXX%, wenn die Vorperiode vor dem Zähler-Start liegt (live
    verifiziert: 7-Tage-Sessions zeigt jetzt „—" statt +278%). (5) leere Vorperiode → „—" statt
    grünes 0%. Offene niedrige Punkte: /api/track ist offener POST ohne Rate-Limit (per curl
    aufblasbar), Refund-Attribution nach Order-Datum, 90-Tage-Redis-TTL begrenzt Session-
    Vergleiche >90 Tage.
  - Temp-Verifikationsseite `/admin/analytics-test` (Jul-9-15-Abgleich) kann weg, sobald
    Thomas das Dashboard abgesegnet hat.
- **Google Merchant „Produkte abgelehnt" diagnostiziert + Checkout-Domain umgezogen (2026-07-19):**
  Der operator/Ads-Kollege drängte auf „Verbindung resetten" + „Checkout auf sickmotos.com".
  Read-only-Check ergab: **Merchant-Verbindung ist Active (nicht kaputt), aber alle ~1229 Produkte
  „受限/Limited"** wegen **„网店网址不一致 / Mismatched online store URL"**. Ursache (Merchant →
  Geschäftsinfos): das Feld **„Deine Website" steht auf `sickmotos.myshopify.com`**, die Feed-
  Produkt-URLs sind aber `sickmotos.com` (seit der Domain-Migration ~8.-11. Juli, Chart zeigt den
  Kipp-Punkt). **Eigentlicher Fix (Merchant-Seite, operator, 2 Min, null Risiko): „Deine Website"
  auf `sickmotos.com` stellen.** DAS entsperrt die 1229 Produkte, nicht der Checkout.
  - **Checkout-Domain trotzdem umgezogen** (Thomas' + operators Wunsch, komplementär gegen den
    separaten „mismatched checkout URL"-Check): `checkout.sickmotos.com` als CNAME → `shops.myshopify.com`
    (GoDaddy, Apex/www unangetastet), in Shopify verbunden + als **Primary** gesetzt, `CHECKOUT_HOST`
    im Code umgestellt, **echter Testkauf** rendert sauber auf checkout.sickmotos.com (alle Zahlarten).
    **Zwischenfall dabei ehrlich:** das erste „Connect" hat die Domain automatisch zur Primary gemacht
    während TLS noch provisionierte → ~2-4 Min Checkout-SSL-Fehler-Risiko, sofort per curl bemerkt +
    revertiert, dann sauber mit fertigem TLS gemacht. Lehre steht in Architektur-Abschnitt.
  - **Merchant-Website-URL selbst umgestellt (2026-07-19, auf Leons Ansage):** in Merchant →
    Geschäftsinfos → „Deine Website" von `sickmotos.myshopify.com` auf **`sickmotos.com`** geändert.
    Google hat via die Meta-Tags **automatisch neu verifiziert + beansprucht** (grün), kein manuelles
    Re-Claim. Warnung im Dialog beachtet (URL-Wechsel macht Claim ungültig, hier aber sofort
    auto-neu-beansprucht). Damit matcht Merchant-Domain = Feed-Domain = sickmotos.com.
  - **Nachwehen + Fixes (2026-07-19 abends):** (1) Durch den Website-URL-Wechsel hat Google das
    **Merchant-Checkout-Template automatisch auf `https://sickmotos.com/cart/{id}:1?checkout`
    umgeschrieben** (Apex = Vercel = 404, operator + Thomas sahen den Fehler). Gefixt: Feld manuell
    auf **`https://checkout.sickmotos.com/cart/{id}:1?checkout`** gestellt (verifiziert, Cart-Permalink
    mit echter Varianten-ID → 302 in den Checkout; Googles 24h-Review läuft). Merke: Website-URL-Wechsel
    im Merchant zieht das Checkout-Template mit um, danach IMMER kontrollieren. (2) **Re-Crawl greift:**
    Thomas' Screenshot 18:22: **115 Approved** (war 0), 5 under review, Rest Limited → Welle läuft.
  - **KORREKTUR einer früheren Annahme:** die **nackte alte Shopify-Theme IST unter
    checkout.sickmotos.com öffentlich sichtbar** (alte „REITE WILD"-Landing; Passwortschutz ist AUS,
    muss er für den Checkout auch sein). Frühere Aussage „Passwortseite schützt" war falsch (grep
    hatte das Theme-Login-Formular erwischt). **Offen: Redirect-Snippet in `layout/theme.liquid`**
    (Theme „Geen Experiment", id 178472648970, Ella-Schema): Whitelist-Redirect für `/`,
    `/collections`, `/products`, `/pages`, `/blogs`, `/search`, `/policies` → sickmotos.com;
    `/cart`, `/checkouts`, Wallets/Payments NICHT anfassen. Shopifys Code-Editor lud im
    automatisierten Browser nicht (Monaco-Pane bleibt leer), daher manuell einfügen.
  - **Offen (Regel 8):** In 1-2 Tagen prüfen: (a) alle Produkte grün (Limited → Approved), (b)
    Checkout-URL-Review durch (Feld zeigt checkout.sickmotos.com), (c) Ads wieder aktiv (Thomas/
    operator hatten sie pausiert „um kein Geld zu verbrennen", reaktivieren = deren Job).

### Offen / TODO
- **Scene-Voice Copy-Rewrite (Thomas' Kern-Wunsch):** Die Seiten-Texte fühlen sich
  für Thomas noch „unecht" an, zu weit weg von der deutschen 125er-Supermoto/Enduro-Szene.
  **Erledigt (2026-07-16): Keyword-Pass.** Thomas' Schlagwörter (LED-Scheinwerfer,
  Titan-Krümmer, Supermoto, Enduro, 50er, 125er) in die generische Marketing-Copy gewoben:
  `categories.subtitle`, `categoryCards` Bremsen + Carbon, `dna.tagline`, DE/EN/IT/ES, live.
  Funktions-Strings (Fehler/Leer-Zustände) bewusst clean gelassen (kein Keyword-Brei).
  **Offen: tieferer Ton-Rewrite.** (1) **„Princip"-Referenz** von Thomas per US-Websuche/
  DuckDuckGo/Google NICHT auffindbar (Nische, evtl. deutsche/Balkan-Szene-Marke, IG-basiert,
  „Princip" = slaw. „Prinzip", passt zu Zadar/HR) → **Link/IG-Handle von Thomas nötig.**
  (2) Bessere Referenz ohne Princip: **Thomas' EIGENE Stimme aus `sickmotos_shop_chats.json`
  minen** (Drive SHOP_BOTFUTTER, 6343 Chats, PII → nicht ins Repo), dann Seite Sektion für
  Sektion in SEINEM Ton umschreiben, Thomas segnet ab, EN/IT/ES nachziehen. Einzel-Bild-Text-
  Paare laufen laufend über den privaten Bot.
- **Lieferzeiten (erledigt 2026-07-16, offen: Felgen):** made-to-order (LED, Auspuff) von
  „2-3 Wochen" auf **„7-14 Tage" + „vieles ab Lager"** (DE/EN/IT/ES + Bot, live, `leadTime.ts`
  wählt normal vs. lang, Text kommt aus `product.madeToOrder*`). **Offen:** Felgen stehen noch
  auf „6+ Wochen" (`madeToOrderLong`) → Thomas fragen, ob auch 7-14 (7-14 auf echten 6-Wochen-
  Felgen = Rückerstattungs-Risiko, deshalb bewusst nicht mitgeändert).
- **Google (extern, Freelancer/Thomas):** Merchant-Website ist verifiziert + beansprucht.
  Nächste Schritte liegen beim Freelancer/Thomas (nicht unser Code): Feed neu abrufen lassen,
  dann drehen Produkte von Limited/Not-approved auf „approved". **Google-Ads-Kampagnen sind
  aktuell PAUSIERT** ("Anzeigen werden derzeit nicht geschaltet") → Freelancer/Thomas
  reaktiviert sie (Budget/Spend, bewusst nicht unser Job). Search Console: sickmotos.com-
  Property noch anzulegen + Sitemap `https://sickmotos.com/sitemap.xml` einreichen.
  Kleinkram: Merchant „Customer service contact" zeigt noch alte Domain `www.sick-motos.com`;
  Startseite hat kein `canonical`-Tag. Im Shopify-Google-Channel stehen 2 Punkte rot
  („紧急": **Shopify Channel App** + **Shopify: Sickmotos-Styles**) → Shopify-App-seitig,
  Freelancer-Job, nicht unser Code; werden evtl. nach dem Website-Claim-Sync grün. Merchant
  Center selbst ist grün.
- **Akku-Set Restpunkte:** (a) Bei 4-Takt-Lampen (125+) ist das Akku Set nur Tuning-Option,
  nur dort angeboten wo die Beschreibung es nennt. (b) Bot-Kosmetik: Haiku erfindet vereinzelt
  „Akku hält 3-5h" (erfundene Zahl) + nutzt Gedankenstriche → optionaler Prompt-Härtungs-Pass.
  (Husqvarna-Frage gestrichen: kein Husqvarna-50er, kein passendes Pack, Beschreibung verweist
  eh auf Support → kein Handlungsbedarf.)
- **Besucheranzeige/Dashboard für Thomas:** Shopify-App-ähnliches Panel
  (Sessions/Umsatz/Orders, Tag/Woche/Monat-Vergleich + Charts). User schickt noch Specs.
- **Plausible `data-domain`** noch `sick-motos.com` (Env `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`) —
  nur Analytics-Label, kein SEO/User-Problem. Thomas' Entscheidung.
- **Returns (geklärt 2026-07-17):** Thomas bestätigt: **ALLE Elektronik** vom Umtausch
  ausgeschlossen (nicht nur gebrauchte), **Rücksendeadresse = Zadar**. `widerruf.md` sagt das
  schon korrekt (Zeile 17: alle Elektronik ausgeschlossen), keine Pöttmes-Adresse im Code,
  Adresse wird per Mail pro Retoure vergeben. Code-seitig nichts zu tun. Nur noch prüfen:
  Shopify-Admin-Retourenpolicy zeigt evtl. noch Pöttmes → dort auf Zadar (Shopify-seitig, Thomas).
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
8. **Externe Systeme nie „läuft/durch" nennen, wenn nur der Code gefixt ist.** Bei Ads,
   Merchant, GTM, Analytics, Shopify, Checkout, Tracking den echten End-Zustand im Konto
   oder Funnel prüfen (reingehen und schauen) oder klar sagen „nur Code-Seite gefixt, Konto
   nicht geprüft". Immer sagen WIE geprüft und WAS nicht.
