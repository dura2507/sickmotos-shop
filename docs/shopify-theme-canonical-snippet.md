# Shopify-Theme auf checkout.sickmotos.com: Canonical auf sickmotos.com + noindex

Stand: 27.09.2026. Kein Code-Change im Next-Projekt, reine Anleitung fuer das Shopify-Theme.
Pruefwerkzeug: `scripts/check-shopify-canonical.mjs` (siehe Abschnitt 5).

## 0. Warum

`checkout.sickmotos.com` ist die Shopify-Primary-Domain und liefert das alte Theme
„Geen Experiment" (Ella 6.7.0, Theme-ID 178472648970) weiter oeffentlich aus. Gemessen am
27.09.2026 per curl mit Browser-User-Agent:

| Pfad auf checkout.sickmotos.com | HTTP | Canonical im HTML | hreflang-Links | robots-Meta |
|---|---|---|---|---|
| `/` | 200 | `https://checkout.sickmotos.com/` | 28 | keins |
| `/de` | 200 | `https://checkout.sickmotos.com/de` | 28 | keins |
| `/products/h4-adapter-montagehilfe` | 200 | `https://checkout.sickmotos.com/products/h4-adapter-montagehilfe` | 28 | keins |
| `/de/products/h4-adapter-montagehilfe` | 200 | `https://checkout.sickmotos.com/de/products/...` (Locale bleibt drin) | 28 | keins |
| `/collections/all`, `/blogs/news`, `/pages/impressum`, `/policies/refund-policy`, `/search` | 200 | jeweils Self-Canonical auf checkout.sickmotos.com | 28 | keins |
| `/cart` | 200 | Self-Canonical | 28 | keins |
| `/pages/kontakt`, `/irgendwas` | 404 | `https://checkout.sickmotos.com/404` | 0 | keins |
| `/account`, `/account/login` | 302 auf account.sick-motos.com | (Shopify-Kontodomain, nicht Theme) | 0 | noindex (von Shopify) |

Jede Seite sagt Google also „ich bin das Original", die Kopie auf sickmotos.com sagt dasselbe,
und nur die Shopify-Seite hat 28 hreflang-Alternativen. Das JS-Redirect-Snippet im `<head>` hilft
Nutzern, ist fuer Google aber kein Canonical-Signal (Googles Liste der Signale: Weiterleitungen,
rel=canonical, Sitemap; Quelle in Abschnitt 7).

Wichtiger Messbefund fuer die Umsetzung: **die 28 hreflang-Links stehen NICHT im Theme-Code.** Sie
liegen im HTML zwischen den Performance-Marken `shopify.content_for_header.start` (Zeile 48) und
`shopify.content_for_header.end` (Zeile 200), also innerhalb von `{{ content_for_header }}`.
Shopify bestaetigt das offiziell: „Shopify automatically includes hreflang tags through the
content_for_header object" (Quelle 7c). Ausserhalb dieses Blocks gibt es nur 2 `<a hreflang>`
Anker im Sprachumschalter, das sind keine SEO-Tags. Das einzige Theme-eigene Tag, das ersetzt werden
muss, ist die eine Zeile `<link rel="canonical" href="{{ canonical_url }}">` (im Live-HTML Zeile 31,
direkt vor `<title>`, Shopify haengt beim Rendern noch das Attribut `canonical-shop-url` an).

## 1. Der Block fuer `layout/theme.liquid`

Vorlage ist Shopifys offizielles `hydrogen-redirect-theme` (Quelle 7a, Datei `layout/theme.liquid`,
Commit 1aa35ac vom 05.12.2025). Es macht genau zwei Dinge im `<head>`: `<meta name="robots"
content="noindex">` auf jeder Seite und
`<link rel="canonical" href="https://{{ settings.storefront_hostname }}{{ request.path }}">`
(Fallback `{{ canonical_url }}`, wenn kein Template greift). Unser Block uebernimmt das Muster und
ergaenzt zwei Dinge, die Hydrogen nicht braucht, wir aber schon: das Locale-Praefix (`/de`,
`/en-at`, ...) wird entfernt, und die Shopify-Pfade werden auf die Headless-Routen abgebildet
(`/collections/*` gibt es auf sickmotos.com nicht, dort ist es `/shop` usw.).

