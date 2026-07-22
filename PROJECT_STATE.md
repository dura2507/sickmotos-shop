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
9. **Weiterleitungs-Standard (Leon, 2026-07-20): Alles, was für Thomas formuliert wird,
   muss zu 100% selbst verifiziert sein.** Thomas vertraut Leon, falsche Infos gehen auf
   Leons Kappe. Konkret: (a) „zum Weiterleiten"-Texte enthalten NUR end-to-end selbst
   geprüfte Sätze (echtes Konto, echter Klick-Durchlauf; curl allein reicht bei UI nicht).
   (b) Prognosen IM Text als Prognosen formulieren („sollte in 1-2 Tagen", nie „ist durch").
   (c) Schritt-Anleitungen für Thomas vorher am selben Objekt testen oder explizit als
   „ungetestet" markieren. (d) Nachdem Thomas/operator auf Basis der Info gehandelt hat,
   Ergebnis sofort nachprüfen und Abweichungen unaufgefordert melden. (e) Falsche frühere
   Aussagen sofort und unaufgefordert korrigieren, bevor sie weiterwandern.
