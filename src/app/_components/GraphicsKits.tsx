import Image from "next/image";
import { SectionHeader } from "./SectionHeader";

const kits = [
  {
    title: "Razor Blade Edition",
    bike: "Husqvarna 701 SM 2016-24",
    price: "€89,00",
    comparePrice: "€450,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/F8BE1D7E-3071-4A38-901E-2A49F647F1F0_1024x1024.png?v=1761119461",
  },
  {
    title: "Razor Gold Edition",
    bike: "Husqvarna 701 SM",
    price: "€89,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/IMG-5295_1024x1024.png?v=1750939150",
  },
  {
    title: "Grand Theft Moto",
    bike: "Husqvarna 701 SM",
    price: "€229,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/109_1024x1024.png?v=1750939319",
  },
  {
    title: "Broken Head InYourFace",
    bike: "KTM SMCR 690",
    price: "€229,00",
    image:
      "https://www.sick-motos.com/cdn/shop/products/image_2c7d4f6e-9c30-428f-87f5-4f4e57629756_1024x1024.jpg?v=1750939488",
  },
];

export function GraphicsKits() {
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          index="03"
          kicker="Make your bike yours"
          title="Graphics kits"
          subtitle="Limited-run designs for Husqvarna, KTM and more."
          viewAllHref="#"
          backdropImage="https://www.sick-motos.com/cdn/shop/files/109_1024x1024.png?v=1750939319"
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {kits.map((k) => (
            <article
              key={k.title}
              className="reveal group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-accent"
            >
              <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-white">
                <Image
                  src={k.image}
                  alt={k.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-2 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-dim">
                  {k.bike}
                </div>
                <h3 className="font-display text-xl uppercase tracking-tight">
                  {k.title}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-semibold text-fg">{k.price}</span>
                  {k.comparePrice && (
                    <span className="text-sm text-fg-dim line-through">
                      {k.comparePrice}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
