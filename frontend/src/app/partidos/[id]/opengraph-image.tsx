import { ImageResponse } from "next/og";
import { API_URL } from "@/lib/api";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getPartido(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/partidos/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partido = await getPartido(id);

  const local = partido?.local_nombre ?? "Local";
  const visitante = partido?.visitante_nombre ?? "Visitante";
  const tieneResultado =
    partido?.goles_local !== null && partido?.goles_visitante !== null;
  const golesLocal = partido?.goles_local;
  const golesVisitante = partido?.goles_visitante;
  const jornada = partido?.jornada ?? "";
  const torneo = partido?.torneo ?? "";

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
            fontSize: "16px",
            color: "#888",
            marginBottom: "24px",
            textTransform: "uppercase",
            letterSpacing: "4px",
          }}
        >
          {torneo}{jornada ? ` · Jornada ${jornada}` : ""}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              width: "400px",
            }}
          >
            <div style={{ fontSize: "48px", fontWeight: "bold", textAlign: "right" }}>
              {local}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: "200px",
            }}
          >
            {tieneResultado ? (
              <div style={{ fontSize: "72px", fontWeight: "bold" }}>
                {golesLocal} - {golesVisitante}
              </div>
            ) : (
              <div style={{ fontSize: "48px", fontWeight: "bold", color: "#666" }}>
                vs
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "400px",
            }}
          >
            <div style={{ fontSize: "48px", fontWeight: "bold", textAlign: "left" }}>
              {visitante}
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "18px",
            color: "#666",
          }}
        >
          Liga Paraguaya de Fútbol
        </div>
      </div>
    ),
    { ...size }
  );
}
