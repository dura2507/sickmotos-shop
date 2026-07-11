import { ImageResponse } from "next/og";
import { OG_SIZE, ogAssets } from "@/lib/ogAssets";

// V3 — product macro. Rainbow titanium Krümmer as the full-bleed hero, dark
// glass panel bottom-left with lockup. Craftsman signal.

export async function GET() {
  const { krummerRainbow } = await ogAssets();
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
          src={krummerRainbow}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 35%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.92) 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 42,
            left: 60,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            background: "rgba(0,0,0,0.7)",
            border: "2px solid #E10600",
            borderRadius: 999,
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
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            Handmade Titanium · Germany
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 50,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            width: "70%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 96,
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
              fontSize: 96,
              lineHeight: 0.95,
              fontWeight: 900,
              color: "#E10600",
              letterSpacing: -2,
            }}
          >
            STYLE.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 20,
            }}
          >
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
                fontSize: 28,
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
