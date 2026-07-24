import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Metadata for the generated Open Graph / Twitter image.
export const alt = "Luxeit — Premium imports, delivered across Zambia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded link preview: the Luxeit logo on the dark brand background, with the
// business tagline beneath it. Shown when the site is shared on WhatsApp, X, etc.
export default async function Image() {
  const logo = await readFile(join(process.cwd(), "src/app/icon.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120% 120% at 50% 0%, #15130c 0%, #0a0a0a 55%, #050505 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={300} height={300} alt="Luxeit" />
        <div
          style={{
            marginTop: 28,
            fontSize: 46,
            fontWeight: 700,
            letterSpacing: -1,
            color: "#F5F5F5",
          }}
        >
          Premium imports, delivered
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 26,
            color: "#D4AF37",
          }}
        >
          Shop China's best — delivered across Zambia
        </div>
      </div>
    ),
    { ...size },
  );
}
