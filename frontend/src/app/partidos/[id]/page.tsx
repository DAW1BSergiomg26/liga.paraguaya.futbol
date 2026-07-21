import type { Metadata } from "next";
import PartidoDetailPageClient from "./PageClient";
import { getPartido } from "@/lib/api";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const partido = await getPartido(id);
    const resultado =
      partido.goles_local !== null && partido.goles_visitante !== null
        ? ` (${partido.goles_local} - ${partido.goles_visitante})`
        : "";
    return {
      title: `${partido.local_nombre} vs ${partido.visitante_nombre}${resultado}`,
      description: `${partido.local_nombre} vs ${partido.visitante_nombre} — ${partido.torneo}, Jornada ${partido.jornada}. ${partido.estado}.${resultado}`,
      openGraph: {
        title: `${partido.local_nombre} vs ${partido.visitante_nombre} | Liga PY`,
        description: `${partido.torneo} — Jornada ${partido.jornada}. ${partido.estado}.`,
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
