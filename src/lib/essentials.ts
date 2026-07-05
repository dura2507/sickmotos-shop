// Helpers for the "converter is a must" logic Thomas asked for.
//
// LED lamps do NOT work without a matching converter. So on lamp product pages
// we mark the converter add-on as REQUIRED (red), auto-add it to the cart when
// the customer buys the lamp, and warn in the cart if the lamp is present
// without a converter.
//
// Kept purely string-based so both server and client code can use it cheaply.

const CONVERTER_KEYWORDS = ["converter", "konverter"];
const LAMP_KEYWORDS = [
  "led-scheinwerfer",
  "led scheinwerfer",
  "angel eye",
  "hexagon",
  "hexagonal",
  "glow beam",
  "x-beam",
  "scheinwerfer",
  "led headlight",
];

function haystack(...parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function isConverter(handle: string, title: string): boolean {
  const h = haystack(handle, title);
  return CONVERTER_KEYWORDS.some((k) => h.includes(k));
}

export function isLamp(handle: string, title: string, category?: string): boolean {
  if (category === "LED Headlights") return true;
  const h = haystack(handle, title);
  return LAMP_KEYWORDS.some((k) => h.includes(k));
}
