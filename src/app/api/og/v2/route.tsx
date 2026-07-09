import { ImageResponse } from "next/og";
import { OG_SIZE, ogAssets } from "@/lib/ogAssets";

// V2 — Split card. Dark left panel with the real script logo + Bebas Neue
// tagline stack, a slim red vertical seam, and the Fantic red build bleeding
// in from the right. Product-forward, matches site typography.

export async function GET() {
  const { fanticRed, logoScript, bebasFont } = await ogAssets();
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          background: "#0a0a0a",
        }}
      >
        <img
          src={fanticRed}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "60%",
            height: 630,
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
            width: 4,
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
            padding: "56px 60px",
            width: "45%",
            height: "100%",
          }}
        >
          <div style={{ display: "flex" }}>
            <img
              src={logoScript}
              width={200}
              height={128}
              style={{ display: "flex", objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Bebas Neue",
                fontSize: 116,
                lineHeight: 0.88,
                color: "#ffffff",
                letterSpacing: 1,
              }}
            >
              RIDE IN
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Bebas Neue",
                fontSize: 116,
                lineHeight: 0.88,
                color: "#ffffff",
                letterSpacing: 1,
              }}
            >
              STYLE.
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Bebas Neue",
                fontSize: 32,
                color: "#E10600",
                letterSpacing: 3,
                marginTop: 16,
              }}
            >
              FASTER THAN OTHERS.
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
                fontFamily: "Bebas Neue",
                fontSize: 30,
                color: "#ffffff",
                letterSpacing: 2,
              }}
            >
              SICK-MOTOS.COM
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        {
          name: "Bebas Neue",
          data: bebasFont,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
