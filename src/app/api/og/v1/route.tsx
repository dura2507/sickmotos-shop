import { ImageResponse } from "next/og";
import { OG_SIZE, ogAssets } from "@/lib/ogAssets";

// V1 — Hero mirror. Beta sunset photo full-bleed, dark gradient overlays, real
// header script logo top-left, Bebas Neue oversized "RIDE IN STYLE." in the
// site's display treatment. No pills, no boxed chrome, matches the landing
// page hero style directly.

export async function GET() {
  const { betaSunset, logoScript, bebasFont } = await ogAssets();
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          background: "#000000",
        }}
      >
        <img
          src={betaSunset}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: 1200,
            height: 630,
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
              "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 72px",
            width: "100%",
            height: "100%",
          }}
        >
          <div style={{ display: "flex" }}>
            <img
              src={logoScript}
              width={220}
              height={141}
              style={{ display: "flex", objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Bebas Neue",
                fontSize: 168,
                lineHeight: 0.9,
                color: "#ffffff",
                letterSpacing: 2,
              }}
            >
              RIDE IN STYLE.
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Bebas Neue",
                fontSize: 44,
                lineHeight: 1.05,
                color: "#E10600",
                letterSpacing: 4,
                marginTop: 12,
              }}
            >
              FASTER THAN OTHERS.
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
                width: 44,
                height: 4,
                background: "#E10600",
              }}
            />
            <div
              style={{
                display: "flex",
                fontFamily: "Bebas Neue",
                fontSize: 34,
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