### 1a. Was Thomas im Code-Editor tut

1. Im Code-Editor links die **Suche ueber alle Dateien** (Lupe in der Seitenleiste) oeffnen und nach
   `canonical_url` suchen. Ersetzt wird NUR die Zeile, die mit `<link rel="canonical"` beginnt
   (normalerweise in `layout/theme.liquid`). Ein weiterer Treffer in einer `og:url`- oder
   Social-Meta-Zeile (z.B. `<meta property="og:url" content="{{ canonical_url }}">`) ist normal
   und bleibt unveraendert. Liegt die `<link rel="canonical"`-Zeile in einem Snippet statt in
   theme.liquid (Ella-typische Kandidaten: `snippets/head*.liquid`, `snippets/meta-tags.liquid`,
   `sections/header*.liquid`), wird sie DORT ersetzt. Gibt es ZWEI `<link rel="canonical"`-Zeilen,
   beide melden, nicht raten (das Pruefskript zeigt danach, ob genau EIN Canonical im HTML steht).
2. Diese eine Zeile komplett durch den Block aus 1b ersetzen. Sonst nichts anfassen:
   **das JS-Redirect-Snippet direkt nach `<head>` bleibt unveraendert**, `{{ content_for_header }}`
   bleibt unveraendert, GTM bleibt unveraendert.
3. Nach `hreflang` suchen. Erwartet: kein Treffer in einem `<link>`-Tag (die hreflang-Links kommen
   aus `content_for_header`, siehe oben). Sollte es doch eine Theme-eigene Schleife geben (z.B.
   `{% for locale in shop.published_locales %}` mit `<link rel="alternate" hreflang=`), diese
   Zeilen loeschen. Die 2 Treffer in `<a ...hreflang=...>` (Sprachumschalter) in Ruhe lassen.
4. Speichern.

### 1b. Der Block (1:1 einfuegen)

```liquid
{%- comment -%}
  SickMotos 27.09.2026: Canonical auf die Storefront sickmotos.com plus noindex.
  Ersetzt die Zeile <link rel="canonical" href="{{ canonical_url }}">.
  Vorlage: Shopify hydrogen-redirect-theme, layout/theme.liquid.
  Warenkorb und Kundenkonto-Seiten behalten ihr Shopify-Canonical und bekommen kein noindex.
{%- endcomment -%}
{%- liquid
  assign sm_host = 'https://sickmotos.com'
  assign sm_last = request.path | split: '/' | last
  assign sm_target = ''

  case request.page_type
    when 'index'
      assign sm_target = '/'
    when 'product'
      assign sm_target = '/products/' | append: product.handle
    when 'collection' or 'list-collections' or 'search'
      assign sm_target = '/shop'
    when 'blog'
      assign sm_target = '/blog'
    when 'article'
      assign sm_slug = article.handle | split: '/' | last
      assign sm_target = '/blog/' | append: sm_slug
    when 'page'
      case page.handle
        when 'impressum' or 'contact' or 'kontakt'
          assign sm_target = '/legal/impressum'
        when 'datenschutz' or 'datenschutzerklarung' or 'datenschutzerklaerung'
          assign sm_target = '/legal/datenschutz'
        when 'agb'
          assign sm_target = '/legal/agb'
        when 'widerruf' or 'widerrufsbelehrung'
          assign sm_target = '/legal/widerruf'
        when 'versand'
          assign sm_target = '/legal/versand'
        else
          assign sm_target = '/'
      endcase
    when 'policy'
      case sm_last
        when 'refund-policy'
          assign sm_target = '/legal/widerruf'
        when 'shipping-policy'
          assign sm_target = '/legal/versand'
        when 'privacy-policy'
          assign sm_target = '/legal/datenschutz'
        when 'terms-of-service'
          assign sm_target = '/legal/agb'
        when 'legal-notice' or 'contact-information'
          assign sm_target = '/legal/impressum'
        else
          assign sm_target = '/'
      endcase
  endcase

  assign sm_keep = false
  if request.page_type == 'cart'
    assign sm_keep = true
  elsif request.page_type contains 'customers/'
    assign sm_keep = true
  endif
-%}
{%- if sm_keep -%}
<link rel="canonical" href="{{ canonical_url }}">
{%- elsif sm_target != blank -%}
<link rel="canonical" href="{{ sm_host }}{{ sm_target }}">
<meta name="robots" content="noindex, follow">
{%- else -%}
<link rel="canonical" href="{{ canonical_url }}">
<meta name="robots" content="noindex, follow">
{%- endif -%}
```

