import { ImageResponse } from "next/og";
import { OG_SIZE, ogAssets } from "@/lib/ogAssets";

// V1 — full-bleed hero mirror. The exact photo, overlays, accent pill and
// text stack the site hero uses. Feels like a screenshot of the landing page.

export async function GET() {
  const { betaSunset } = await ogAssets();
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
          src={betaSunset}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 42%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.92) 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 24,
            padding: "70px 80px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "2px solid #E10600",
              background: "rgba(225,6,0,0.14)",
              borderRadius: 999,
              padding: "8px 20px",
              width: "fit-content",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 6,
              color: "#ff3a2e",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 10,
                height: 10,
                background: "#E10600",
                borderRadius: 999,
              }}
            />
            Supermoto Performance Parts
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginTop: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 128,
                lineHeight: 0.95,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: -3,
              }}
            >
              RIDE IN
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 128,
                lineHeight: 0.95,
                fontWeight: 900,
                color: "#E10600",
                letterSpacing: -3,
                fontStyle: "italic",
              }}
            >
              STYLE.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 48,
                height: 5,
                background: "#E10600",
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: "#ffffff",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              sick-motos.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
