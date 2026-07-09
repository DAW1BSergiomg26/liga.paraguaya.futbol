import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0A0E1A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 120,
            display: "flex",
          }}
        >
          <div style={{ flex: "1 1 0%", background: "#D52B1E" }} />
          <div style={{ flex: "1 1 0%", background: "#FFFFFF" }} />
          <div style={{ flex: "1 1 0%", background: "#0038A8" }} />
        </div>

        <span
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "8px",
            textTransform: "uppercase",
          }}
        >
          LIGA PY
        </span>

        <span
          style={{
            fontSize: 36,
            color: "#A0AEC0",
            marginTop: 16,
            letterSpacing: "3px",
          }}
        >
          Liga Paraguaya de Fútbol
        </span>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 10,
            display: "flex",
          }}
        >
          <div style={{ flex: "1 1 0%", background: "#D52B1E" }} />
          <div style={{ flex: "1 1 0%", background: "#FFFFFF" }} />
          <div style={{ flex: "1 1 0%", background: "#0038A8" }} />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
