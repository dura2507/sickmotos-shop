# SickMotos — Projekt-Status & Handoff

> **Zweck:** geteilter Kontext zwischen mehreren Rechnern / Claude-Chats. Wird per
> `@PROJECT_STATE.md` in [CLAUDE.md](CLAUDE.md) automatisch in jede Session geladen.
> **Regel:** wenn sich am Stand etwas Wichtiges ändert (erledigt / neu offen / neue
> Entscheidung), diese Datei aktualisieren und committen + pushen. So bleibt jeder
> Rechner up to date. Keine Secrets hier rein (Tokens/Passwörter/API-Keys liegen in
> Vercel-Env bzw. Passwort-Manager, nie im Repo).
>
> Detaillierte Standing-Rules stehen in [AGENTS.md](AGENTS.md).
> Stand: 2026-08-13.

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
- **Merchant-Ursachenanalyse + zwei Fixes, 2026-07-26.** Stand morgens: 1446 Angebote,
  1197 freigegeben, 121 begrenzt, 128 nicht genehmigt. Website-Feld intakt (sickmotos.com,
  verifiziert+beansprucht), Checkout-Template intakt. **„Produktseite nicht verfuegbar" ist
  komplett weg** und war in keiner der 10 Fehlerarten mehr gelistet, damit ist das
  Erfolgskriterium der Vercel-Bypass-Regeln vom 23.07. erfuellt (die 2 System-Bypass-Regeln
  stehen weiter; Firewall letzte Stunde: 7.800 erlaubt, 69 geblockt, Top-Opfer eine
  Microsoft-Azure-IP, kein Google). Frischer Issues-Export gegen den **Live-Feed**
  (merchant-link-feed.csv, nicht gegen die lokale products.json, die ist vom 9. Juli und
  waere nicht belastbar) ergab:
  - **128 Ablehnungen = 121 Waehrungsfehler in den Versandinfos (USA 83, UK 30, AU 7, CA 1)
    + 7 „Produktpreis fehlt" (DE).** Kein einziges deutsches Feed-Angebot abgelehnt.
  - **Ursache Waehrung, verifizierte Kette:** die abgelehnten Angebote tragen die Feedlabels
    US/GB/AU/CA (Googles eigener Crawl von sickmotos.com), unsere Storefront zeigt jedem
    Euro (Preise auf country=DE gepinnt), die Merchant-Versandrichtlinien fuer diese Laender
    stehen aber in USD/GBP/AUD/CAD (US-Richtlinie im UI geprueft: 34,26 USD). Shopify-Versand
    ist durchgaengig Euro: DE 7,19, EU 14,99, **Restliche Welt 29,99 (10-21 Tage)**.
  - **Fix 1:** neue Merchant-Versandrichtlinie `flat_29.99_EUR_crawl_US_GB_AU_CA`
    (US, GB, AU, CA, alle Produkte, 10-22 Werktage, Pauschalpreis 29,99 EUR). Die bestehenden
    Fremdwaehrungs-Richtlinien wurden NICHT angefasst, US-Kunden sehen bei den App-Angeboten
    weiter Dollar.
  - **Fix 2 (Code, commit 741f9c9):** Produktseiten lieferten ein AggregateOffer mit
    lowPrice/highPrice ohne einzelnes `price`; Googles Crawler legte daraus Angebote ohne
    Preis an. Jetzt zusaetzlich ein Offer je Variante mit Preis, Verfuegbarkeit, SKU und
    Variantenname. Live gegengeprueft.
  - **Korrektur einer falschen Empfehlung von mir:** ich hatte vorgeschlagen, die Google-App
    auf Deutschland zu begrenzen. Falsch. Shopify-Maerkte USA, UK, Australien, Kanada und
    „Weltweit" (212 Regionen) sind aktiv, und laut Shopify-Report „Customers by location"
    ueber die gesamte Historie gibt es dort echte Kunden: **USA 78, UK 80, Australien 30,
    Kanada 18** (DE 4245, AT 1483, CH 371, NL 183, IT 121, FR 112, gesamt 7406).
  - **Rest-URL-Mismatches:** 81 Angebote, davon 37 aktuell im Katalog, alle in Kleinstmaerkten
    ohne Supplemental-Quelle. Feedlabel DE: 36 Eintraege, davon **0 aktuell** (nur Karteileichen).
    SOURCE 20 fuer Indien (INR_35948003594, an alle 3 INR-Primaerquellen) angelegt, Slot durch
    Loeschen der leeren Pakistan-Quelle frei gemacht. Offen bleiben 13 Labels mit zusammen 30
    Angeboten: RON 4, LKR 3, CAD 3, EUR_35948331274 3, AUD 3, PLN 2, JPY 2, MYR 2, SGD 2,
    SEK/THB/DKK/IDR je 1.
  - **Kein Sammel-Hebel vorhanden:** das Add-on fuer Attributregeln ist in diesem Konto nicht
    verfuegbar (angeboten werden nur API-Diagnose, benutzerdefinierte Berichte, automatische
    Rabatte, Produktbewertungen). Es bleibt beim Rezept pro Label.
  - **Offen (Regel 8):** nachpruefen, ob die 121 + 7 Ablehnungen nach Googles Reprocessing
    tatsaechlich fallen. Bis dahin ist das eine Prognose, kein Ergebnis.
