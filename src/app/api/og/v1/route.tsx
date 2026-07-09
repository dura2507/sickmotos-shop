import { ImageResponse } from "next/og";
import { OG_SIZE, ogAssets } from "@/lib/ogAssets";

// V1 — full-bleed hero mirror. Uses the same Beta-cyan-sunset photo the site
// hero uses, same dark gradient overlays, same accent pill, same slogan SVG.
// A share of sick-motos.com looks like a screenshot of the hero.

export async function GET() {
  const { betaSunset, sloganSvg } = await ogAssets();
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
              "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.5) 42%, rgba(0,0,0,0.9) 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 100%)",
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
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 6,
              color: "#ff2b1e",
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

          <img
            src={sloganSvg}
            style={{ width: 620, height: "auto", objectFit: "contain" }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 30,
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
                fontSize: 30,
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
