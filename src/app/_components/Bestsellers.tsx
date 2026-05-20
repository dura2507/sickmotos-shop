import { ProductCard, ProductCardData } from "./ProductCard";
import { SectionHeader } from "./SectionHeader";
import { BrandPillTabs } from "./BrandPillTabs";

const products: ProductCardData[] = [
  {
    title: "SICKMOTOS Tuning Krümmer Titan Beta RR 125 LC 2021-2024 Minarelli",
    price: "€38,99",
    comparePrice: "€65,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/C197DA2A-FC9F-4044-8829-376CAC387E84_1024x1024.jpg?v=1750939041",
    fits: ["Beta RR 125", "Minarelli"],
    stockLeft: 1,
  },
  {
    title: "SICKMOTOS Tuning Krümmer Titan Beta RR 125 LC T Model 2023-2024 Tayo/Zontes",
    price: "€219,00",
    comparePrice: "€289,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/6C631DE0-9D31-4384-A7EC-7C12447B25AB_1024x1024.jpg?v=1754641476",
    fits: ["Beta RR 125 T", "Tayo", "Zontes"],
    stockLeft: 1,
  },
  {
    title: "SICKMOTOS Tuning Krümmer Titan Aprilia SX / RX 125 2018-2020",
    price: "€189,00",
    comparePrice: "€219,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/011C20FD-FF6E-4D1B-9890-A3294DE4FD54_1024x1024.jpg?v=1750939018",
    fits: ["Aprilia SX 125", "RX 125"],
    stockLeft: 2,
  },
];

export function Bestsellers() {
  return (
    <section id="bestseller" className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          index="01"
          kicker="The Top 3"
          title="Top selling"
          subtitle="The titanium exhausts riders keep coming back for."
          viewAllHref="#"
          backdropImage="https://www.sick-motos.com/cdn/shop/files/C197DA2A-FC9F-4044-8829-376CAC387E84_1024x1024.jpg?v=1750939041"
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