### 1c. Was der Block tut, Zeile fuer Zeile

- Locale-Praefixe (`/de/...`, `/en-at/...`) spielen im Block keine Rolle: kein einziges Canonical
  haengt am Pfad. Produkte, Artikel und Seiten nehmen `product.handle`, `article.handle` und
  `page.handle`, Kollektionen, Suche und Blog sind feste Ziele, nur Policies nutzen das letzte
  Pfadsegment (`request.path | split: '/' | last`), und das ist mit und ohne Praefix dasselbe.
  Deshalb kann ein Handle wie `/products/dekor-...` nie beschaedigt werden.
- `request.page_type` liefert laut Shopify-Doku (Quelle 7b) unter anderem `index`, `product`,
  `collection`, `list-collections`, `blog`, `article`, `page`, `policy`, `search`, `cart`, `404`,
  `customers/login` usw. Das Mapping entspricht 1:1 den Weiterleitungen in `next.config.ts` der
  Headless-Seite (dort sind `/collections/*`, `/search` auf `/shop`, `/blogs/:blog/:slug` auf
  `/blog/:slug`, `/policies/*` und `/pages/*` auf die Legal-Seiten bzw. `/` gemappt).
- Produkt: `product.handle` statt Pfad, damit auch `/collections/x/products/handle` und
  `?variant=` sauber auf `https://sickmotos.com/products/handle` zeigen.
- Artikel: `article.handle` ist bei Shopify `blog-handle/artikel-handle` (Quelle 7b, Objekt
  article), deshalb `split: '/' | last`.
- Policies: der Handle steht nur im Pfad (`/policies/refund-policy`), deshalb `sm_last`.
- Alles, was kein Mapping hat (404, Passwortseite, Gift Card, App-Proxys, Metaobjekte), behaelt
  Shopifys `{{ canonical_url }}` und bekommt noindex. Genau wie im hydrogen-redirect-theme
  (`template != blank` Fallback).
- **Warenkorb (`cart`) und Kundenkonto-Seiten (`customers/*`)**: Shopify-Canonical, kein noindex.
  Das ist der konservative Weg, damit der Kaufpfad garantiert unangetastet bleibt. Shopifys eigene
  robots.txt des Hosts (116 Zeilen, live gelesen) sperrt per Disallow `/cart/` (also die
  Cart-Permalinks `/cart/<id>:1`), `/checkout`, `/checkouts/`, `/account`, `/orders` und
  `/*?*preview_theme_id=*`; die nackte Warenkorbseite `/cart` ist NICHT gesperrt, sie behaelt mit
  diesem Block ihr Shopify-Self-Canonical wie heute. Das hydrogen-redirect-theme setzt noindex
  uebrigens auf wirklich jeder Seite, auch dem Warenkorb; wer das will, loescht die
  `sm_keep`-Bedingung fuer `cart`.
- Checkout-Seiten (`/checkouts/...`) rendern ohne Shopify Plus gar nicht ueber `theme.liquid`,
  der Block kann sie nicht beruehren.
