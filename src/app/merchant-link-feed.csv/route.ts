import raw from "@/data/products.json";

export const dynamic = "force-static";

const SITE = "https://sickmotos.com";

type RawVariant = { id: number };
type RawProduct = { id: number; handle: string; variants: RawVariant[] };

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
const AGE_GROUP = "adult";

export async function GET() {
  const products = raw as RawProduct[];
  const lines = ["id,link,age_group"];
  for (const p of products) {
    const link = `${SITE}/products/${p.handle}`;
    for (const v of p.variants) {
      lines.push(`shopify_DE_${p.id}_${v.id},${link},${AGE_GROUP}`);
    }
  }
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
