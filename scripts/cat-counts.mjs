import data from '../src/data/products.json' with { type: 'json' };
const products = data.products || data;
const rules = [
  { keywords: ["led","scheinwerfer","angel eye","hexagon","headlight"], category: "LED Headlights" },
  { keywords: ["auspuff","krümmer","krummer","exhaust"], category: "Exhaust" },
  { keywords: ["carbon"], category: "Carbon Parts" },
  { keywords: ["ecu","mapping","tuning kit","fuel-x","powercommander"], category: "ECU Tuning" },
  { keywords: ["bremsscheibe","brake","bremse"], category: "Brakes" },
  { keywords: ["hoodie","t-shirt","tshirt","shirt","merch"], category: "Merchandise" },
  { keywords: ["titanschraube","titanium screw","titan-schraube"], category: "Titanium Screws" },
  { keywords: ["dekor","graphic","razor blade","razor gold","grand theft","broken head"], category: "Graphics" },
  { keywords: ["felge","wheel","rim"], category: "Wheels" },
];
const counts = {};
for (const p of products) {
  const hay = (p.title + ' ' + (p.product_type||'') + ' ' + (p.tags||[]).join(' ')).toLowerCase();
  let cat = 'Other';
  for (const r of rules) if (r.keywords.some(k => hay.includes(k))) { cat = r.category; break; }
  counts[cat] = (counts[cat]||0)+1;
}
console.log(counts);
console.log('total:', products.length);
