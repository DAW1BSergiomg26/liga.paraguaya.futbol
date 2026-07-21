import type { Metadata } from "next";
import PartidoDetailPageClient from "./PageClient";
import { getPartido, getClub } from "@/lib/api";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import JsonLd from "@/components/JsonLd";
import { buildSportsEvent } from "@/lib/jsonLd";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const partido = await getPartido(id);
    const tieneResultado =
      partido.goles_local !== null && partido.goles_visitante !== null;

    const resultado = tieneResultado
      ? ` ${partido.goles_local} - ${partido.goles_visitante}`
      : "";

    const fechaStr = new Date(partido.fecha).toLocaleDateString("es-PY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const estadoLabel =
      partido.estado === "finalizado"
        ? "Finalizado"
        : partido.estado === "en_vivo"
          ? "En vivo"
          : `Programado para el ${fechaStr}`;

    const description = tieneResultado
      ? `${partido.local_nombre} ${partido.goles_local} - ${partido.goles_visitante} ${partido.visitante_nombre}. ${partido.torneo}, Jornada ${partido.jornada}. ${estadoLabel}.`
      : `${partido.local_nombre} vs ${partido.visitante_nombre}. ${partido.torneo}, Jornada ${partido.jornada}. ${estadoLabel}.`;

    const ogImageUrl = `${SITE_URL}/api/og/partido?id=${id}`;

    return {
      title: `${partido.local_nombre} vs ${partido.visitante_nombre}${resultado} — ${SITE_NAME}`,
      description,
      openGraph: {
        title: `${partido.local_nombre} vs${resultado} ${partido.visitante_nombre} | Liga PY`,
        description,
        type: "article",
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${partido.local_nombre} vs${resultado} ${partido.visitante_nombre} | Liga PY`,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return { title: "Partido no encontrado" };
  }
}

export default async function PartidoDetailPage({ params }: Props) {
  const { id } = await params;

  let jsonLdData: object | null = null;
  try {
    const partido = await getPartido(id);
    let estadio: string | null = null;
    try {
      const club = await getClub(partido.local_id);
      estadio = club.estadio ?? null;
    } catch {
      // Si falla el fetch del club, el JSON-LD es válido sin venue
    }

    jsonLdData = buildSportsEvent({
      id: partido.id,
      localNombre: partido.local_nombre,
      visitanteNombre: partido.visitante_nombre,
      fecha: partido.fecha,
      estado: partido.estado,
      torneo: partido.torneo,
      jornada: partido.jornada,
      golesLocal: partido.goles_local,
      golesVisitante: partido.goles_visitante,
      estadio,
    });
  } catch {
    // Si falla, renderizamos sin JSON-LD
  }

  return (
    <>
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <PartidoDetailPageClient />
    </>
  );
}
