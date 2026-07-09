import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Assets used in the OG previews. Read once from disk and encoded as data URIs
// so satori doesn't need to hit the network during ImageResponse rendering.

let cache: Awaited<ReturnType<typeof loadAll>> | null = null;

async function loadAll() {
  const publicDir = join(process.cwd(), "public");
  const [slogan, fanticRed, betaSunset, krummerRainbow, hexagonLedRed] =
    await Promise.all([
      readFile(join(publicDir, "brand/ride-in-style.svg")),
      readFile(join(publicDir, "builds/build-fantic-bold-red.jpg")),
      readFile(join(publicDir, "builds/hero-beta-cyan-sunset.jpg")),
      readFile(join(publicDir, "builds/macro-krummer-rainbow.jpg")),
      readFile(join(publicDir, "builds/macro-hexagon-led-red.jpg")),
    ]);
  return {
    sloganSvg: `data:image/svg+xml;base64,${slogan.toString("base64")}`,
    fanticRed: `data:image/jpeg;base64,${fanticRed.toString("base64")}`,
    betaSunset: `data:image/jpeg;base64,${betaSunset.toString("base64")}`,
    krummerRainbow: `data:image/jpeg;base64,${krummerRainbow.toString("base64")}`,
    hexagonLedRed: `data:image/jpeg;base64,${hexagonLedRed.toString("base64")}`,
  };
}

export async function ogAssets() {
  if (!cache) cache = await loadAll();
  return cache;
}

export const OG_SIZE = { width: 1200, height: 630 } as const;
