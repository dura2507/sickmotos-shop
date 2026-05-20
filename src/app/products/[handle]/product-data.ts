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
  rating: 4.9,
  reviewCount: 38,
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
      title: "Engine",
      key: "engine",
      variants: [
        { id: "minarelli", label: "Minarelli", sub: "2021-2024", available: true },
        { id: "tayo", label: "Tayo", sub: "2023-2024", priceModifier: 20, available: true },
        { id: "zontes", label: "Zontes", sub: "2023-2024", priceModifier: 20, available: true },
      ],
    },
    {
      title: "Finish",
      key: "finish",
      variants: [
        { id: "raw", label: "Raw titanium", sub: "Classic", available: true },
        { id: "burnt", label: "Burnt blue", sub: "+€20", priceModifier: 20, available: true },
        { id: "black", label: "Stealth black", sub: "Sold out", available: false },
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
    title: "Race-ready bundle",
    subtitle: "The full upgrade Thomas runs on his own bike.",
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
    bundlePrice: 279,
    savings: 48,
  },
  description:
    "Hand-welded titanium header tuned by Thomas Krawietz for the Beta RR 125 LC. Removes 2.23 kg from the stock exhaust and frees up the mid-range without dyno-fighting the standard ECU. Drops straight onto the original mounts with the supplied gaskets and clamps. Built in small batches in the SickMotos workshop in Pöttmes, Germany.",
  specs: [
    { label: "Material", value: "Titanium grade 5" },
    { label: "Weight", value: "0.65 kg (−2.23 kg vs OEM)" },
    { label: "Diameter", value: "38 mm primary, 42 mm collector" },
    { label: "Mounting", value: "Plug & Play, OEM bolt pattern" },
    { label: "Origin", value: "Hand-welded in Pöttmes, Germany" },
    { label: "Warranty", value: "6 months on material and workmanship" },
  ],
  installation: [
    "Remove the OEM header (4 bolts at the cylinder, 2 at the muffler).",
    "Transfer the gasket from the parts bag, seat it on the cylinder face.",
    "Hand-tight the new header before final torque (8 Nm).",
    "Re-fit the OEM or aftermarket muffler.",
    "First start: idle for 2 minutes to seat the titanium colour.",
  ],
  reviews: [
    {
      name: "Marco R.",
      country: "Italy",
      rating: 5,
      text: "Sound, weight, build quality. Thomas even answered my questions over WhatsApp.",
      verified: true,
    },
    {
      name: "Jonas K.",
      country: "Germany",
      rating: 5,
      text: "Bike feels lighter on the front, throttle response is sharper. Bolted up in 20 minutes.",
      verified: true,
    },
    {
      name: "Lukas M.",
      country: "Switzerland",
      rating: 4,
      text: "Quality is top, shipping took 9 days to Zurich. Would buy again.",
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