- `noindex, follow` statt nur `noindex`: Google darf den Links auf der Seite weiter folgen.
  Wer die reine Canonical-Variante ohne noindex will (Google raet innerhalb EINER Site von noindex
  als Canonical-Steuerung ab, Quelle 7e, wir sind hier aber ueber zwei Hosts und folgen Shopifys
  eigener Redirect-Theme-Vorlage), loescht einfach die beiden `<meta name="robots" ...>` Zeilen.

### 1d. Was bewusst NICHT gemacht wird

- **hreflang aus `content_for_header` herausfiltern.** Shopify sagt zu `content_for_header`
  woertlich: „You shouldn't try to modify or parse the content_for_header object because the
  contents are subject to change" (Quelle 7c). Mit noindex ist die hreflang-Liste ohnehin
  wirkungslos: die Annotation sagt nur, welche Sprachfassung einer indexierbaren Seite existiert;
  faellt die Seite aus dem Index, haengt daran nichts mehr.
- **Sprachen oder Maerkte in Shopify reduzieren**, um weniger hreflang zu erzeugen. Das wuerde
  Sprache und Waehrung im echten Checkout fuer Kunden aendern. Nicht anfassen.
- **robots.txt auf `Disallow: /` setzen.** Das hydrogen-redirect-theme tut das
  (`templates/robots.txt.liquid`: `User-agent: * / Disallow: /`, Quelle 7a). Fuer uns ist das im
  ersten Schritt falsch: Google kann dann Canonical und noindex gar nicht mehr lesen, und die bereits
  indexierten 13.771 URLs bleiben als „indexiert, obwohl blockiert" stehen. Erst wenn die Search
  Console (Domain-Property sc-domain:sickmotos.com) zeigt, dass die checkout.sickmotos.com-URLs aus
  dem Index sind, kann man das als zweiten Schritt ueberlegen. Cart-Permalinks (`/cart/`), Checkout
  und Konto sperrt Shopifys Standard-robots.txt schon heute (siehe 1c).
- Passwortschutz fuer den Onlineshop: Cart-Permalinks und Checkout koennen ihn nicht umgehen,
  war schon im Audit vom 11.09. ausgeschlossen.

## 2. Test auf einem DUPLIKAT, nie direkt am Live-Theme

Shopify-Standardweg laut Hilfe (Quelle 7f). In dieser Session nicht selbst geklickt, deshalb die
Knopfnamen so, wie Shopify sie in der englischen Hilfe nennt; die deutsche Oberflaeche uebersetzt
sie (Duplicate = Duplizieren, Edit code = Code bearbeiten, Preview = Vorschau, Publish =
Veroeffentlichen).

1. Shopify-Admin, **Online Store** (Onlineshop) > **Themes**. Beim Live-Theme „Geen Experiment"
   auf das Menue mit den drei Punkten, dann **Duplicate**. Die Kopie erscheint unter den
   Entwurfs-Themes als „Copy of Geen Experiment".
2. Bei der **Kopie** (nicht beim Live-Theme!): drei Punkte > **Edit code** > links `layout` >
   `theme.liquid`. Schritt 1a ausfuehren, speichern. Die Theme-ID der Kopie steht in der
   Browser-URL (`/admin/themes/<ID>/...`), die bitte an Leon schicken.
3. Bei der Kopie: drei Punkte > **Preview**. In der Vorschauleiste den Link-Knopf klicken, das
   kopiert den Teilen-Link. Laut Shopify (Quelle 7f) laeuft ein Besucher-Vorschaulink nach 2 Tagen
   ab, ohne Login nutzbar; ein Haendler-Vorschaulink 30 Tage, nur mit Admin-Zugang. Den Link an
   Leon schicken.
4. Selbst im Browser kurz pruefen: Vorschau der Startseite springt weiter nach sickmotos.com (das
   JS-Snippet lebt noch), Warenkorb und Checkout funktionieren wie vorher.

### Wie Leon/ich mit curl bzw. dem Skript verifiziere (vor dem Veroeffentlichen)

