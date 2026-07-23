import { ImageResponse } from "next/og";
import { API_URL } from "@/lib/api";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getClub(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/clubes/${id}`, {
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
  const club = await getClub(id);

  const nombre = club?.nombre ?? "Club";
  const escudo = club?.escudo;
  const color1 = club?.colores?.[0] ?? "#CC001C";
  const color2 = club?.colores?.[1] ?? "#00619E";

  let escudoData: ArrayBuffer | null = null;
  if (escudo) {
    try {
      const res = await fetch(escudo);
      if (res.ok) escudoData = await res.arrayBuffer();
    } catch {
      // Si falla, generamos sin escudo
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          background: `linear-gradient(135deg, ${color1}22 0%, #0A0A0A 40%, ${color2}22 100%)`,
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
            background: `linear-gradient(90deg, ${color1}, ${color2})`,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: "80px",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: "18px",
              color: "#888",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "4px",
            }}
          >
            Liga Paraguaya
          </div>
          <div
            style={{
              fontSize: "56px",
              fontWeight: "bold",
              letterSpacing: "-1px",
              lineHeight: "1.1",
              maxWidth: "700px",
            }}
          >
            {nombre}
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#aaa",
              marginTop: "16px",
            }}
          >
            {club?.estadio ?? ""}{club?.ciudad ? ` · ${club.ciudad}` : ""}
          </div>
        </div>
        {escudoData && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              paddingRight: "80px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${Buffer.from(escudoData).toString("base64")}`}
              alt=""
              width="280"
              height="280"
              style={{ objectFit: "contain" }}
            />
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
