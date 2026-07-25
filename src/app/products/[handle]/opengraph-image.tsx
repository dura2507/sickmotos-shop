import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { cleanTitle, fmtEUR, getPrice, getProductByHandle } from "@/lib/products";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// One card per product, only so og:image:alt can name the actual part instead
// of a generic line.
export function generateImageMetadata({
  params,
}: {
  params: { handle: string };
}) {
  const p = getProductByHandle(params.handle);
  return [
    {
      id: "card",
      size,
      contentType,
      alt: p ? `${cleanTitle(p.title)} | SickMotos` : "SickMotos performance part",
    },
  ];
}

// Rendered per request instead of prerendered for all ~486 products, which
// would add hundreds of megabytes and minutes to every build. The card only
// changes when price or photo change, so it is cached hard at the edge.
export const dynamic = "force-dynamic";

const PANEL = 520;
const INSET = 26;
const TILE_W = size.width - PANEL - INSET * 2;
const TILE_H = size.height - INSET * 2;

const asset = (p: string) => readFile(join(process.cwd(), p));
const dataUri = (buf: Buffer | Uint8Array, mime: string) =>
  `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;

// Shopify serves a resized copy from the same URL, which keeps the fetch small
// enough that the card renders well inside a crawler's patience.
async function productShot(src: string | undefined): Promise<string | null> {
  if (!src) return null;
  try {
    const u = new URL(src);
    u.searchParams.set("width", "900");
    const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const bytes = new Uint8Array(await r.arrayBuffer());
    return dataUri(bytes, r.headers.get("content-type") ?? "image/jpeg");
  } catch {
    return null;
  }
}

export default async function ProductOpengraphImage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const p = getProductByHandle(handle);

  const [logo, fallback, bebas] = await Promise.all([
    asset("public/logo-alt-2.png"),
    asset("public/builds/build-fantic-bold-red.jpg"),
    asset("public/fonts/BebasNeue-Regular.ttf"),
  ]);

  const shot = p ? await productShot(p.images[0]?.src) : null;
  const title = p
    ? cleanTitle(p.title).replace(/\s+/g, " ").toUpperCase()
    : "SUPERMOTO PERFORMANCE PARTS";
  const titleSize =
    title.length > 96 ? 36 : title.length > 62 ? 42 : title.length > 44 ? 50 : 58;
  const { price, compareAt } = p
    ? getPrice(p)
    : { price: 0, compareAt: null as number | null };

  const render = (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        position: "relative",
        fontFamily: "Bebas Neue",
      }}
    >
      {/* White light-box so the part reads the same whether its photo was shot
          on a white or on a dark background. */}
      <div
        style={{
          position: "absolute",
          top: INSET,
          left: PANEL + INSET,
          width: TILE_W,
          height: TILE_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: shot ? "#ffffff" : "#0a0a0a",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <img
          src={shot ?? dataUri(fallback, "image/jpeg")}
          alt=""
          width={TILE_W}
          height={TILE_H}
          style={{
            width: TILE_W,
            height: TILE_H,
            objectFit: shot ? "contain" : "cover",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "44px 48px",
          width: PANEL,
          height: "100%",
        }}
      >
        <img
          src={dataUri(logo, "image/png")}
          alt=""
          width={124}
          height={80}
          style={{ width: 124, height: 80, objectFit: "contain" }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: titleSize,
              lineHeight: 1.02,
              color: "#fafafa",
              letterSpacing: -0.5,
              marginBottom: 22,
            }}
          >
            {title}
          </div>
          {p ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
              <div
                style={{ display: "flex", fontSize: 60, color: "#E10600", lineHeight: 1 }}
              >
                {fmtEUR(price)}
              </div>
              {compareAt && compareAt > price ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: 34,
                    color: "#6b6b6e",
                    lineHeight: 1.2,
                    textDecoration: "line-through",
                  }}
                >
                  {fmtEUR(compareAt)}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Same face and tracking as the site's display type. */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 34, height: 5, background: "#E10600" }} />
          <div
            style={{
              display: "flex",
              fontSize: 36,
              color: "#ffffff",
              letterSpacing: -0.5,
              lineHeight: 1,
            }}
          >
            SICKMOTOS.COM
          </div>
        </div>
      </div>
    </div>
  );

  return new ImageResponse(render, {
    ...size,
    fonts: [{ name: "Bebas Neue", data: bebas, weight: 400, style: "normal" }],
    headers: {
      "cache-control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
