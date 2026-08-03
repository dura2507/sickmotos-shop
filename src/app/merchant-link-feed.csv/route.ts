import raw from "@/data/products.json";

export const dynamic = "force-static";

const SITE = "https://sickmotos.com";

type RawVariant = { id: number };
type RawProduct = {
  id: number;
  handle: string;
  title: string;
  variants: RawVariant[];
};

// Ergänzender Google-Merchant-Feed (id + link + age_group). Überschreibt das
// link-Attribut aller Shopify-App-Offers auf die echte Storefront-Domain. Nötig,
// weil die Shopify-App Feed-Links aus ihrer Primary-Domain baut
// (checkout.sickmotos.com), die Storefront aber headless auf sickmotos.com läuft.
// Merchant Center ruft diese URL täglich ab; products.json wird bei jedem Deploy
// via prebuild aktualisiert, damit bleiben die Zeilen automatisch vollständig.
// Offer-ID-Format der Shopify-App: shopify_DE_{productId}_{variantId}.
//
// age_group: Merchant bemängelte das fehlende Attribut. Der Katalog besteht
// ausschliesslich aus Motorradteilen, kein einziger Titel enthält Kinder-,
// Jugend- oder Baby-Begriffe, deshalb ist "adult" fuer jede Zeile korrekt.
// Bewusst NICHT im Feed: price. Der wuerde bei einer Preisaenderung in Shopify
// bis zum naechsten Deploy von der Produktseite abweichen, und eine
// Preisabweichung ist eine harte Ablehnung statt einer Warnung.
//
// color/gender: Merchant bemaengelt beides nur bei der Bekleidung (T-Shirts,
// Hoodies), bei Motorradteilen fragt Google nicht danach. Beide Werte werden
// ausschliesslich aus dem Produkttitel gelesen, nie geraten. Steht die Farbe
// nicht im Titel (z.B. "Styles Hoodie Man"), bleibt die Spalte leer, und eine
// leere Spalte laesst Merchant das vorhandene Attribut unangetastet.
const AGE_GROUP = "adult";

// Nur Bekleidung. Ohne diese Schranke wuerde "ENDCAP REMUS BLACK HAWK" eine
// Farbe bekommen und jedes Teil mit "Man" im Namen ein Geschlecht.
const APPAREL = /\b(t-?shirt|hoodie|pullover|sweater)\b/i;

// Reihenfolge zaehlt: "Neon Orange" muss vor "Orange" stehen.
const COLORS = ["Neon Orange", "Neon Pink", "Black", "White"];

function colorOf(title: string): string {
  if (!APPAREL.test(title)) return "";
  return COLORS.find((c) => new RegExp(`\\b${c}\\b`, "i").test(title)) ?? "";
}

function genderOf(title: string): string {
  if (!APPAREL.test(title)) return "";
  if (/\b(women|damen)\b/i.test(title)) return "female";
  if (/\b(man|men|herren)\b/i.test(title)) return "male";
  return "";
}

export async function GET() {
  const products = raw as RawProduct[];
  const lines = ["id,link,age_group,color,gender"];
  for (const p of products) {
    const link = `${SITE}/products/${p.handle}`;
    const color = colorOf(p.title);
    const gender = genderOf(p.title);
    for (const v of p.variants) {
      lines.push(
        `shopify_DE_${p.id}_${v.id},${link},${AGE_GROUP},${color},${gender}`
      );
    }
  }
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
