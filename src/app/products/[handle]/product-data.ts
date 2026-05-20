// Hardcoded demo product. Will be replaced by Shopify Storefront API fetch
// once Thomas hands over the access token.

export type Variant = {
  id: string;
  label: string;
  sub?: string;
  priceModifier?: number;
  available: boolean;
};

export type AddOn = {
  id: string;
  title: string;
  sub: string;
  price: number;
  image: string;
};

export type RelatedProduct = {
  handle: string;
  title: string;
  price: string;
  comparePrice?: string;
  image: string;
};

export type Product = {
  handle: string;
  title: string;
  category: string;
  categoryHref: string;
  brand: string;
  basePrice: number;
  comparePrice?: number;
  rating: number;
  reviewCount: number;
  stockLeft: number;
  images: { src: string; alt: string }[];
  fitOn: string[];
  highlights: string[];
  variantGroups: {
    title: string;
    key: string;
    variants: Variant[];
  }[];
  addOns: AddOn[];
  bundle: {
    title: string;
    subtitle: string;
    items: { title: string; image: string; price: number }[];
    bundlePrice: number;
    savings: number;
  };
  description: string;
  specs: { label: string; value: string }[];
  installation: string[];
  reviews: {
    name: string;
    country: string;
    rating: number;
    text: string;
    verified: boolean;
  }[];
  related: RelatedProduct[];
};

export const product: Product = {
  handle: "beta-rr-125-titan-kruemmer",
  title: "Tuning Krümmer Titan",
  category: "Exhaust",
  categoryHref: "#",
  brand: "Beta RR 125 LC",
  basePrice: 199,
  comparePrice: 229,
  rating: 5,
  reviewCount: 2,
  stockLeft: 1,
  images: [
    {
      src: "https://www.sick-motos.com/cdn/shop/files/C197DA2A-FC9F-4044-8829-376CAC387E84_1024x1024.jpg?v=1750939041",
      alt: "Beta RR 125 LC Titanium header installed",
    },
    {
      src: "https://www.sick-motos.com/cdn/shop/files/6C631DE0-9D31-4384-A7EC-7C12447B25AB_1024x1024.jpg?v=1754641476",
      alt: "Titanium header from the side",
    },
    {
      src: "https://www.sick-motos.com/cdn/shop/files/011C20FD-FF6E-4D1B-9890-A3294DE4FD54_1024x1024.jpg?v=1750939018",
      alt: "Titanium header detail shot",
    },
    {
      src: "https://www.sick-motos.com/cdn/shop/files/IMG-3978_1024x1024.png?v=1750940000",
      alt: "Carbon collector cover companion piece",
    },
  ],
  fitOn: ["Beta RR 125 LC 2021", "2022", "2023", "2024"],
  highlights: [
    "Pure Titanium grade 5, hand-welded in Germany",
    "−2.23 kg lighter than the OEM exhaust",
    "Plug & Play — no modifications required",
    "Includes mounting hardware and gaskets",
  ],
  variantGroups: [
    {
      title: "Model year",
      key: "year",
      variants: [
        { id: "2021", label: "2021", available: true },
        { id: "2022", label: "2022", available: true },
        { id: "2023", label: "2023", available: true },
        { id: "2024", label: "2024", available: true },
      ],
    },
  ],
  addOns: [
    {
      id: "titanium-screws",
      title: "Titanium screw kit",
      sub: "10 pcs, matched to header bolts",
      price: 39,
      image:
        "https://www.sick-motos.com/cdn/shop/files/011C20FD-FF6E-4D1B-9890-A3294DE4FD54_500x.jpg?v=1750939018",
    },
    {
      id: "carbon-endcap",
      title: "Carbon endcap",
      sub: "Lighter, louder, looks proper",
      price: 89,
      image:
        "https://www.sick-motos.com/cdn/shop/files/IMG-3978_500x.png?v=1750940000",
    },
    {
      id: "ecu-tune",
      title: "ECU Stage 1 tune",
      sub: "Dyno-validated for this header",
      price: 229,
      image:
        "https://www.sick-motos.com/cdn/shop/files/6C631DE0-9D31-4384-A7EC-7C12447B25AB_500x.jpg?v=1754641476",
    },
  ],
  bundle: {
    title: "Often bought with",
    subtitle: "Riders pairing the header with these.",
    items: [
      {
        title: "Titanium header",
        image:
          "https://www.sick-motos.com/cdn/shop/files/C197DA2A-FC9F-4044-8829-376CAC387E84_500x.jpg?v=1750939041",
        price: 199,
      },
      {
        title: "Carbon endcap",
        image:
          "https://www.sick-motos.com/cdn/shop/files/IMG-3978_500x.png?v=1750940000",
        price: 89,
      },
      {
        title: "Titanium screws",
        image:
          "https://www.sick-motos.com/cdn/shop/files/011C20FD-FF6E-4D1B-9890-A3294DE4FD54_500x.jpg?v=1750939018",
        price: 39,
      },
    ],
    bundlePrice: 327,
    savings: 0,
  },
  description:
    "Tuning Krümmer by SickMoto's für Beta RR 125 LC Minarelli-Motor 2021-2024. Die Sickmotos Krümmerrohre und Kat-Ersatzrohre werden von unseren Technikern handgefertigt. Built in the SickMotos workshop in Pöttmes, Germany.",
  specs: [
    { label: "Material", value: "Titanium" },
    { label: "Weight", value: "0,65 kg (−2,23 kg vs. OEM)" },
    { label: "Fits", value: "Beta RR 125 LC 2021-2024 Minarelli engine" },
    { label: "Origin", value: "Made in Pöttmes, Germany" },
    { label: "Delivery", value: "4-8 business days" },
    { label: "Warranty", value: "6 months on material and workmanship" },
  ],
  installation: [
    "Contact us via WhatsApp or email if you want installation guidance — Thomas walks you through it.",
  ],
  reviews: [
    {
      name: "Marco R.",
      country: "Italy",
      rating: 5,
      text: "The titanium exhaust is just insane. Sound, weight, build quality. Thomas even answered my questions over WhatsApp.",
      verified: true,
    },
    {
      name: "Jonas K.",
      country: "Germany",
      rating: 5,
      text: "Stage 2 completely transformed the bike. Noticeably more torque in the low end, super clean mapping. Plug and play just like promised.",
      verified: true,
    },
  ],
  related: [
    {
      handle: "led-rgbw-v7",
      title: "SICKMOTOS LED RGBW V7 Rage Edition",
      price: "€129,00",
      comparePrice: "€229,00",
      image:
        "https://www.sick-motos.com/cdn/shop/files/AAFD1335-22B2-4BA7-B533-249564ECDB50_500x.jpg?v=1769075218",
    },
    {
      handle: "beta-bremsscheiben",
      title: "Beta RR 50/125 Bremsscheiben Racing",
      price: "€59,00",
      comparePrice: "€69,00",
      image:
        "https://www.sick-motos.com/cdn/shop/files/IMG-3211_500x.jpg?v=1770275582",
    },
    {
      handle: "led-akku-pack",
      title: "LED Scheinwerfer Akku Pack Beta",
      price: "€45,00",
      comparePrice: "€55,00",
      image:
        "https://www.sick-motos.com/cdn/shop/files/FullSizeRender_96a8a12b-2945-4b5a-8749-db215102c956_500x.jpg?v=1777409456",
    },
    {
      handle: "carbon-cover-husqvarna",
      title: "Carbon Collector Cover Husqvarna 701",
      price: "€73,00",
      image:
        "https://www.sick-motos.com/cdn/shop/files/IMG-3978_500x.png?v=1750940000",
    },
  ],
};
