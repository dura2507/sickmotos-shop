import { ImageResponse } from "next/og";
import { OG_SIZE, ogAssets } from "@/lib/ogAssets";

// V2 — split card. Dark left panel with the brand mark + slogan artwork,
// Fantic red bike photo bleeding in from the right under a hard diagonal
// separator. Aggressive, product-forward.

export async function GET() {
  const { fanticRed, sloganSvg } = await ogAssets();
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
            width: "62%",
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
              "linear-gradient(100deg, #0a0a0a 0%, #0a0a0a 44%, rgba(10,10,10,0.7) 52%, rgba(10,10,10,0) 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "43%",
            top: 0,
            bottom: 0,
            width: 6,
            background: "#E10600",
            display: "flex",
            transform: "skewX(-8deg)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "62px 64px",
            width: "48%",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 900,
              color: "#E10600",
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            SickMotos · since 2015
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <img
              src={sloganSvg}
              style={{ width: 500, height: "auto", objectFit: "contain" }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#c9c9c9",
                lineHeight: 1.35,
                width: 460,
              }}
            >
              Titanium exhaust systems, LED headlights, ECU tuning. Handmade in
              Germany.
            </div>
          </div>

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
