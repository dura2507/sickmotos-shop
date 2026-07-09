import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "SickMotos. Ride in style, faster than others.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamically composed link-preview card. Renders to a PNG at build time and
// is reused across every share of https://sick-motos.com and any subpage
// without its own opengraph-image. Layout: dark brand canvas on the left with
// logo + kicker + tagline + URL, cropped bike photo bleeding in from the right
// under a dark-to-transparent gradient.
export default async function OpengraphImage() {
  const bikeBuf = await readFile(
    join(process.cwd(), "public/builds/build-fantic-bold-red.jpg")
  );
  const bikeSrc = `data:image/jpeg;base64,${bikeBuf.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={bikeSrc}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            width: "58%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, #0a0a0a 0%, #0a0a0a 42%, rgba(10,10,10,0.55) 62%, rgba(10,10,10,0) 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "58px 70px",
            width: "62%",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 52,
                height: 52,
                background: "#E10600",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: -1,
              }}
            >
              S
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 40,
                color: "#ffffff",
                fontWeight: 900,
                letterSpacing: 1,
              }}
            >
              SICKMOTOS
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                color: "#E10600",
                letterSpacing: 6,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Supermoto performance parts
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 104,
                color: "#ffffff",
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: -2,
              }}
            >
              RIDE IN STYLE
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 34,
                color: "#d0d0d0",
                marginTop: 6,
                lineHeight: 1.2,
              }}
            >
              Faster than others.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 46,
                height: 5,
                background: "#E10600",
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#ffffff",
                letterSpacing: 1,
                fontWeight: 600,
              }}
            >
              sick-motos.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
