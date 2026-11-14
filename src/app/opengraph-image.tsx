import { ImageResponse } from "next/og";
export const alt = "Do-Over — You know what to say. Until they scream.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraph() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          background: "#f7f5ef",
          color: "#213d36",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 55 }}>↺ Do-Over.</div>
        <div style={{ fontSize: 76, lineHeight: 1.1 }}>
          You know what to say.
        </div>
        <div style={{ fontSize: 76, lineHeight: 1.1, color: "#245d4b" }}>
          Until they scream.
        </div>
        <div style={{ fontSize: 24, marginTop: 42 }}>
          A little practice for a hard moment. No account needed.
        </div>
      </div>
    ),
    size,
  );
}