Grundlage ist der **Teilen-Link aus der Vorschauleiste** (Schritt 3 oben). Laut Shopify-Hilfe
(„Adding, previewing, and buying themes", gelesen 27.09.2026) gibt es zwei Vorschau-Arten:
Besucher-Vorschaulinks haben die Form `https://<token>-<shop_id>.shopifypreview.com`, gelten 2 Tage
und brauchen KEINEN Login; Haendler-Vorschaulinks laufen ueber die Primaerdomain mit Token-Parameter
und verlangen eine Admin-Anmeldung („Merchant previews require admin authentication"). Fuer curl
und das Skript ist deshalb der Besucher-Link der Regelfall. Der Parameter `?preview_theme_id=<ID>`
auf checkout.sickmotos.com (302 plus Cookie `_shopify_essential`, mit der Live-ID 178472648970
gemessen) ist nur ein Fallback fuer den eingeloggten Browser, nicht fuer das Skript.

Den Besucher-Link von Thomas nehmen, den Host daraus als `<PREVIEW>` einsetzen (alles vor dem
ersten `/` nach `https://`), Pfade anhaengen:

```
node scripts/check-shopify-canonical.mjs \
  "<PREVIEW>/" \
  "<PREVIEW>/de" \
  "<PREVIEW>/products/h4-adapter-montagehilfe" \
  "<PREVIEW>/de/products/h4-adapter-montagehilfe" \
  "<PREVIEW>/en-at/products/h4-adapter-montagehilfe" \
  "<PREVIEW>/collections/all" \
  "<PREVIEW>/blogs/news" \
  "<PREVIEW>/pages/impressum" \
  "<PREVIEW>/policies/refund-policy" \
  "<PREVIEW>/search" \
  "<PREVIEW>/cart" \
  "<PREVIEW>/pages/gibt-es-nicht"
```

Erwartete Ausgabe je URL (alles andere = nicht veroeffentlichen, Fehler an mich):

| URL | Shopify-Theme | Canonical | Robots-Meta | hreflang | JS-Redirect |
|---|---|---|---|---|---|
| `/` und `/de` | Name der Kopie, role unpublished | `https://sickmotos.com/` | `noindex, follow` | 28 (bleibt, siehe 1d) | ja |
| `/products/h4-...`, `/de/products/h4-...`, `/en-at/products/h4-...` | Kopie | `https://sickmotos.com/products/h4-adapter-montagehilfe` (ohne `/de`, ohne `/en-at`) | `noindex, follow` | 28 | ja |
| `/collections/all`, `/search` | Kopie | `https://sickmotos.com/shop` | `noindex, follow` | 28 | ja |
| `/blogs/news` | Kopie | `https://sickmotos.com/blog` | `noindex, follow` | 28 | ja |
| `/pages/impressum` | Kopie | `https://sickmotos.com/legal/impressum` | `noindex, follow` | 28 | ja |
| `/policies/refund-policy` | Kopie | `https://sickmotos.com/legal/widerruf` | `noindex, follow` | 28 | ja |
| `/cart` | Kopie | Shopify-eigenes Canonical auf `/cart` (Host je nach Vorschau-Art: Vorschau-Host oder checkout.sickmotos.com; entscheidend: NICHT sickmotos.com) | (keins) | 28 | ja |
| 404-Seite | Kopie | Shopify-eigenes Canonical auf `/404` (Host wie bei `/cart`) | `noindex, follow` | 0 | ja |

Dazu in jeder Ausgabe: genau EIN Canonical (keine Meldung „ACHTUNG: mehrere Canonicals"), Status
200 (404-Seite: 404). Wenn „Shopify-Theme" weiter „Geen Experiment ... role main" zeigt, ist die
Vorschau nicht angekommen (falsche ID oder Link abgelaufen), dann den Teilen-Link von Thomas 1:1
als URL einsetzen.

Zusaetzlich mit dem Vorschaulink im Browser: Startseite springt nach sickmotos.com, ein
Cart-Permalink `https://checkout.sickmotos.com/cart/<variantId>:1` landet weiter im Checkout.

### Veroeffentlichen

Erst wenn alle Zeilen der Tabelle stimmen: Themes > Kopie > drei Punkte > **Publish** (oder
**Edit theme** > oben **Publish** > im Fenster **Publish**). Danach dieselbe Skriptliste mit
`https://checkout.sickmotos.com` statt `<PREVIEW>` laufen lassen (Live-URLs), gleiche Erwartung,
„Shopify-Theme ... role main".
Dann ein echter Testlauf: Produkt auf sickmotos.com in den Warenkorb, zur Kasse, Checkout muss auf
checkout.sickmotos.com rendern (alle Zahlarten sichtbar), Kauf abbrechen.

## 3. Rollback

- **Vor dem Veroeffentlichen:** nichts zu tun, die Kopie einfach loeschen oder liegen lassen. Das
  Live-Theme wurde nie angefasst.
- **Nach dem Veroeffentlichen:** das vorherige Theme liegt laut Shopify weiter unter den
  Entwurfs-Themes („your previous theme displays in the Draft themes section", Quelle 7f).
  Dort drei Punkte > **Publish**, fertig, Sekunden. Danach Skript auf die Live-URLs: Canonical
  zeigt wieder auf checkout.sickmotos.com, kein robots-Meta.
- **Falls doch direkt im Live-Theme editiert wurde:** Code-Editor > `theme.liquid` > Timeline
  (aeltere Versionen) > Eintrag vor der Aenderung rechtsklicken > **Restore contents** > Restore
  (Quelle 7g). Achtung, das ersetzt die ganze Datei, deshalb nur, wenn dazwischen nichts anderes
  geaendert wurde.
- Der Checkout haengt an keiner dieser Aenderungen (rendert nicht ueber theme.liquid), ein
  Rollback ist also nie zeitkritisch fuer Bestellungen. Zeitkritisch waere nur, wenn das JS-Snippet
  versehentlich mit geloescht wurde (Symptom: checkout.sickmotos.com/ zeigt das alte Theme statt
  zu springen); auch dann hilft Publish des alten Themes.

## 4. Ausdruecklich UNGETESTET (Stand 27.09.2026)

Alles hier wurde ohne Zugriff auf den Theme-Code und ohne Test-Theme geschrieben. Das Pruefskript
ist der Test, nicht dieses Dokument.

1. **Der Liquid-Block selbst ist auf keinem Shopify-Store gerendert worden.** Syntax nach
   Shopify-Doku (`{% liquid %}`, `case/when ... or ...`, `slice`, `remove_first`, `contains`),
   aber nicht ausgefuehrt. Ein Tippfehler wuerde in der Vorschau als Liquid-Fehlermeldung im
   `<head>` sichtbar (dann zeigt das Skript kein oder ein kaputtes Canonical).
2. **Lokalisierte URLs** (`/de/...`, `/en-at/...`): der Block benutzt den Pfad nur fuer das
   letzte Segment bei Policies, ein Praefix kann das Ergebnis also nicht veraendern. Die Zeilen
   `/de/products/...` und `/en-at/products/...` in der Tabelle pruefen trotzdem, dass jede
   Sprachvariante dasselbe Canonical ohne Praefix liefert.
3. **Ob Shopify das Attribut `canonical-shop-url` auch an unser Canonical haengt oder den href
   umschreibt.** Live traegt das heutige Canonical das Attribut, obwohl das Theme vermutlich nur
   `{{ canonical_url }}` ausgibt. Das Skript zeigt den echten href.
4. **Wo genau die Canonical-Zeile im Ella-Theme steht** (theme.liquid direkt oder ein Snippet).
   Aus dem Live-HTML (Zeile 31, vor `<title>`, vor `content_for_header`) ist theme.liquid am
   wahrscheinlichsten. Die Suche im Code-Editor klaert es in 10 Sekunden.
5. **Der Besucher-Vorschaulink selbst** (`https://<token>-<shop_id>.shopifypreview.com`) wurde
   noch mit keinem Link dieses Shops ausprobiert; Form und 2-Tage-Frist stammen aus der
   Shopify-Hilfe. `?preview_theme_id=` auf checkout.sickmotos.com funktioniert fuer die Kopie
   nur im eingeloggten Browser (Haendler-Vorschau), nicht fuer curl.
6. **Die Knopfnamen der Shopify-Oberflaeche** stammen aus der englischen Hilfe, nicht aus einem
   eigenen Klick-Durchlauf in Thomas' Admin.
7. **Wie schnell Google reagiert.** Prognose, keine Messung: noindex wird beim naechsten Crawl
   der jeweiligen URL wirksam, bei 13.771 URLs ueber Wochen. Kontrolle in der Search Console
   (sc-domain:sickmotos.com, Bericht Seitenindexierung, Grund „Durch noindex-Tag ausgeschlossen"
   sollte steigen, „Google hat eine andere Seite als kanonisch bestimmt" fallen).
8. Produkte, die in Shopify existieren, aber NICHT im Headless-Kanal veroeffentlicht sind,
   bekaemen ein Canonical auf eine 404-Seite von sickmotos.com. Google ignoriert ein Canonical auf
   eine 404 (die Seite bleibt dann noindex). Kein Schaden, aber nicht schoen; laut Sync-Skript sind
   alle 486 Katalogprodukte im Kanal, geprueft ist es nicht pro Produkt.

## 5. Das Pruefskript

`node scripts/check-shopify-canonical.mjs <url> [<url> ...]`

Gibt je URL aus: Weiterleitungskette, Status, finale URL, Title, Canonical (warnt bei mehreren),
robots-Meta, Anzahl der `<link rel="alternate" hreflang>` (plus deren Hosts), ob das
JS-Redirect-Snippet auf sickmotos.com im HTML steckt, und das antwortende Shopify-Theme (Name, ID,
role, Ella-Version). Exit-Code 1, wenn eine URL >= 400 liefert oder nicht erreichbar war. Zaehlt nur
echte `<link>`-hreflang-Tags (Anker im Sprachumschalter werden nicht mitgezaehlt). Browser-UA,
weil Shopify-Kontodomains auf Standard-curl mit 406 antworten (Lehre vom 22.09.).

Lauf vom 27.09.2026 (Live, vor jeder Aenderung):

```
checkout.sickmotos.com/products/h4-adapter-montagehilfe      Canonical checkout.sickmotos.com/products/h4-adapter-montagehilfe, Robots (keins), hreflang 28, JS-Redirect ja, Theme Geen Experiment 178472648970 role main
checkout.sickmotos.com/de/products/h4-adapter-montagehilfe   Canonical checkout.sickmotos.com/de/products/h4-adapter-montagehilfe, Robots (keins), hreflang 28
sickmotos.com/products/h4-adapter-montagehilfe               Canonical sickmotos.com/products/h4-adapter-montagehilfe, Robots (keins), hreflang 0, kein Shopify-Theme
checkout.sickmotos.com/...?preview_theme_id=178472648970     1 Weiterleitung (302), danach dieselbe Seite, Theme role main
```

## 6. Danach (nicht Teil dieser Aufgabe)

- PROJECT_STATE.md nachziehen, sobald veroeffentlicht (Datum, Theme-ID der Kopie, Skript-Lauf).
- Search Console nach 2 bis 4 Wochen: Duplikat-Meldungen fuer checkout.sickmotos.com muessen
  fallen. Erst danach ueber `Disallow: /` in Shopifys robots.txt nachdenken (siehe 1d).
- Die 21 „Google hat eine andere Seite als kanonisch bestimmt" fuer identische Styles-Kits auf
  sickmotos.com selbst loest dieser Block NICHT, das bleibt Thomas' Editionsnamen-Thema (22.09.).

## 7. Quellen (alle am 27.09.2026 selbst abgerufen)

- 7a. Shopify, hydrogen-redirect-theme, github.com/Shopify/hydrogen-redirect-theme, Dateien
  `README.md`, `layout/theme.liquid`, `config/settings_schema.json`, `templates/robots.txt.liquid`
  (roh ueber raw.githubusercontent.com, letzter Commit 1aa35ac, 05.12.2025). Inhalt theme.liquid:
  `<meta name="robots" content="noindex">` unbedingt, Canonical
  `https://{{ settings.storefront_hostname }}{{ request.path }}` wenn `template != blank`, sonst
  `{{ canonical_url }}`; JS-Redirect per `window.location.replace`, ausgenommen `/checkpoint`,
  `/throttle/queue`, `/challenge` und `Shopify.designMode`; Discount-Cookie wird als `?discount=`
  mitgenommen. Dateiliste des Repos: layout/theme.liquid, sections/main-redirect.liquid,
  snippets/icon-success.liquid, templates (404, article, blog, cart, checkpoint, collection,
  customers, gift_card, index, list_collections, page, password, product, robots.txt, search).
- 7b. shopify.dev Liquid-Referenz: Objekte `request` (path, page_type mit Werteliste, locale),
  `shop_locale` (root_url „The relative root URL of the locale", primary), `article` (handle mit
  Beispiel `potion-notions/how-to-tell-...`), `canonical_url`, `routes`.
- 7c. shopify.dev, „Support multiple currencies and languages" (Themes > Markets): „Shopify
  automatically includes hreflang tags through the content_for_header object"; shopify.dev
  `content_for_header`: „required in theme.liquid", „You shouldn't try to modify or parse the
  content_for_header object". help.shopify.com Markets > Languages > SEO: „Hreflang tags:
  Automatically added for language-specific URLs."
- 7d. `request.path` und Locale-Praefix: shopify.dev (Objekt `request`) gibt nur `/` und
  `/products/health-potion` als Beispiele, kein lokalisiertes. Eine Web-Suche nannte
  `request.path | slice: 1, 2` als Community-Muster zum Auslesen der Sprache aus dem Pfad; in den
  zwei direkt gelesenen Threads (community.shopify.com 267744 „Get request.path in Liquid for
  other available locales" und 51726 „What is the new method to get the language code since
  shop.locale is deprecated") stand dieses Muster NICHT, dort wird `request.locale.iso_code`
  empfohlen. Also kein belastbarer Beleg, deshalb Punkt 2 in Abschnitt 4 und der doppelt
  abgesicherte Block.
- 7e. developers.google.com, „Consolidate duplicate URLs": Reihenfolge der Signale Weiterleitung >
  rel=canonical > Sitemap, „these methods can stack"; „We don't recommend using noindex to prevent
  selection of a canonical page within a single site"; JS-Redirects werden dort nicht als Signal
  genannt.
- 7f. help.shopify.com, Themes verwalten: Duplizieren (drei Punkte > Duplicate, Kopie heisst
  „Copy of ..."), Veroeffentlichen (Draft themes > Edit theme > Publish > Publish; vorheriges
  Theme bleibt unter Draft themes), Vorschau teilen (drei Punkte > Preview > Link-Knopf; Besucher-
  Link 2 Tage, Haendler-Link 30 Tage).
- 7g. help.shopify.com, Theme-Code bearbeiten: Suche ueber alle Dateien per Lupe in der
  Seitenleiste; Timeline > Rechtsklick > Restore contents > Restore („Restoring replaces the whole
  file contents").
- Eigene Messungen: curl mit Browser-UA auf checkout.sickmotos.com (Tabelle in Abschnitt 0,
  Positionen der Performance-Marken, `Shopify.theme`-Objekt), `?preview_theme_id=` Verhalten
  (302 + `_shopify_essential`), Shopify-robots.txt des Hosts.