- **Link-Vorschau (OG-Bilder) komplett neu, 2026-07-25** (commits 3611cc0, 31f04d5, a0fb0d1),
  ausgeloest von Thomas/Leon („die url vorschau ist ja grottig, die Schrift rendert nicht,
  das Logo muss rein"). (1) **Startseiten-Karte** `src/app/opengraph-image.tsx`: Ursache der
  falschen Schrift war, dass `next/og` nur einen generischen Fallback mitliefert und ohne
  die `fonts`-Option jedes `fontWeight` ignoriert, alles lief in Noto Sans. Bebas Neue
  (= `--font-display` der Site) ist jetzt als TTF eingebettet, `SICKMOTOS.COM` steht in
  derselben Laufweite wie die Website (tracking-tight, vorher gesperrt). Statt Fake-Logo
  (roter Kasten mit „S") jetzt `public/logo-alt-2.png` + der echte „Ride in style"-Schriftzug.
  Der Schwarz-Verlauf lag bis 85% Breite ueber dem Bike, verkuerzt; **Satori ignoriert die
  `inset`-Kurzschreibweise**, deshalb feste top/left/width/height, sonst kompositiert der
  Scrim gar nicht (harte Kante). Leon hat aus 5 Varianten „D" gewaehlt. (2) **Produktkarten**
  `src/app/products/[handle]/opengraph-image.tsx`: schwarzes Markenpanel (Logo, Titel in Bebas,
  Preis + Streichpreis, sickmotos.com) plus Produktfoto in **weisser Lightbox-Kachel**. Die
  Kachel ist noetig, weil die Shopify-Fotos mal auf Weiss, mal auf Schwarz liegen, jede
  einfarbige Flaeche erzeugt sonst bei der Haelfte der Produkte einen Fremdkoerper-Kasten.
  Titel auf 3 Zeilen geklemmt + laengenabhaengige Schriftgroesse (laengster Titel 130 Zeichen);
  alle Zeichen aller 486 Titel sind von Bebas abgedeckt (per fontTools geprueft). `force-dynamic`,
  sonst wuerde der Build 486 Karten backen; Produktfoto per Shopify-CDN-`&width=900` (spart
  zwei Drittel Bytes). **Falle:** ein explizites `openGraph.images` in `generateMetadata`
  gewinnt gegen die generierte Karte, das Meta-Tag zeigte weiter das nackte Shopify-Foto,
  deshalb ist die Liste in `page.tsx` bewusst leer. Zweite Falle: `headers` in den
  ImageResponse-Optionen wird auf Metadaten-Bildrouten von Next verworfen (live gemessen
  `public, max-age=3600`, CDN liefert ab dem 2. Abruf HIT). **Live verifiziert** auf
  sickmotos.com: Startkarte pixelgleich mit der freigegebenen Variante, 4 Produktkarten
  (Auspuff/Carbon/Dekor/Elektronik-Infografik) HTTP 200 in 0,8-1,9s, `og:image` +
  `twitter:image` + per-Produkt `og:image:alt` korrekt. Merke fuer Social: bereits geteilte
  Links haengen im Cache der jeweiligen App, Facebook/LinkedIn haben Debugger-Tools dafuer,
  WhatsApp nicht.
- **Agentur-Credit im Footer** (commit ea777e5): „made with ♡ by" + Krileo-Logo, gleiches
  Muster wie im Zadar-Rental-Projekt, Link auf **krileo.com** (von Leon bestaetigt).
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

- **BikeFinder/Modellsuche Komplett-Fix (2026-07-20, nach Thomas' „unter Beta 50 tauchen nicht
  alle Produkte auf" + Leons „Jahre ohne Ergebnisse"):** Multi-Agent-Audit (echte Matching-Logik
  gegen alle 486 Produkte ausgeführt) fand 5 Ursachen, alle gefixt + live verifiziert:
  (1) Jahr-Filter warf Produkte ohne Jahresinfo raus (8 von 13 Beta-50-Produkten, alle
  universellen 50er-LEDs/Akkus, verschwanden bei Jahreswahl) → Universalteile passieren jetzt.
  (2) Jahres-Parser konnte keine zweistelligen Endjahre („2021-24", 87x) und keine offenen
  Ranges („2020-", „2024+") → bei Beta+2023 fehlten 66 von 94 Produkten. Parser erweitert,
  Wort-Bindestriche („2021-Modelle") bleiben ausgeschlossen. (3) Jahr-Filter nutzte die
  Jahres-Union aller Marken (Yamaha-Baujahre bleedeten unter Beta) → `CardProduct.yearsByBrand`,
  Filter markenattribuiert. (4) Chips waren nicht lagerbestandsbewusst (19 leere Modell+Jahr-
  Kombos) → Marken/Modell/Jahres-Chips zählen nur In-Stock. (5) Marke **Stark** (STARK VARG,
  9 Produkte) ergänzt, war in keiner Suche. Dazu: BikeFinder-localStorage-Restore validiert
  gegen Katalog. **Live getestet:** Beta+2023 = 77 Treffer inkl. LED/Akku/Nockenwelle/FuelX,
  0 leere Kombos (lokal gegen alle Produkte gerechnet). Mobile-Layout unverändert (nur Logik).
  **Offen (Thomas' Datenseite, aus dem Audit):** ~18 Produkte mit falschem „Beta"-Tag (sind
  KTM-Duke/Yamaha-MT/Fantic-Teile), Tag „Beta RR 50 LC" auf reinen 125er-Lampen, 14 Produkte
  ohne product_type → in Shopify pflegen, dann wird die Zuordnung noch schärfer.

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
  - **Redirect-Snippet LIVE (2026-07-19 abends, Thomas hat es vom Handy eingefügt, ich habe
    geleitet + verifiziert):** in `layout/theme.liquid` (Theme „Geen Experiment", id 178472648970,
    Ella) direkt nach `<head>`. Whitelist-JS-Redirect: `/`, locale-only-Pfade (`/de`, `/en-hr` ...)
    und (mit optionalem Locale-Prefix) `collections|products|pages|blogs|search|policies` →
    sickmotos.com (Locale-Prefix wird gestript, unsere i18n ist cookie-basiert); `/cart`,
    `/checkouts`, Wallets/Payments unangetastet. **Live verifiziert:** Root → sickmotos.com,
    `/de/products/X` → `sickmotos.com/products/X` (200), Checkout via Cart-Permalink rendert
    weiter sauber. Hintergrund-Korrektur: die alte Theme WAR öffentlich sichtbar (Passwortschutz
    ist aus, frühere „Passwortseite schützt"-Annahme war falsch). Wichtig fürs nächste Mal:
    Shopify leitet `/` serverseitig auf locale-Pfade um, ein Redirect-Skript muss locale-only-Pfade
    explizit matchen. Shopifys Theme-Code-Editor rendert unter Browser-Automation nicht (Monaco
    bleibt leer); Lese-Zugriff ging über die klassische Assets-REST-API mit Session, Schreib-Zugriff
    wurde vom Permission-Classifier geblockt → Thomas' Handy-Paste war der Weg.
  - **Feed-Link-Mechanik (wichtig, verifiziert am Produkt-Rohdatensatz):** die Shopify-Feed-Links
    tragen die Domain, die beim letzten Produkt-Sync Shopify-Primary war (alte Produkte: noch
    `sick-motos.com/de/products/...`, funktioniert via 301). Seit Primary = checkout.sickmotos.com
    bekommen NEU gesyncte Produkte checkout.sickmotos.com-Links → durch das Redirect-Snippet
    landen Crawler/Kunden trotzdem auf sickmotos.com. **Operator-Resync ist damit gefahrlos.**
  - **Offen (Regel 8):** In 1-2 Tagen prüfen: (a) alle Produkte grün (Limited → Approved), (b)
    Checkout-URL-Review durch (Feld zeigt checkout.sickmotos.com), (c) Ads wieder aktiv (Thomas/
    operator hatten sie pausiert „um kein Geld zu verbrennen", reaktivieren = deren Job).
- **Merchant-Regression 183→0 diagnostiziert + doppelt gefixt (2026-07-21):** Thomas meldete
  morgens: Approved von 183 auf 0, alle 1203 Limited, Shopify-App „Ausstehend/Pending" mit
  3757 Offers (fast verdoppelt, weil de+en-Sprachvarianten doppelt eingereicht werden). Read-only
  verifiziert: einziges Produkt-Issue war wieder „Mismatched online store URL", und das Merchant-
  Feld „Deine Website" stand NICHT mehr auf sickmotos.com, sondern auf **checkout.sickmotos.com**
  (verified+claimed). Der Operator hatte KEINE CSV hochgeladen (Datenquellen zeigen keine), sein
  Upload-Versuch scheiterte an „数据源数量已达到上限" = Datenquellen-Limit (188 Quellen, die App
  legt pro Land/Währung eine an; offizielles Limit 200). Sein „Connection-Reset" hat mutmaßlich
  das Website-Feld auf die Shopify-Primary (checkout.sickmotos.com) zurückgeschrieben — ob App-
  Push oder manuell, ist von außen nicht unterscheidbar. **Fixes (beide live verifiziert):**
  (1) Website-Feld zurück auf `sickmotos.com`, Google hat sofort auto-verifiziert + beansprucht
  (Meta-Tags), Checkout-Template blieb diesmal intakt (`checkout.sickmotos.com/cart/{id}:1`).
  (2) **Dauerhafter Link-Fix statt einmaliger CSV:** neue Route
  `src/app/merchant-link-feed.csv/route.ts` (commit 508b04b) serviert
  `https://sickmotos.com/merchant-link-feed.csv` (id+link für alle Varianten, Format
  `shopify_DE_{productId}_{variantId}`, regeneriert sich pro Deploy aus products.json). Im
  Merchant als ergänzende Datenquelle „SUPPLEMENTAL SOURCE 2" angelegt (Feed-Label DE, Sprache
  Deutsch, an alle 3 „Shopify App API"-DE-Primärquellen gehängt), **täglicher Auto-Refetch 00:00**.
  Erster Fetch verifiziert: 1446 Zeilen, „alle Attribute erkannt", 412 Offers sofort gematcht;
  1034 „Produkt existiert nicht" = Offers, die die App gerade neu einreicht, matchen nach.
  Damit überschreibt der Feed die Produkt-Links dauerhaft auf sickmotos.com, egal welche Domain
  die Shopify-App schreibt. Für den Slot: leere App-Quelle NOK (Norwegen, 0 Produkte) gelöscht
  (188→187; Recherche: App legt sie evtl. neu an — egal, unsere Quelle existiert dann schon).
  **Multi-Agent-Recherche (14 Agenten, Quellen im Task-Output):** Es gibt KEIN Setting in der
  Google&YouTube-App für die Feed-Link-Domain (von Google/Shopify offiziell eingeräumt); Standard-
  Lösungen der Branche: Merchant-Feed-Regeln bzw. ergänzender Feed (= unser Weg, von Shopifys
  Hydrogen-Migrationsdoku empfohlen), alternativ Dritt-Feed-Apps (AdNabu 99$/M dokumentiert
  headless-fähig, Simprosys/Multifeed billiger aber Support fragen). Attribute-Rules im Merchant
  (Add-on „Advanced data source management", Find&Replace auf link) wären die 0-Euro-Alternative,
  ob `link` als Regelziel wählbar ist, ist unverifiziert. **Standing-Warnung ab jetzt:** Die App
  kann das Website-Feld bei Reconnect/Resync WIEDER überschreiben → nach jedem Operator-Eingriff
  Website-Feld + Checkout-Template kontrollieren; Operator angewiesen: nie mehr trennen/neu
  verbinden, Website-Feld nicht anfassen, keine CSV-Uploads mehr nötig. Offen (Regel 8): in 24-72h
  prüfen ob Approved wieder steigt (Prognose laut Google-Doku, gestern ging es in Stunden los);
  „Pending"-Status der App-Verbindung = Googles Review nach dem Reconnect, nicht anfassen.
  Nebenbei: GitHub-HTTPS-Token dieses Rechners ist tot, `origin` auf SSH umgestellt
  (`git@github.com:dura2507/sickmotos-shop.git`, Key `~/.ssh/id_ed25519_github` funktioniert).
- **Regression Nr. 2 gleicher Ursache + Recovery läuft (2026-07-21 nachmittags):** Feld „Deine
  Website" stand WIEDER auf checkout.sickmotos.com (dritte Umschreibung; Thomas-Screenshots 11:41,
  Approved 183→0, App-Verbindung „Pending", CSV-Upload des Operators scheiterte am Quellen-Limit,
  Fehlertext auf seinem Screenshot: „数据源数量已达到上限"). Um ~13:40 CEST zurück auf
  `sickmotos.com` gestellt (Auto-Verify + Auto-Claim via Meta-Tags griffen sofort, Checkout-
  Template blieb intakt). **Recovery messbar schnell:** ~30 Min später Approved 0→194 (über
  gestrigem Peak 183), Limited 1203→1009. Zusätzlich Supplemental-Feed-Refetch MANUELL getriggert
  (Quellen-Detailseite → „更新/Aktualisieren"-Button; letzter Fetch danach 13:59 CEST), statt auf
  den 00:00-Auto-Fetch zu warten. Merke: der Refetch-Button ist der Beschleuniger-Hebel nach jedem
  Link-Rewrite der App. Rest-Issues im Diagnostics-Snapshot 13:40: 791 Mismatch (löst der Feed
  auf) + 216 „Produktseite nicht erreichbar" = VERALTETER Flag, live widerlegt (Beispiel-URL
  liefert 200 in <1s für normale UA, Googlebot UND Storebot-Google; Produkt existiert, Link steht
  seit dem Feed-Match auf sickmotos.com). Zeitachse-Falle: Merchant-UI zeigt Zeiten in Konto-
  Zeitzone „AST" (6h hinter CEST), 07:40 AST = 13:40 CEST. Prognose (als Prognose an Leon/Thomas
  kommuniziert): Großteil der 1009 Limited sollte binnen 24-48h drehen, gemessen an 0→194 in 30
  Min; „Wochen"-Extrapolation von gestern Abend ist obsolet, weil der Feed jetzt ALLE Links auf
  einmal überschreibt statt Produkt-für-Produkt-Resync. Falls es doch stockt, Plan B aus der
  Recherche: Attribute-Rules-Add-on bzw. AdNabu (~99$/M).
- **Mismatch-Struktur exakt vermessen + zweite Supplemental-Quelle für DE/Englisch (2026-07-21
  ~14:30):** Issues-Export aus Diagnostics (10.686 Zeilen) gegen products.json gerechnet:
  Mismatch = nur 428 unique Offers (Karte zeigt 791 wegen Länder-Multiplikation), davon 373
  aktuelle Produkt+Variante, 55 gelöschte Varianten (expiren von selbst), 0 gelöschte Produkte.
  Aufteilung nach (FeedLabel, Sprache): **DE/de nur noch 49, DE/en 88** (= Deutschland), Rest
  Länder-Tail (AT/en 107, ES/es 91, EUR-Multi/en 134, GR 42, NL 40, ...). Kernerkenntnis: die
  App reicht jedes Produkt doppelt ein (de+en), unsere Supplemental-Quelle griff nur fuer (DE,
  Deutsch) → en-Offers blieben mismatched. Die 218 „Produktseite nicht erreichbar" sind ALLE
  aktuelle Produkte, URLs liefern 200 (auch Googlebot/Storebot) = stale Flags. **Fix:**
  „SUPPLEMENTAL SOURCE 3" angelegt (gleiche Feed-URL, Feed-Label DE, Sprache ENGLISCH, an beide
  „Shopify App API (DE, 英语)"-Quellen gehängt, täglicher Fetch 00:00): erster Fetch 1446 Zeilen,
  **81 en-Offers sofort gematcht**. Für den Slot TZS/Tansania-Quelle gelöscht (0 Produkte; Fehler
  beim Anlegen vorher: „您已超出 Feed 限制"). Länder-Tail (~330 Offers außerhalb DE) bewusst offen,
  bräuchte je (Label, Sprache) eine weitere Quelle + Slot-Löschung; erst mit Leon klären ob nötig,
  deutsche Ads blockiert er nicht.
- **Abend-Beschleunigung (2026-07-21 ~19:30-20:15, nach Leons „muss schneller gehen"):** Approved
  hing seit ~14:30 bei 275 (die zwei Schübe 194+81 = exakt unsere zwei Feed-Matches). Frischer
  Issues-Export bewies: DE-Mismatch bei AKTUELLEN Produkten = 0 (nur noch 54 tote Varianten),
  d.h. Deutschland ist datenseitig komplett, es hängt NUR an den 218 stale „Unreachable"-Flags.
  Getan: (1) **„Websiteprüfung anfordern"-Button gefunden + geklickt** (Diagnostics → Karte
  „无法访问商品页面" → 查看解决方案 → 申请网站检查): Google re-crawlt die Seiten, dauert bis 12h,
  danach 12h-Sperre für erneuten Antrag. DER Hebel für stale Unreachable-Flags. (2) **Drei
  weitere Supplemental-Quellen** für den Länder-Tail (gleiche Feed-URL, tägl. 00:00): SOURCE 4 =
  EUR_35948069130/en (Österreich, 107), SOURCE 5 = EUR_35948265738/es (Spanien, 87 sofort
  gematcht), SOURCE 6 = EUR_35948003594/en (Multi-Label 20 Länder, 134). Für Slots gelöscht
  (alle 0 Produkte): THB/Thailand, EUR_35948265738/en-Quelle (Spanien englisch), AUD/Australien.
  Verbleibender Klein-Tail (~230 Offer-Einträge: GR 42, NL 40, BE 33, PT 27, FI 25, IT 21, FR 19,
  Rest Mini) bewusst offen, bei Bedarf gleiches Muster. Merke Dialog-Falle: URL/Label-Feld erst
  NACH Seiten-Load beschreibbar, Klicks landen sonst ins Leere; Sprach-Dropdown via find/ref
  klicken, Koordinaten verrutschen.
- **Tag 2 der Recovery (2026-07-22 vormittags/mittags):** Über Nacht 733→876 Approved, aber
  Gesamt-Offers 1196→1482 (App reicht ~290 nach), NEU: 130 „Nicht genehmigt" = ESKALIERTE
  Alt-Mismatches (Google stuft lange ungelöste Limited auf Disapproved hoch, kein neues Problem),
  16 in Prüfung. Frischer Issues-Export: DE-Mismatch aktuell weiter 0 (nur 53 tote Varianten),
  Tail exakt die Länder ohne Quelle (NL 40, BE 33, PT 27, FI 23, IT 21, FR 19). Die 105
  „Unreachable" (alle DE/de, davon 29 Lampen → Thomas' „exakt viele Lampen nicht grün") sind
  über Nacht NICHT abgeschmolzen → **2. Websiteprüfung angefordert** (12h-Cooldown war um; Toast
  bestätigt „bis zu 12 Stunden"). **SOURCE 8 (NL) + SOURCE 9 (BE) angelegt** (gleiche Feed-URL,
  en, an die Label-Quellen gehängt, erste Fetches manuell getriggert); für Slots Ukraine-, Irland-
  und Schweden-Leichen gelöscht (0 Produkte). WICHTIG: **die App legt gelöschte Länder-Quellen
  über Nacht NEU an** (Irland war heute wieder da) = Limit-Treadmill, pro neuer Quelle ~1-2
  frische Löschungen einplanen. Googles eigener Crawl („von Google entdeckt" sickmotos.com)
  speist jetzt 289 Produkte ein. PT/FI/IT/FR + Minis offen (Italien-Quelle NICHT löschen, ist
  einziges Attach-Target). **Sprachen-Dauerfix:** Operator hatte die Konto-Sprache heute wieder
  auf Chinesisch gestellt (gestern auf Englisch gesetzt); statt Ping-Pong jetzt in Einstellungen →
  Benutzerdefinierte Einstellungen die persoenliche Anzeigesprache „Bevorzugte Sprache meines
  Google-Kontos verwenden" aktiviert → UI dauerhaft Deutsch fuer kristian2507@gmail.com,
  unabhaengig von der Konto-Sprache. Ads: Thomas hat Kampagnen wieder aktiviert (PMax Germany
  aktiv, „58% abgelehnt" = die noch limitierten Produkte, faellt mit der Recovery).
- **Tag-2-Nachmittag (2026-07-22):** 2. Websiteprüfung hat die „Unreachable"-Karte KOMPLETT
  geleert (105→0, Karte aus Diagnostics verschwunden, inkl. der 29 Lampen). Approved-Verlauf:
  876 (Vormittag) → 997 (Mittag), Mismatch 352→316. **SOURCE 10 (Portugal, EUR_35948495114/en)
  angelegt**, erster Fetch: 1446 Zeilen, 27 Offers sofort gematcht; dafuer Slowakei-Quelle (0
  Produkte) geloescht. Offen nur noch FI (23), IT (21), FR (19) + Minis; Italien-Label-Quelle
  als einziges Attach-Target NICHT loeschen. UI-Falle geloest: Sprach-Dropdown im Supplemental-
  Dialog oeffnet unter dem Cursor und verschluckt Klicks → zuverlaessig via find/ref oder
  Tastatur-Typeahead. SEK-Quelle hatte ploetzlich 1 Produkt (App befuellt Leichen wieder).
- **Nachtschicht Laender-Komplettausbau (2026-07-23 ~00:00-02:00):** Frischer Issues-Export
  (Produktprobleme_2026-07-22_18-01-39.csv, 266 unique Mismatch-Offers) gegen products.json
  gerechnet: 86 tote Varianten (expiren von selbst, werden NIE gruen), 180 lebende. ALLE Labels
  mit Quelle standen auf 0 lebenden Mismatches (Muster funktioniert), nur BE hing (30, Quelle ok,
  Google-Reprocessing-Lag, Refetch getriggert 18:06 AST). Danach 7 neue Supplemental-Quellen fuer
  den Rest-Tail angelegt (gleiche Feed-URL, en, an die Label-Primaerquellen gehaengt, Fetch je
  getriggert/gelaufen): **SOURCE 12 Italien** (EUR_35948167434, 21 Offers), **13 Frankreich**
  (EUR_35948036362, 18), **14 Spanien-englisch** (EUR_35948265738/en, 11), **15 Philippinen**
  (PHP_35948003594, 18, 3 Primaerquellen), **16 USA** (USD_35948200202, 16), **17 England**
  (GBP_35948298506, 11 matched), **18 Schweiz** (CHF_35948134666, 10 matched). Fuer Slots
  geloescht (alle 0 Produkte, 0 Offers im Export): MMK/Myanmar, SAR/Saudi-Arabien,
  USD_35948003594 (Ecuador-Multi), UZS/Usbekistan, UYU/Uruguay, PYG/Paraguay, PLN/Polen.
  Damit ist JEDES Label mit zweistelliger Offer-Zahl versorgt; Rest-Tail ohne Quelle nur noch
  Minis (~35 lebende: INR 7, RON 5, AUD 5, LKR 4, IE 3, CAD 3 + je 1-2), bei Bedarf gleiches
  Muster. Leon nachts gebrieft (warum Loeschungen = Slot-Treadmill; sein Produkt-Editor-Screenshot
  zeigte sick-motos.com-Link = exakt unser Kernproblem, NICHT manuell editieren). Prognose an
  Leon als Prognose: Hauptschub binnen 24-48h, ~86 tote Varianten bleiben dauerhaft aussen vor.
  UI-Fallen der Nacht: Merchant-SPA-Tab haengt nach vielen Navigationen dauerhaft in
  "Page still loading" → frischen Tab oeffnen; Sprach-Dropdown rendert erst kompakt, dann gross
  → IMMER 3-4s warten + Screenshot vor dem Klick (einmal Franzoesisch erwischt, korrigiert);
  URL/Label-Felder schlucken den ersten type → immer nachpruefen + neu tippen.
- **Morgen-Check + Belgien-Blocker gefixt (2026-07-23 ~09:00-10:00):** Website-Feld intakt
  (sickmotos.com, App hat NICHT umgeschrieben). Recovery ueber Nacht: 941 Freigegeben / 248
  Begrenzt / 0 Nicht genehmigt (von 888/314/2), Mismatch-Karte 265→158. Frischer Export bewies:
  ALLE 7 Nacht-Quellen wirkten (IT/FR/ES-en/PHP/USD/GBP/CHF alle 0 lebende Mismatches). Einziger
  Haenger: **Belgien 30 alive TROTZ Quelle** → Ursache gefunden: es gibt DREI "Shopify App API
  (EUR_35948232970, en)"-Primaerquellen, SOURCE 9 hing nur an EINER. Fix: **SOURCE 19** angelegt
  (gleiche Feed-URL, en, an ALLE DREI BE-Quellen gehaengt), Fetch 03:03 AST, 30 matched. Slots:
  MAD/Marokko + PLN + UZS + UYU + USD-Multi (Ecuador) geloescht (alle 0 Produkte; App legt
  Leichen laufend neu an, MAD war frisch). MERKE fuers Muster: bei jedem neuen Label IMMER alle
  gleichnamigen Primaerquellen im Dropdown anhaken (manche Labels haben 2-3 Duplikat-Quellen)!
  Rest offen: ~45 lebende Mini-Offers ohne Quelle (INR 7, RON 5, AUD 5, LKR 4, PLN 4, IE 3,
  CAD 3, Rest 1-2; PLN-Attach-Target geloescht → erst wieder moeglich wenn App sie neu anlegt),
  ~83 tote Varianten (expiren). Create-Flow-Falle: nach Feedlimit-Toast bleibt der Erstellen-
  Button tot, Formular-State ist invalide → Flow ganz neu starten (force-reload), nicht am
  haengenden Formular weiterklicken.
- **Deep-Research + Vercel-DDoS-Fix (2026-07-23 ~10:00-11:00, nach Leons "was rotes wieder"):**
  Das Rote war NICHT der URL-Fix (der faellt weiter: 265→128), sondern (a) **"Produktseite
  nicht verfuegbar" zum 3. Mal zurueck (96)** und (b) neu **"Nicht uebereinstimmende Waehrung
  in Versandinfos" (64)** auf den Fremdwaehrungs-Offers + der rote Disapproval-Berg im
  Free-Listings-Chart. Deep-Research (104 Agenten, 22 Quellen, 16 bestaetigte Claims):
  (1) Websitepruefung ist per Google-Doku NUR ein Review-Beschleuniger, kein Fix — Google
  re-crawlt routinemaessig, Flag kommt wieder bis der echte Blocker weg ist; curl-200 beweist
  nichts (Google crawlt von eigenen IPs, geo-verteilt, in Bursts). (2) **Vercel-Befund: Bot
  Protection Inactive, 0 Custom Rules, ABER automatische DDoS-Mitigation blockt massiv
  legitime Crawler: 1.800 Denied + 132 Challenged in 24h, Top-Opfer Microsoft/Bingbot!**
  Verified-Bot-Ausnahme ist fuer die System-DDoS-Mitigation NICHT dokumentiert → bester
  Kandidat fuer die wiederkehrenden Google-Flags (Indiz, kein Beweis: Google war im 24h-
  Fenster nicht dabei, Merchant-Crawls kommen nur alle ~2 Tage). **FIX UMGESETZT: 2 System-
  Bypass-Regeln in Vercel Firewall → Rules** (sickmotos.com): 66.249.64.0/19 (Kern-Range
  Googlebot/Storebot aus common-crawlers.json) + 192.178.4.0/22 (neue Google-Range). Damit
  kann die DDoS-Mitigation Google-Crawls nicht mehr blocken. 3. Websitepruefung angefordert
  (leert die 96 binnen 12h). Erfolgskriterium: Flag darf danach NICHT mehr zurueckkommen;
  falls doch, Bing-Range ergaenzen + Vercel-Support wegen System-Mitigation-Ausnahmen.
  (3) **Waehrungs-Fix + Wurzelbehandlung Laender-Sprawl (Empfehlung, mit Leon/Thomas klaeren):**
  Die Google&YouTube-App KANN offiziell auf ausgewaehlte Laender begrenzt werden: App-Settings
  → Countries and Languages → Manage → Automatic sync OFF → nur DE (+Wunsch-EU) waehlen
  (Shopify+Google-Doku, verifiziert; auf unserem Store ungetestet). Das entfernt Fremdwaehrungs-
  Offers an der Quelle (= Waehrungsfehler + Quellen-Treadmill weg). ABER: ob bestehende Offers/
  Feed-Label sauber verschwinden ist undokumentiert; Reconnect kann Auswahl zuruecksetzen.
  (4) Website-Feld: Google-Doku bestaetigt offiziell, dass die App das Feld schreibt; KEIN
  Lock-Mechanismus dokumentiert → Kontroll-Routine bleibt. Bing wird von der DDoS-Mitigation
  ebenfalls massiv geblockt (SEO-Thema, Leon entscheiden ob Bypass auch fuer Bing).
- **Feld-Umschreibung Nr. 4 + Nacht-Konsolidierung (2026-07-22 ~23:00):** Thomas meldete
  „Hin und Her, mal 950, nun 888". Zwei getrennte Effekte: (1) Google/App hat ~280 Doppel-
  und Zombie-Offers ganz entfernt (Gesamt 1482→1204, die 130 Disapproved auf 2 runter,
  Quote real VERBESSERT: 74% gruen). (2) Website-Feld stand WIEDER auf checkout.sickmotos.com
  (4. Mal; Zeitfenster ~15-23 Uhr, App-Sync mutmasslich). Um ~23:10 zurueckgestellt
  (Auto-Verify sofort, Checkout-Template intakt), SOURCE-2-Refetch manuell getriggert.
  Tags zuvor: SOURCE 11 (Finnland, EUR_35948429578/en) angelegt, erster Fetch 21 Offers
  gematcht; MYR/Malaysia + SK geloescht. IT (21) + FR (19) noch offen (Loesch/Create-Grind,
  deutscher Confirm-Button heisst „Entfernen" bei (1028,437), NICHT (959,437)=Abbrechen!).
  **Konsequenz ab jetzt: bei JEDEM Check zuerst das Website-Feld pruefen. Strukturell klaeren
  (morgen): Kann man der App die Website-Verwaltung entziehen bzw. das Feld sperren?**
- **Restlicher Laender-Tail komplett abgearbeitet (2026-07-27 vormittags):** 11 neue
  Supplemental-Quellen angelegt, damit hat JEDES Label mit lebenden Mismatch-Offers eine
  Quelle: **SOURCE 23** CAD_35948593418 (Kanada, erster Fetch 1446 Zeilen / 3 Offers
  gematcht, verifiziert), **24** EUR_35948331274, **25** AUD_35948658954 (Australien),
  **26** PLN_35948626186 (Polen, beide Primaerquellen angehaengt), **27** DKK_35948396810
  (Daenemark, 3 Primaerquellen), **28** SEK_35948364042 (Schweden), **29** JPY_35948003594
  (Japan, 3), **30** MYR_35948003594 (Malaysia), **31** SGD_35948003594 (Singapur, 2),
  **32** THB_35948003594 (Thailand), **33** IDR_35948003594 (Indonesien, 3). Alle mit
  Feed-URL `https://sickmotos.com/merchant-link-feed.csv`, Sprache Englisch, taeglicher
  Auto-Fetch 00:00. Fuer die Slots geloescht (alle 0 Produkte, keine lebenden Offers):
  KRW/Suedkorea, DZD/Algerien, NZD/Neuseeland, NIO/Nicaragua, XAF/Kamerun, ETB/Aethiopien,
  DOP/Dominikanische Republik, TWD/Taiwan, CRC/Costa Rica, VND/Vietnam, KHR/Kambodscha
  (11 Stueck, Primaerquellen 167→162→…). **Stand danach live geprueft (Uebersicht 27.07.):
  1425 Produkte, 1341 Freigegeben (94,1%), 74 Begrenzt, 10 Nicht genehmigt, 0 in Pruefung**
  (Sessionstart war 1320/94/10). Diagnostics: „Abweichende Onlineshop-URL" nur noch **69
  Produkte (4,8%)** — genau die Labels, die die neuen Quellen jetzt bedienen; dazu **10x
  „Produktpreis fehlt"** (Google muss die gefixten Produktseiten mit den Per-Varianten-Offers
  neu crawlen). UI-Fallen dieser Runde: (a) das erste `type` nach Seiten-Load wird
  verschluckt, das zweite kommt an — immer per Screenshot pruefen, sonst steht der Wert
  doppelt drin; (b) Sprach-Dropdown NUR klicken, wenn der Screenshot die GROSSE Liste zeigt
  (Englisch dann bei y=216), sonst erwischt man Deutsch/Franzoesisch; (c) im
  Zeilen-Kontextmenue liegt der echte Hit-Bereich ~20px unter dem gezeichneten Text
  („Quelle loeschen" bei rowY+37), und es haengen alte Menue-Knoten im DOM → immer den
  zuletzt gerenderten nehmen bzw. nach Screenshot klicken.

- **Admin-Serverfehler: Upstash-Kontingent aufgebraucht, Code jetzt ausfallsicher
  (2026-07-28, commit d88afcf).** Thomas morgens: „Die Admin Page ist nicht mehr
  erreichbar" plus Safari-Screenshot „A server error occurred". **Ursache im
  Vercel-Runtime-Log gefunden, nicht geraten:** `[track] recordVisit failed:
  UpstashError: Command 1 [ incr ] failed: ERR max requests limit exceeded.
  Limit: 500000, Usage: 500000`. Das Gratis-Kontingent von Upstash ist weg,
  danach wirft **jedes** Redis-Kommando. `/api/track` hatte ein try/catch, alle
  Admin-Seiten nicht, und im ganzen Projekt gab es **keine einzige error.tsx** →
  Next liefert den nackten 500. Rechnung dahinter: `recordVisit` feuerte **12
  Kommandos pro Seitenaufruf** (6 Schreib + 6 expire, Upstash zaehlt jedes
  Pipeline-Kommando einzeln), macht 500.000/12 = **41.666 Aufrufe im Monat**.
  Dazu kostete jeder Admin-Aufruf ~157 Kommandos (30x GET + 30x SCARD + 97x
  HGETALL), bei force-dynamic also pro Reload neu.
  - **Gefixt:** neue `src/lib/redisSafe.ts` (ein Client + `safe()`, faengt jeden
    Kommandofehler, loggt max. 1x/Minute je Instanz statt 1x pro Aufruf);
    `src/app/admin/error.tsx` als erste Fehlergrenze ueberhaupt; Leseergebnisse
    unterscheiden jetzt **„leer" von „keine Antwort"** (undefined-Sentinel), die
    Seiten zeigen Striche + ehrlichen Hinweis statt erfundener Nullen.
  - **Datenverlust-Sicherungen (waren echte Bomben):** `deleteCorrection` lief
    als `del` + `rpush` ohne Transaktion, ein Fehler dazwischen haette **alle**
    Korrekturen geloescht → jetzt `multi()`. `getBotKnowledge` gab bei Lesefehler
    `""` zurueck, ein anschliessender Merge haette das ganze Wissens-Dokument
    ueberschrieben → jetzt `undefined`, `applyCorrection` bricht ab. Der Editor
    auf /admin/bot wird bei Ausfall **ausgeblendet**, sonst wuerde ein Klick auf
    „Wissen speichern" das leere Textfeld schreiben.
  - **Verbrauch halbiert:** TTL nur noch einmal pro Tag statt pro Aufruf
    (`expire ... NX` + In-Memory-Guard) → 12 auf **6 Kommandos je Aufruf**
    (~83.000 Aufrufe/Monat statt 41.666); `MGET` statt 30 Einzel-GET;
    60-Sekunden-Cache auf dem Analytics-Schnappschuss; Client dedupliziert
    denselben Pfad 30s lang (der Sprachwechsel laedt die Seite neu und zaehlte
    bisher doppelt).
  - **Verifiziert, nicht behauptet:** lokaler Dev-Server mit absichtlich kaputten
    Upstash-Zugangsdaten, eingeloggt per curl → /admin, /admin/dashboard,
    /admin/chats, /admin/bot, /admin/visitors alle **200** statt 500, Hinweise
    und Striche im HTML, auf /admin/bot **kein `<textarea>`** (Editor korrekt
    verborgen), Shop-Startseite 200, /api/track 200, nur **2** Logzeilen trotz
    vieler Aufrufe. Live nach Deploy: alle Admin-Routen antworten, ausgeloggt
    307 auf den Login.
  - **NICHT per Code loesbar (Entscheidung Leon):** das Kontingent selbst. Es
    laeuft weiter auf Anschlag (im Live-Log nach dem Deploy weiter sichtbar),
    bis es zurueckgesetzt wird oder der Upstash-Plan hochgestuft wird. Solange
    zeigt der Admin den ehrlichen Hinweis statt Zahlen. Dritte Option waere eine
    neue Redis-Datenbank, das killt aber die komplette Besucher-Historie plus
    alle Bot-Chats und Korrekturen. **Die Besucherzahlen der Ausfalltage sind
    endgueltig weg**, Umsatz und Bestellungen nicht (die kommen aus der
    Shopify-Orders-API). Offen ausserdem: ob die 500k organischer Traffic waren
    oder Missbrauch, `/api/track` ist weiter ein offener POST ohne Rate-Limit
    (Origin-Pruefung bewusst NICHT eingebaut, weil sendBeacon je nach Browser
    keinen Origin-Header schickt und das Tracking still auf null faellt, gehoert
    in die Vercel-Firewall).

- **Tracking-Audit nach Operator-Anfrage „migrate complete Google tracking codes"
  (2026-07-28, alles selbst nachgeprueft, kein Code geaendert).** Antwort auf die
  Anfrage: **nichts muss migriert werden**, alte und neue Seite benutzen dieselben
  drei IDs. Kaputt ist die Verdrahtung.
  - **Laeuft nachweislich:** GTM `GTM-NN3V8K3D` auf allen Seiten, GA4
    `G-CJ8F4XV6F9` bekommt Seitenaufrufe auch bei Client-Navigation.
  - **BUG, selbst im Browser bestaetigt:** `window.google_tag_manager` auf
    sickmotos.com enthaelt den Schluessel **`AW-AW-395813654`**. Im Container
    steht `vtp_conversionId: "AW-395813654"` in einem Feld, das `AW-` selbst
    voranstellt. Gegenprobe per curl: `gtag/js?id=AW-395813654` liefert 5x
    `__ccd_ads_conv_marking`, `AW-AW-395813654` liefert **0** (generischer Stub).
    Das Remarketing-Tag adressiert also ein Konto, das es nicht gibt. **Fix: im
    GTM-Feld nur `395813654` eintragen. Operator-Job, ein Feld.**
  - **Ecommerce-Events verpuffen:** der Container hat 4 Tags und 2 Trigger
    (`gtm.init`, `gtm.js`), **kein GA4-Event-Tag, kein Custom-Event-Trigger**.
    `src/lib/analytics.ts` pusht view_item/add_to_cart/begin_checkout korrekt,
    es hoert nur niemand zu. Kein Code-Bug, reine Container-Arbeit.
  - **Conversion-Tag auf unserer Domain: `grep -c __awct` = 0.** Und es kann dort
    auch keins geben: der Checkout liegt auf checkout.sickmotos.com bei Shopify,
    `next.config.ts` leitet /checkout sogar zurueck auf /shop. **Kein Code, den
    wir schreiben, kann jemals ein purchase-Event ausloesen.** Gute Nachricht:
    weil checkout.sickmotos.com eine Subdomain ist, ueberleben `_ga` und
    `_gcl_au` den Sprung identisch, es braucht kein Cross-Domain-Linking.
  - **Kauf-Conversion ist in der Google-und-YouTube-App hinterlegt**
    (`AW-395813654/mhrbCIvzg7oaEJbG3rwB`), aber in einem echten Checkout war
    `window.google_tag_manager` **null**. Verdacht: EEA-Consent-Gating, unser
    Banner schreibt nach localStorage (origin-scoped), Shopify sieht das nie;
    `setTrackingConsent` kommt im Repo **0x** vor. **Muss im Ads-Konto geprueft
    werden: kommen seit dem Umzug ueberhaupt Kaeufe an? Wichtigster Einzelcheck.**
  - **Doppelzaehl-Risiko:** in Shopify liegt zusaetzlich ein eigenes Pixel
    `227115274` „thank yoy page tracking". Inhalt von aussen nicht lesbar. Wenn
    es eine zweite Ads-Conversion feuert, werden Bestellungen doppelt gezaehlt.
  - **Anfragen-Conversion `MNNtCLH-3PAZEJbG3rwB`** haengt an
    `sick-motos.com/pages/contact`, die Seite existiert nicht mehr. Die neue
    Seite hat ueberhaupt kein Kontaktformular, nur zwei mailto-Links und den
    SickBot. Was als Anfrage zaehlt, muss der Operator definieren.
  - Kleinkram bestaetigt: GTM laedt auch auf /admin (Skripte sitzen ausserhalb
    des isAdmin-Zweigs), `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` weiter `sick-motos.com`,
    Conversion-Linker zeigt noch auf zwei tote Hosts, zwei identische
    `__googtag`-Tags mit derselben GA4-ID.
- **Die letzten 66 „Begrenzt" sind tote Varianten, kein Feed-Problem (bewiesen 2026-07-29):**
  Nach dem Laender-Komplettausbau blieben 66 Produkte mit „Abweichende Onlineshop-URL"
  haengen, ohne dass eine weitere Quelle etwas bewirkt haette. Ursache jetzt am
  Einzelobjekt bewiesen, nicht geschaetzt. Google haelt zu einem Produkt Angebote mit
  **Varianten-IDs, die es in Shopify nicht mehr gibt**; unser Supplemental-Feed
  ueberschreibt aber per Angebots-ID, kann diese Karteileichen also grundsaetzlich
  nicht erreichen. Sauberer Gegenbeweis an EINEM Produkt (10077911318794, SickMotos
  Tuning Nockenwelle Beta RR 125 LC):
  - `shopify_DE_10077911318794_51209771647242` (steht in merchant-link-feed.csv):
    Status **Freigegeben**, Feld „Produktseite auf Ihrer Website" =
    `https://sickmotos.com/products/...`, letzte Aktualisierung vor 8 Stunden.
  - `shopify_DE_10077911318794_51209771712778` (steht NICHT im Feed): Status
    **Begrenzt**, gar kein Website-Feld mehr, **letzte Aktualisierung 17. Mai 2025**,
    und Titel und Beschreibung passen nicht mal zueinander (Titel Nockenwelle,
    Beschreibung Injector) = eindeutig ein eingefrorener Altdatensatz.
  Zweiter Stichprobenfund gleicher Bauart: `shopify_DE_10037524267274_51319103684874`
  (Label EUR_35948069130, en), im Feed stehen fuer dasselbe Produkt drei voellig
  andere Varianten-IDs. Passt zur Messung vom 23.07. (~86 tote Varianten, „werden NIE
  gruen") und dazu, dass die Zahl ohne jedes Zutun weiter faellt (69 auf 67 auf 66).
  **Konsequenz: hier ist nichts mehr zu tun, die Eintraege laufen von selbst aus.**
  Wichtig fuer die Kommunikation: der Vorschlag des Operators, deswegen den
  Shopify-Support wegen „API-generierter Landingpage-URLs" anzuschreiben, zielt am
  Problem vorbei. Unsere Links sind nachweislich korrekt, die Altdatensaetze haben
  ueberhaupt keinen Link mehr.

- **Upstash auf Pay As You Go hochgestuft, Ausfall beendet (2026-07-29, Leons Freigabe).**
  Das Gratis-Kontingent (500.000 Kommandos/Monat) war seit dem 28.07. aufgebraucht. Der
  sichtbare Schaden war nicht die fehlende Statistik, sondern **der Bot**: `getBotKnowledge()`
  lieferte `undefined`, der Korrektur-Block wurde uebersprungen, und `/api/chat` antwortete
  trotzdem. Live gemessen am echten Endpunkt: Frage nach dem Rabattcode, Antwort „Aktuell habe
  ich keinen aktiven Rabattcode" (EXTRA5 steht NUR im Korrektur-Dokument, `grep` in
  botKnowledge.ts = 0 Treffer). Betroffen waren damit auch H4-Adapter, 3-Pin/4-Pin und die
  LED-Wandler-Regeln.
  - **Wo abgerechnet wird, jetzt belegt:** die Datenbank ist eine **Vercel-Marketplace-Ressource**
    (`store_R2WKiSeYPPQqxD7U`, `upstash-kv-fuchsia-queen`, Integration `icfg_bJLKwWrAX4ZZCO7qGxpl1SBq`,
    Region fra1) im Team `dura2507s-projects` (Leons Agentur-Account, 14 Projekte). **Nicht** in
    einem separaten Upstash-Konto und **nicht** bei Thomas. Thomas kann dort deshalb nicht selbst
    kaufen, ohne Zugriff auf alle anderen Kundenprojekte zu bekommen. Abgemacht: Leon zahlt, Thomas
    erstattet.
  - **Der Tarifwechsel ist ein reiner Oberflaechen-Vorgang.** `vercel integration update --plan`
    greift nur bei Integrationen mit `supportsInstallationBillingPlans: true`, unsere hat `false`
    und der Tarif hat `"scope": "resource"`. Im CLI-Quellcode existiert kein Endpunkt fuer einen
    Tarifwechsel auf Ressourcen-Ebene, nur `.../billing/threshold`. Weg: Storage → Ressource →
    „Change Configuration" → Tarif waehlen → Continue → Update.
  - **Gewaehlt: `paid` / Pay As You Go, 0,20 USD je 100K Kommandos**, 10 GB, 10.000 Kommandos/sec.
    Bei rund 500.000 bis 600.000 Kommandos im Monat sind das ca. 1,00 bis 1,30 USD. Bewusst NICHT
    genommen: Prod Pack (+200 USD/Monat), Auto Upgrade, Read-Regions (je +5 USD). Alle drei stehen
    per API bestaetigt auf `False` bzw. leer.
  - **Verifiziert, nicht behauptet:** API sagt `billingPlan.id = paid`, `billingState active`,
    `usageQuotaExceeded false`, `autoUpgrade false`, `prodPack false`, `readRegions []`. Danach
    derselbe Bot-Test noch einmal: **„Ja, auf die erste Bestellung gibt es den Code EXTRA5"**.
    Redis liest und schreibt also wieder. Das Admin-Panel habe ich NICHT selbst angesehen (kein
    Passwort auf diesem Rechner), aber es haengt an derselben Datenbank.
  - **Kein Ausgabenlimit gesetzt.** `vercel integration-resource create-threshold` gehoert zur
    Guthaben-Aufladung (`<resource> <minimum> <spend> <limit>`), und der Balance-Endpunkt der
    Installation antwortet leer, hier laeuft also kein Prepaid-Modell. Ein Deckel muesste ueber
    die Oberflaeche gesetzt werden, falls gewuenscht.
  - **Wiedervorlage 01.09.2026:** Verbrauchskurve eines vollen August ansehen. Unter 300.000
    Kommandos war die Halbierung vom 28.07. allein ausreichend und der Tarif ist nur Versicherung.
    Ueber 450.000 ist der naechste Hebel der Admin-Lesepreis (Cache hoch, Top-Listen auf 7 Tage),
    nicht mehr Geld. Zurueck in die Gratisstufe geht laut Upstash-AGB nicht.
  - **Offen:** ob die 500.000 organischer Traffic waren oder Missbrauch. `/api/track` ist weiter
    ein offener POST ohne Rate-Limit. Klaeren liesse sich das an der Tageskurve im Upstash-Konto.

- **Admin-Panel nach dem Upstash-Upgrade mit eigenen Augen geprueft (2026-07-30).** Nicht ueber
  das Passwort, sondern ueber Leons eingeloggte Browser-Sitzung. `/admin` zeigt 537 EUR heute,
  305 Besucher, 865 Aufrufe, echte Bestellungen und Chats. `/admin/visitors` zeigt 2970 Besucher
  (7 Tage), 16143 (30 Tage), Top-Seiten, Laender, Referrer, Sprachen. `/admin/bot` zeigt 102
  Korrekturen, 10037 Zeichen, Status Aktiv, **Editor wieder sichtbar** (der war bei Ausfall
  bewusst versteckt). Keine Striche, keine StoreNotice-Kaesten. Merke: die Vercel-Oberflaeche
  und lange benutzte Merchant-Tabs haengen unter der Browser-Automatisierung dauerhaft in
  „Page still loading", frischer Tab loest es; die Vercel-Log-CLI liefert hier gar keine Zeilen,
  taugt also nicht als Nachweis.
- **„Fehlende Altersgruppe" (7 Produkte) ueber den eigenen Feed geloest (2026-07-30, commit
  6b60e68).** Statt in Shopify Produkt fuer Produkt zu pflegen, liefert
  `src/app/merchant-link-feed.csv/route.ts` jetzt eine dritte Spalte `age_group` mit dem Wert
  `adult` fuer jede Zeile. Belegt statt geraten: von 486 Produkten enthaelt **kein einziger
  Titel** einen Kinder-, Jugend-, Baby- oder Junior-Begriff, die Produkttypen sind ausschliesslich
  Motorradteile (Dekor 180, Kruemmer 39, Carbon-Schutz, Angel EYES, ECU Tuning). `adult` ist damit
  fuer den ganzen Katalog korrekt, und neue Produkte tragen es automatisch.
  - Live verifiziert: Kopfzeile `id,link,age_group`, **1447 Zeilen, genau 1 ohne `adult`**
    (die Kopfzeile). Merchant-Refetch angestossen, Ergebnis **„Insgesamt aktualisierte Produkte
    1.446, Attributnamen: Alle erkannt"** = Google akzeptiert die neue Spalte.
  - Die restlichen Quellen holen um 00:00 automatisch, die Warnung sollte morgen weg sein
    (Prognose, nicht gemessen).
  - **Bewusst NICHT im Feed: `price`.** Bei einer Preisaenderung in Shopify wuerde der Feedwert
    bis zum naechsten Deploy von der Produktseite abweichen, und eine Preisabweichung ist eine
    harte Ablehnung statt einer Warnung. Die 2 „Produktpreis fehlt" fallen ohnehin von selbst
    (waren am 29.07. noch 10).

- **Altersgruppe erledigt, „Merchant API"-Frage beantwortet (2026-07-31).**
  - **`age_group` hat gewirkt:** die Karte „Fehlende Altersgruppe" ist aus der Diagnose
    verschwunden. An ihrer Stelle steht jetzt **„Fehlende Farbe" mit denselben 7 Produkten**.
    Das ist Googles Attribut-Treppe: ist ein empfohlenes Attribut da, schlaegt es das naechste
    vor. **Farbe wird NICHT pauschal gesetzt**, im Gegensatz zu `adult` gaebe es keinen Wert,
    der fuer alle stimmt, und geraten wird nicht (Regel 2). Es ist eine Warnung, sie blockiert
    kein Produkt.
  - **Content API betrifft uns nicht, jetzt am Konto belegt statt nur am Code:** in der
    Datenquellen-Uebersicht steht als Quelle der Shopify-Eintraege **„Merchant API"**, nicht
    „Content API". In jeder Zeile, die ich lesen konnte (13 gerenderte von 156, die Tabelle ist
    virtualisiert), steht 13x „Shopify App API" mit 13x Quelle „Merchant API", **0x Content API**.
    Die Shopify-App hat also bereits migriert. Dazu wie gehabt: `grep` nach `content/v2`,
    `shopping/content`, `googleapis.com/content` in `src/` und `scripts/` = 0 Treffer.
  - **Auffaellig, aber NICHT erklaert:** die Primaerquelle „Shopify App API, Feedlabel DE,
    Deutsch" (ID 10516947860) zeigt nur **24 Produkte**, „Letzte Aktualisierung: -" und die
    Warnung **„Aktualisierung erforderlich"**. Die uebrigen App-Quellen zeigen 0 oder 1 Produkt,
    Googles eigener Crawl 267, das Konto gesamt 1428. Diese Zahlen gehen nicht sauber auf, die
    Spalte „Produkte" bedeutet also offenbar etwas anderes als „von dieser Quelle geliefert".
    Keine Theorie daraus bauen, das gehoert dem Operator bzw. Shopify vorgelegt.
  - UI-Falle: `/mc/apidashboard` existiert nicht und leitet auf die Uebersicht; der Knopf
    „API-Nutzung pruefen" im Hinweis ist kein Link mit href und tat unter Automatisierung nichts.
    Die Quellen-Detailseite mit `tab=processing` haengt den Tab dauerhaft auf.

- **Website-Feld zum 5. Mal umgesprungen, am 05.08. zurueckgestellt.** Thomas meldete morgens
  „wir schmieren nach 2 guten Tagen wieder ab" plus Merchant-Screenshot mit Klicks 8.080 (-37,2%).
  Kontrolle ergab: „Ihr Onlineshop" stand wieder auf **checkout.sickmotos.com**. Produktstatus
  dabei 1082 freigegeben / 79 begrenzt / 0 abgelehnt (zwei Tage zuvor 1092/69/0), also kein
  Absturz wie im Juli, aber die Richtung stimmte. Zurueckgestellt auf `https://sickmotos.com`,
  Google hat **sofort automatisch verifiziert und beansprucht** („Automatisch von Google
  bestaetigt"), das Checkout-Template blieb diesmal intakt.
  - **Neuer Pfad in der Oberflaeche:** das Feld liegt jetzt unter Einstellungen →
    Informationen zum Unternehmen → Karte „Ihr Onlineshop" → „Onlineshop bearbeiten",
    direkt `/mc/merchantprofile/businessinfo` bzw. `/mc/settings/website`. Die alten URLs
    `/mc/businessinfo` und `/mc/settings/business` leiten auf die Uebersicht um.
  - **Ads-Conversion nachgemessen, meine frueheren Aussagen praezisiert.** Letzte 30 Tage im
    Ads-Konto (Zugang: Suchfeld in der Kontoauswahl, Kundennummer tippen, Pfeil runter, Enter,
    Koordinatenklicks prallen am Angular-Widget ab): 5.651 Seitenaufrufe, 251 Warenkorb,
    47 Bezahlvorgang, **9 Kaeufe / 1.478 EUR**. Shop im selben Fenster: **198 Bestellungen /
    32.470 EUR**. Ads sieht 11,2% der Aufrufe, schreibt sich aber nur 4,5% der Bestellungen zu,
    und Checkout-Start zu Kauf liegt bei 19% statt der ueblichen 40-70%. Warenkorb und
    Checkout-Start laufen auf unserer Domain, der Kauf auf checkout.sickmotos.com, wo am 28.07.
    `window.google_tag_manager` null war. **Verdacht auf Untererfassung im Checkout bleibt,
    beweisen liesse es sich nur mit GA4, und Leons Google-Konto hat keinen Analytics-Zugriff**
    (analytics.google.com landet auf der Provisionierungsseite). Shopify kann es nicht sagen,
    es sieht den headless-Traffic nicht.

- **Produkt-Sync-Webhook war seit Monaten tot, Ursache Secret-Mismatch (2026-08-05).**
  Thomas' Aenderungen (neue Artikel, Preise) kamen NIE automatisch auf die Seite, nur ueber
  unsere manuellen Deploys. Beweiskette: alle 3 Webhooks (Product update/deletion, Inventory
  level update) sind in Shopify korrekt eingetragen und zeigen auf
  `sickmotos-shop.vercel.app/api/shopify-webhook`; die Route lebt (401 bei ungueltiger
  Signatur); Shopifys „Send test" loeste trotzdem KEIN Deployment aus, und die letzten 15
  Vercel-Deployments waren ausnahmslos Git-Pushes, kein einziges per Deploy-Hook. In Vercel
  war `SHOPIFY_WEBHOOK_SECRET` seit 25. Mai nie aktualisiert, die Shopify-Webhook-Seite
  signiert aber mit dem dort angezeigten aktuellen Secret → Mismatch. **Fix:** Secret von der
  Shopify-Webhook-Seite (Settings → Notifications → Webhooks, Zeile „Your webhooks will be
  signed with") in die Vercel-Env uebertragen (Oberflaeche, nicht CLI; der Auto-Classifier
  blockt Secrets in Shell-Kommandos). Erklaert nebenbei die 3 „Produktpreis stimmt nicht
  ueberein" im Merchant: products.json war schlicht Wochen alt.
  - **End-to-end verifiziert am 05.08. ~14:18:** nach Env-Fix + Redeploy loeste Shopifys
    „Send test" sofort das Deployment **„Shopify product sync"** aus (deployHookName in der
    Vercel-API, Status READY). Produkt-/Preisaenderungen von Thomas gehen jetzt automatisch
    binnen ~3 Minuten live. Prognose: die 3 „Produktpreis stimmt nicht ueberein" im Merchant
    fallen nach dem naechsten 00:00-Refetch, weil products.json nicht mehr wochenlang altert.
- **Nachwelle des 5. Umspringers sichtbar (06.08. frueh):** Diagnose-Datenstand 06:16 zeigt
  ~230 Eintraege in der Warnliste, fast alle „Abweichende Onlineshop-URL" = Schaden aus dem
  Zeitraum VOR dem Ruecksetzen (gestern 13:17). Feld selbst kontrolliert und korrekt
  (sickmotos.com, Verifiziert, Beansprucht). Gleiche Mechanik wie Juli: Zahlen werden erst
  schlechter, dann dreht es binnen 24-48h. Keine neue Aktion noetig, taeglich nachschauen.
- **Merchant-Feld-Wache: Leon hat der stuendlichen Selbstheilung noch NICHT zugestimmt**
  (Zustand „puhhh ja keine Ahnung", 05.08.). Bis dahin: taeglich manuell pruefen
  (`/mc/merchantprofile/businessinfo`). Nichts ohne sein Wort bauen.

- **Ursache der Ads-Untererfassung eingegrenzt (06.08., Shopify-Konto selbst geprueft):**
  Settings → Customer privacy zeigt Shopifys eigenen Cookie-Banner **aktiv in 31 europaeischen
  Regionen** (automatische Einstellung, Opt-in-Text „unless you accept them"), zusaetzlich ist
  **Consentmo GDPR** als Privacy-App installiert (Shopify warnt selbst vor Doppel-Bannern).
  Zusammen mit dem Befund vom 28.07. (unser Storefront-Banner schreibt nur localStorage,
  `setTrackingConsent` kommt im Repo 0x vor, GTM auf checkout.sickmotos.com im echten Checkout
  null) ergibt das die Kette: **Zustimmung vom Kunden erreicht den Checkout nie, Kauf-Conversion
  der Google&YouTube-App bleibt fuer EU-Kaeufer blockiert** → 9 Ads-Kaeufe vs 198 Bestellungen,
  Checkout→Kauf 19%. Loesungsweg (noch NICHT gebaut, braucht Leons Go): Shopifys
  consent-tracking-api in unseren Banner einbinden (`storefrontRootDomain` sickmotos.com,
  Cookie gilt dann auch fuer checkout.sickmotos.com), wie Hydrogen es macht. Konsequenz fuers
  Aufgaben-Split: der Consent-Check ist UNSER Part, nicht der des Operators (kein Shopify-Zugang),
  Operator-Liste entsprechend auf 3 Punkte gekuerzt.

- **Consent-Bruecke gebaut + Ads-Konto final geprueft (06.08. abends, Leons „go mach beides").**
  (1) **Consent-Fix LIVE und end-to-end verifiziert** (commit e9febf8): `src/lib/shopifyConsent.ts`
  laedt Shopifys consent-tracking-api, `CookieConsent.tsx` meldet Accept/Reject und spiegelt beim
  Seitenaufruf auch die gespeicherte Wahl wiederkehrender Besucher (localStorage → Shopify).
  `storefrontRootDomain=sickmotos.com`, dadurch gilt der `_tracking_consent`-Cookie auch fuer
  checkout.sickmotos.com. Storefront-Token wird bewusst als Prop ins Client-HTML gereicht
  (per Design oeffentlich). **Beweis am echten Checkout:** vor Fix keine Google-Scripts, nach
  Zustimmung auf der Storefront laden im Checkout 4x googletagmanager gtag/js + 2 Web-Pixel,
  kein Consent-Banner mehr noetig. Ads sollte ab jetzt EU-Kaeufe zustimmender Kunden zaehlen
  (rueckwirkend bleibt die Luecke). Messhinweis: Extension-JS laeuft in isolierter Welt,
  window-Globals der Seite sind unsichtbar, DOM/Cookies sichtbar; auf Checkout-Seiten blockt
  die Extension Cookie-Zugriffe („BLOCKED"). Beweisfuehrung daher ueber DOM-Script-Tags.
  (2) **Ads-Aufraeumen erledigte sich nach harter Pruefung von selbst:** mit 30-Tage-Filter pro
  Aktion sind die sick-motos.com-Ziele BEREITS Sekundaer (meine „zwei primaere Ziele"-Aussage
  vom 02.08. war ein Parser-Fehler: Googles dt. UI nennt primaere Aktionen „Primaere
  Zahlungsmethode", mein Regex matchte /Primär/), das Kontakt-Zielvorhaben hat laut Googles
  eigenem Hinweis GAR KEINE primaeren Aktionen, die 3 App-Duplikate sind sekundaer mit 0.
  Primaer und aktiv: Purchase, Add To Cart (1), Begin Checkout (1). NICHTS angefasst.
  (3) **„Ein Google-Tag fehlt" in GTM ist WEG**, der v9-Fix (AW-AW → 395813654) hat es
  miterledigt; GT-MJJQZSP7 per gtag-js-Fetch verifiziert als Alias unseres AW-Kontos (2x
  AW-395813654 im Script, 0x GA4). Container-Diagnose zeigt nur noch 2 Hinweise: „einige
  Seiten nicht getaggt" (Checkout/Alt-Theme, informativ) + „zweiten Admin hinzufuegen"
  (Governance, Kandidat: Thomas). Operator-Liste damit auf „nichts anfassen" geschrumpft.

- **Doppelzaehl-Risiko des Zusatz-Pixels entschaerft (06.08. abends, im Shopify-Admin gelesen):**
  Das Custom-Pixel „thank yoy page tracking" (227115274) enthaelt ein gtag-Conversion-Snippet auf
  `AW-395813654/oTbUCL7ozN4DEJbG3rwB` (= Duplikat-Aktion „Purchase Sickmotos Styles", value 1.0,
  transaction_id leer), aber Shopify zeigt direkt am Pixel: **„not subscribed to any events"**,
  Datenspalte leer → es feuert NIE, kein Doppelzaehlen moeglich, auch nicht nach dem Consent-Fix.
  Erklaert zugleich, woher die tote Duplikat-Conversion stammt. Nichts geaendert; loeschen kann
  es Thomas/Operator bei Gelegenheit.

- **Merchant-Absturz vom 13.08. komplett diagnostiziert + Versandrichtlinie neu gebaut
  (13.08., Thomas' Screenshot: 1425 Produkte / 1194 freigegeben / 79 begrenzt / 151 abgelehnt).**
  Alle 215 Zeilen der Diagnose-Liste ausgelesen (virtualisierte Tabelle, Scroll-Sammler per
  In-Page-JS ueber 3 Seiten; Downloads-Ordner ist fuer die Shell tabu, macOS blockt auch
  Finder-AppleScript, der CSV-Export war deshalb nicht lesbar). Ergebnis, Stand 00:00 13.08.:
  - **89x „Produktpreis fehlt": zu 100% Googles EIGENE Crawl-Angebote** (numerische Offer-IDs,
    Quelle am Objekt geprueft: „Onlineshop, Automatisch aktualisiert", nicht loeschbar), Labels
    US 29, DE 25, GB 18, IE 15, IT 1, AU 1. **Kein einziges Shopify-App-Offer betroffen** →
    der Operator-Satz „price data cannot be passed over from Shopify" ist widerlegt, die App
    liefert Preise sauber. Beispiel-Offer 17239472655540827020 (Styles Graphics KIT Fluo
    Yellow, Label US): Preisfeld zeigt „$" ohne Betrag, Link zeigt auf ein kopie-von-Handle
    (Thomas' Produkt-Duplikate); die Live-Seite traegt nachweislich Preise im JSON-LD
    (curl-geprueft). Googles Crawler hat beim letzten Crawl (vor ~7 Tagen) schlicht keinen
    Preis extrahiert; eine „Ausstehende Onlineshop-Pruefung" laeuft bereits, die Angebote
    aktualisieren sich beim Re-Crawl von selbst. Per Supplemental-Feed NICHT erreichbar
    (der matcht nur shopify_-IDs).
  - **72x „Nicht uebereinstimmende Waehrung in den Versandinformationen": ebenfalls 100%
    Crawl-Angebote**, nur US (59) und GB (13). Ursache gefunden: die Google&YouTube-App hat
    die **Versandrichtlinien komplett neu gesynct** (98 per-Land-Richtlinien, Muster
    `flat_<Betrag>_<Waehrung>_<zoneId>_<rateId>_standard`, 29,99 EUR in Lokalwaehrung
    umgerechnet: US 34,59 USD, GB 12,85 GBP, AU 49,11 AUD, CA 48,67 CAD) und dabei **meine
    Juli-Richtlinie `flat_29.99_EUR_crawl_US_GB_AU_CA` geloescht** (Zeitpunkt mutmasslich
    App-Re-Sync bzw. Merchant-API-Migration). Die EUR-Preise der Crawl-Offers treffen damit
    wieder auf Fremdwaehrungs-Versand, exakt das Juli-Problem. **Fix: Richtlinie neu angelegt
    als `flat_29.99_EUR_crawl_US_GB_AU_CA_v2`** (US/GB/AU/CA, alle Produkte, 10-22 Werktage,
    Pauschalpreis 29,99 EUR), Speicher-Bestaetigung gesehen und in der Liste verifiziert.
    Prognose (wie Juli, da fielen 121 solcher Fehler nach demselben Fix): binnen Tagen weg.
    **MERKE: der App-Versand-Re-Sync loescht manuelle Richtlinien.** Nach jedem Reconnect,
    Re-Sync oder der Merchant-API-Migration die Versandrichtlinien-Liste kontrollieren.
    Achtung UI-Falle: die Liste rendert anfangs LEER (virtualisiert), erst scrollen, sonst
    zieht man falsche Schluesse (ist mir passiert, „Liste ist leer" war falsch).
  - **46x „Abweichende Onlineshop-URL": zu 100% App-Offers** = die bekannten toten Varianten
    (29.07. waren es 66, expiren weiter von selbst, nichts zu tun).
  - Rest: 2x Preisabweichung (faellt, seit der Sync-Webhook products.json frisch haelt),
    4x Warnung „Ungueltige Direktkauf-URL [checkout_link_template]" (nur Warnstufe),
    3x Bekleidungs-Attributwarnungen (Altersgruppe/Farbe/Groesse/Geschlecht, Produkte
    trotzdem freigegeben). Merchant schlaegt ausserdem eine Versandrichtlinie fuer Libanon
    vor (einziges unversorgtes Land, bewusst offen gelassen).
  - Einordnung fuer Thomas' „wir schmieren ab": die 151 Ablehnungen betreffen fast nur
    Googles Zusatz-Crawl-Angebote fuer Auslands-Labels, die deutschen App-Angebote laufen.

### Offen / TODO
- **Google „Migration zur Merchant API" (Thomas' Screenshot 29.07. 15:30, orange eingekringelt):**
  Merchant zeigt „Content API for Shopping wird am **18. August 2026** abgeschaltet". **Betrifft
  unseren Code NICHT**, selbst geprueft: `grep` nach `content/v2`, `shopping/content`,
  `googleapis.com/content` in `src/` und `scripts/` = 0 Treffer. Wir liefern an Google nur eine
  statische CSV ueber HTTP aus (`src/app/merchant-link-feed.csv/route.ts`), das ist keine API-
  Integration. Die Content API nutzt die **Shopify-App Google & YouTube** (daher heissen die
  Primaerquellen „Shopify App API"). Migration ist damit Shopifys Job, nicht unserer. Offen: dem
  Operator sagen, dass er beim Shopify-App-Stand nachhaelt, und nach dem 18.08. kontrollieren, ob
  die Primaerquellen weiter befuellt werden. Unser Supplemental-Feed laeuft unabhaengig weiter.
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
9. **Weiterleitungs-Standard (Leon, 2026-07-20): Alles, was für Thomas formuliert wird,
   muss zu 100% selbst verifiziert sein.** Thomas vertraut Leon, falsche Infos gehen auf
   Leons Kappe. Konkret: (a) „zum Weiterleiten"-Texte enthalten NUR end-to-end selbst
   geprüfte Sätze (echtes Konto, echter Klick-Durchlauf; curl allein reicht bei UI nicht).
   (b) Prognosen IM Text als Prognosen formulieren („sollte in 1-2 Tagen", nie „ist durch").
   (c) Schritt-Anleitungen für Thomas vorher am selben Objekt testen oder explizit als
   „ungetestet" markieren. (d) Nachdem Thomas/operator auf Basis der Info gehandelt hat,
   Ergebnis sofort nachprüfen und Abweichungen unaufgefordert melden. (e) Falsche frühere
   Aussagen sofort und unaufgefordert korrigieren, bevor sie weiterwandern.
