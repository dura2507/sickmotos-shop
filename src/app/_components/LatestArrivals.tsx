import { ProductCard, ProductCardData } from "./ProductCard";
import { SectionHeader } from "./SectionHeader";

const products: ProductCardData[] = [
  {
    title: "SICKMOTOS LED Scheinwerfer Akku Pack mit Schalter Beta 50/125/250/300",
    price: "€45,00",
    comparePrice: "€55,00",
    image: "/products/led-akku-pack.png",
    fits: ["Beta 50", "Beta 125", "250", "300"],
    stockLeft: 2,
  },
  {
    title: "SICKMOTOS LED RGBW V7 Rage Edition Husqvarna FE TE 2024",
    price: "€129,00",
    comparePrice: "€229,00",
    image: "/products/led-v7-rage.png",
    fits: ["Husqvarna FE", "TE 2024"],
  },
  {
    title: "Beta RR 50 125 LC 2017-2026 Bremsscheiben Racing",
    price: "€59,00",
    comparePrice: "€69,00",
    image: "/products/beta-bremsscheiben.png",
    fits: ["Beta RR 50", "Beta RR 125"],
  },
  {
    title: "SICKMOTOS Carbon Collector Cover Husqvarna 701",
    price: "€73,00",
    image: "/products/carbon-collector-cover.png",
    fits: ["Husqvarna 701"],
    stockLeft: 3,
  },
];

export function LatestArrivals() {
  return (
    <section className="border-b border-border bg-surface/30 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          index="02"
          kicker="New in"
          title="Latest arrivals"
          subtitle="Fresh stock added this week."
          viewAllHref="#"
          backdropImage="/products/led-v7-rage.png"
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
