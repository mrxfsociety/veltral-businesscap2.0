import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
export const alt = "Do-Over — You know what to say. Until they scream.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function OpenGraph() {
  const directory = join(process.cwd(), "public/brand");
  const [lockup, regular, italic] = await Promise.all([
    readFile(join(directory, "lockup-horizontal.svg")),
    readFile(join(directory, "fonts/Fraunces-Display640.ttf")),
    readFile(join(directory, "fonts/Fraunces-Display640Italic.ttf")),
  ]);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: 32,
        background: "#F4ECDD",
        color: "#1E2740",
        fontFamily: "Fraunces",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: "40px 44px",
          background: "#FBF6EA",
          borderRadius: 4,
          boxShadow: "2px 3px 0 #D9CDB8, 5px 9px 18px #1E27401A",
        }}
      >
        {/* SVG contains outlined lettering; no fallback font in the logo. */}
        <img
          src={`data:image/svg+xml;base64,${lockup.toString("base64")}`}
          width={315}
          height={56}
          alt="Do-Over"
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 62,
            fontSize: 83,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          <div>You know what to say.</div>
          <div style={{ fontStyle: "italic", color: "#C8431F" }}>
            Until they scream.
          </div>
        </div>
        <div style={{ marginTop: 45, fontSize: 25 }}>
          Rehearse the hard minute. Take it again.
        </div>
      </div>
    </div>,
    {
      ...size,
      // Satori uses hundred-step slots; these static font contours are weight 640.
      fonts: [
        { name: "Fraunces", data: regular, weight: 600, style: "normal" },
        { name: "Fraunces", data: italic, weight: 600, style: "italic" },
      ],
    },
  );
}
