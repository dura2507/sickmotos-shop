// Made-to-order lead times for handcrafted lamps, titanium headers and wheels.
// Real production flow: build 3-7 days, test around day 10-12, then pack/ship.
// Standalone module so client components can use it without the full product dataset.

export type LeadTime = {
  badge: string; // short chip label
  short: string; // compact duration, e.g. "approx. 2-3 weeks"
  note: string; // one-line explanation for detail/cart
  long: boolean; // true for the very long lead (wheels)
  steps?: { day: string; label: string; detail: string }[];
};

export function leadTimeFor(category: string): LeadTime | null {
  if (category === "Wheels") {
    return {
      badge: "Made to order",
      short: "6+ weeks",
      note: "Built to order just for you. Current lead time is 6 weeks or more, and you get email updates along the way.",
      long: true,
    };
  }
  if (category === "LED Headlights" || category === "Exhaust") {
    return {
      badge: "Made to order",
      short: "approx. 2-3 weeks",
      note: "Handcrafted and tested before it ships, so expect about 2 to 3 weeks. Built in the order things come in.",
      long: false,
      steps: [
        { day: "Day 1-7", label: "Production", detail: "Built by hand in our workshop." },
        { day: "Day 10-12", label: "Testing", detail: "Every unit is tested before it leaves." },
        { day: "Day 13-15", label: "Packing & shipping", detail: "Boxed with care and handed to the carrier." },
      ],
    };
  }
  return null;
}

// Title-based fallback for places that only have the product title (e.g. cart
// lines), not the resolved category. Mirrors the made-to-order category rules.
// Kept conservative so a graphics "rim sticker" kit or similar never gets tagged
// with the very long wheels lead time. Mirrors the real category keywords, minus
// the broad ones ("wheel"/"rim") that produce false positives on non-wheel parts.
const TITLE_RULES: { kw: string[]; category: string }[] = [
  { kw: ["felge"], category: "Wheels" },
  { kw: ["led", "scheinwerfer", "angel eye", "hexagon", "headlight"], category: "LED Headlights" },
  { kw: ["auspuff", "krümmer", "krummer", "exhaust"], category: "Exhaust" },
];

export function leadTimeForTitle(title: string): LeadTime | null {
  const t = title.toLowerCase();
  for (const r of TITLE_RULES) {
    if (r.kw.some((k) => t.includes(k))) return leadTimeFor(r.category);
  }
  return null;
}
