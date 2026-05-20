import { ProductCard, ProductCardData } from "./ProductCard";
import { SectionHeader } from "./SectionHeader";
import { BrandPillTabs } from "./BrandPillTabs";

const products: ProductCardData[] = [
  {
    title: "SICKMOTOS Tuning Krümmer Titan Beta RR 125 LC 2021-2024 Minarelli",
    price: "€38,99",
    comparePrice: "€65,00",
    image: "/products/beta-rr-minarelli.png",
    fits: ["Beta RR 125", "Minarelli"],
    stockLeft: 1,
  },
  {
    title: "SICKMOTOS Tuning Krümmer Titan Beta RR 125 LC T Model 2023-2024 Tayo/Zontes",
    price: "€219,00",
    comparePrice: "€289,00",
    image: "/products/beta-rr-t-model.png",
    fits: ["Beta RR 125 T", "Tayo", "Zontes"],
    stockLeft: 1,
  },
  {
    title: "SICKMOTOS Tuning Krümmer Titan Aprilia SX / RX 125 2018-2020",
    price: "€189,00",
    comparePrice: "€219,00",
    image: "/products/aprilia-sx-rx.png",
    fits: ["Aprilia SX 125", "RX 125"],
    stockLeft: 2,
  },
];

export function Bestsellers() {
  return (
    <section id="bestseller" className="border-b border-border py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          index="01"
          kicker="The Top 3"
          title="Top selling"
          subtitle="The titanium exhausts riders keep coming back for."
          viewAllHref="#"
          backdropImage="/products/beta-rr-minarelli.png"
        />
        <BrandPillTabs />
        <div className="grid gap-5 md:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.title} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
