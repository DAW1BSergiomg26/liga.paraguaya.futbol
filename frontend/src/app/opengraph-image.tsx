import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 50%, #0A0A0A 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #CC001C 0%, #CC001C 33%, #00619E 33%, #00619E 66%, #FFCC00 66%, #FFCC00 100%)",
          }}
        />
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            letterSpacing: "-2px",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          Liga PY
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#a0a0a0",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          Fútbol Paraguayo en Tiempo Real
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "18px",
            color: "#666",
          }}
        >
          Datos · Estadísticas · Resultados
        </div>
      </div>
    ),
    { ...size }
  );
}
