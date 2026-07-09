import { ImageResponse } from "next/og";
import { OG_SIZE, ogAssets } from "@/lib/ogAssets";

// V3 — product macro. Rainbow titanium Krümmer as the full-bleed hero, dark
// glass panel bottom-left with the slogan and URL. Craftsman signal.

export async function GET() {
  const { krummerRainbow, sloganSvg } = await ogAssets();
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
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.9) 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 44,
            left: 60,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            background: "rgba(0,0,0,0.65)",
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
            gap: 20,
            width: "60%",
          }}
        >
          <img
            src={sloganSvg}
            style={{ width: 540, height: "auto", objectFit: "contain" }}
          />
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
              sick-motos.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
