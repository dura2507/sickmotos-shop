import { ImageResponse } from "next/og";
import { OG_SIZE, ogAssets } from "@/lib/ogAssets";

// V2 — split card. Dark left panel, Fantic red build bleeding in from the
// right. A hard red accent bar sits at the seam. Product-forward.

export async function GET() {
  const { fanticRed } = await ogAssets();
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          background: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={fanticRed}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "60%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "30% 50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(100deg, #0a0a0a 0%, #0a0a0a 42%, rgba(10,10,10,0.7) 50%, rgba(10,10,10,0) 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "42%",
            top: 0,
            bottom: 0,
            width: 8,
            background: "#E10600",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "62px 64px",
            width: "45%",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 900,
              color: "#E10600",
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            SickMotos · Since 2015
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                fontSize: 26,
                color: "#c9c9c9",
                marginTop: 16,
                lineHeight: 1.3,
              }}
            >
              Titanium exhaust, LED,
              ECU tuning. Handmade
              in Germany.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                width: 40,
                height: 4,
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
              sick-motos.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
