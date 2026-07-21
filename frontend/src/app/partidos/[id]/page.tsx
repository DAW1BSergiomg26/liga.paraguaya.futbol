import type { Metadata } from "next";
import PartidoDetailPageClient from "./PageClient";
import { getPartido } from "@/lib/api";
import { SITE_NAME } from "@/lib/config";

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

    return {
      title: `${partido.local_nombre} vs ${partido.visitante_nombre}${resultado} — ${SITE_NAME}`,
      description,
      openGraph: {
        title: `${partido.local_nombre} vs${resultado} ${partido.visitante_nombre} | Liga PY`,
        description,
        type: "article",
      },
    };
  } catch {
    return { title: "Partido no encontrado" };
  }
}

export default function PartidoDetailPage({ params }: Props) {
  return <PartidoDetailPageClient />;
}
