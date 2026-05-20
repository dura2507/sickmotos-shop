import { ProductCard, ProductCardData } from "./ProductCard";
import { SectionHeader } from "./SectionHeader";

const products: ProductCardData[] = [
  {
    title: "SICKMOTOS LED Scheinwerfer Akku Pack mit Schalter Beta 50/125/250/300",
    price: "€45,00",
    comparePrice: "€55,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/FullSizeRender_96a8a12b-2945-4b5a-8749-db215102c956_1024x1024.jpg?v=1777409456",
    fits: ["Beta 50", "Beta 125", "250", "300"],
    stockLeft: 2,
  },
  {
    title: "SICKMOTOS LED RGBW V7 Rage Edition Husqvarna FE TE 2024",
    price: "€129,00",
    comparePrice: "€229,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/AAFD1335-22B2-4BA7-B533-249564ECDB50_1024x1024.jpg?v=1769075218",
    fits: ["Husqvarna FE", "TE 2024"],
  },
  {
    title: "Beta RR 50 125 LC 2017-2026 Bremsscheiben Racing",
    price: "€59,00",
    comparePrice: "€69,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/IMG-3211_1024x1024.jpg?v=1770275582",
    fits: ["Beta RR 50", "Beta RR 125"],
  },
  {
    title: "SICKMOTOS Carbon Collector Cover Husqvarna 701",
    price: "€73,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/IMG-3978_1024x1024.png?v=1750940000",
    fits: ["Husqvarna 701"],
    stockLeft: 3,
  },
];

export function LatestArrivals() {
  return (
    <section className="border-b border-border bg-surface/30 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          index="02"
          kicker="New in"
          title="Latest arrivals"
          subtitle="Fresh stock added this week."
          viewAllHref="#"
          backdropImage="https://www.sick-motos.com/cdn/shop/files/AAFD1335-22B2-4BA7-B533-249564ECDB50_1024x1024.jpg?v=1769075218"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.title} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
