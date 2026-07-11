import { ImageResponse } from "next/og";
import { OG_SIZE, ogAssets } from "@/lib/ogAssets";

// V4 — night LED. Hexagon Angel Eye LED close-up, deep dark, red glow.
// Signature LED headlight product line.

export async function GET() {
  const { hexagonLedRed } = await ogAssets();
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          background: "#000000",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={hexagonLedRed}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "60% 40%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 72px",
            gap: 20,
            width: "62%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 900,
              color: "#E10600",
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            Angel Eye · Hexagon · RGBW
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                display: "flex",
                fontSize: 104,
                lineHeight: 0.95,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: -2,
              }}
            >
              RIDE IN
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 104,
                lineHeight: 0.95,
                fontWeight: 900,
                color: "#E10600",
                letterSpacing: -2,
              }}
            >
              STYLE.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#d4d4d4",
              lineHeight: 1.4,
              width: 520,
            }}
          >
            LED headlights with app control, titanium exhausts, ECU tuning.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                width: 44,
                height: 5,
                background: "#E10600",
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#ffffff",
                fontWeight: 700,
              }}
            >
              sickmotos.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
