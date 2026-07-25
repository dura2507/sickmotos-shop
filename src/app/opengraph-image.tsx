import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "SickMotos. Ride in style, faster than others.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const asset = (p: string) => readFile(join(process.cwd(), p));
const dataUri = (buf: Buffer, mime: string) =>
  `data:${mime};base64,${buf.toString("base64")}`;

// Photo column, anchored right. The scrim below has to be fully opaque at
// PHOTO_LEFT, otherwise the black canvas meets a half-lit photo and you get a
// hard vertical seam.
const PHOTO_W = 700;
const PHOTO_LEFT = size.width - PHOTO_W;
const stop = (px: number) => `${((px / size.width) * 100).toFixed(1)}%`;

// Link-preview card for every share of sickmotos.com (and any subpage without
// its own opengraph-image). Everything brand-facing is a real asset, not a
// lookalike: the SickMotos mark, the "Ride in style" hero lettering and
// Bebas Neue (the site's display face, see --font-display in layout.tsx) are
// embedded, because next/og ships only a generic fallback font and would
// otherwise render the card in Noto Sans with every font-weight ignored.
export default async function OpengraphImage() {
  const [bike, logo, lockup, bebas] = await Promise.all([
    asset("public/builds/build-fantic-bold-red.jpg"),
    asset("public/logo-alt-2.png"),
    asset("public/brand/ride-in-style.png"),
    asset("public/fonts/BebasNeue-Regular.ttf"),
  ]);

  return new ImageResponse(
    (
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
        <img
          src={dataUri(bike, "image/jpeg")}
          alt=""
          width={PHOTO_W}
          height={size.height}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: PHOTO_W,
            height: size.height,
            objectFit: "cover",
            objectPosition: "50% 45%",
          }}
        />
        {/* Feathered scrim so the bike dissolves into the canvas. Satori
            ignores the `inset` shorthand, so the box is pinned explicitly. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            display: "flex",
            background: `linear-gradient(90deg, #0a0a0a 0%, #0a0a0a ${stop(
              PHOTO_LEFT - 8
            )}, rgba(10,10,10,0.94) ${stop(PHOTO_LEFT + 24)}, rgba(10,10,10,0.5) ${stop(
              PHOTO_LEFT + 110
            )}, rgba(10,10,10,0.12) ${stop(PHOTO_LEFT + 190)}, rgba(10,10,10,0) ${stop(
              PHOTO_LEFT + 265
            )})`,
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "50px 56px",
            width: 560,
            height: "100%",
          }}
        >
          <img
            src={dataUri(logo, "image/png")}
            alt=""
            width={150}
            height={96}
            style={{ width: 150, height: 96, objectFit: "contain" }}
          />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#E10600",
                letterSpacing: 6,
                marginBottom: 16,
              }}
            >
              SUPERMOTO PERFORMANCE PARTS
            </div>
            <img
              src={dataUri(lockup, "image/png")}
              alt=""
              width={430}
              height={169}
              style={{ width: 430, height: 169, objectFit: "contain" }}
            />
          </div>

          {/* Same face and tracking as the site's display type. */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{ display: "flex", width: 42, height: 6, background: "#E10600" }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 52,
                color: "#ffffff",
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              SICKMOTOS.COM
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Bebas Neue",
          data: bebas,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );
}
