import Image from "next/image";

const items = [
  {
    title: "SICKMOTOS Hoodie Man",
    price: "€79,00",
    image:
      "https://www.sick-motos.com/cdn/shop/files/IMG-7450_1024x1024.jpg?v=1750940078",
  },
  {
    title: "T-Shirt Black Edition #NOHATE #BIKERSUNITED",
    price: "€22,90",
    image:
      "https://www.sick-motos.com/cdn/shop/files/2_b1d3a4d6-7467-48ce-9ba5-4beffa239df9_1024x1024.png?v=1750939851",
  },
  {
    title: "T-Shirt Neon Orange Edition",
    price: "€19,99",
    image:
      "https://www.sick-motos.com/cdn/shop/files/406ED40B-BEE8-4579-BE82-98C0315F6778_1024x1024.jpg?v=1750939571",
  },
  {
    title: "T-Shirt Women Neon Pink Edition",
    price: "€19,99",
    image:
      "https://www.sick-motos.com/cdn/shop/files/29F8A412-B1A2-47DD-8307-0B047A496B4B_1024x1024.jpg?v=1750939566",
  },
];

export function Merchandise() {
  return (
    <section className="border-b border-border bg-surface/30 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
              Merchandise
            </h2>
            <p className="mt-2 max-w-md text-sm text-fg-muted">
              Ride it. Wear it. Repeat.
            </p>
          </div>
          <a
            href="#"
            className="text-sm font-semibold text-fg-muted underline-offset-4 hover:text-accent hover:underline"
          >
            Shop merch
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <article
              key={it.title}
              className="reveal group flex flex-col overflow-hidden rounded-lg border border-border bg-bg transition-all duration-300 hover:-translate-y-1 hover:border-accent"
            >
              <div className="relative aspect-square overflow-hidden border-b border-border bg-gradient-to-br from-surface-2 to-bg">
                <Image
                  src={it.image}
                  alt={it.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-2 p-4">
                <h3 className="text-sm font-medium leading-snug text-fg">
                  {it.title}
                </h3>
                <span className="text-base font-semibold text-fg">
                  {it.price}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
