import type { Metadata } from "next";
import ClubDetailPageClient from "./PageClient";
import { getClub, getTabla, getPartidos } from "@/lib/api";
import { SITE_NAME } from "@/lib/config";
import type { TablaRow, Partido } from "@/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const club = await getClub(id);

    let posicionInfo = "";
    let ultimosResultados = "";
    try {
      const [tabla, partidosPage] = await Promise.all([
        getTabla().catch(() => null as TablaRow[] | null),
        getPartidos(undefined, "finalizado", undefined, 100).catch(() => null),
      ]);
      if (tabla) {
        const row = tabla.find(
          (r) =>
            r.club_id === id ||
            r.club.toLowerCase().includes(club.nombre.toLowerCase()),
        );
        if (row) posicionInfo = `. Posición #${row.posicion} en tabla (${row.puntos} puntos)`;
      }
      if (partidosPage?.data) {
        const recientes = partidosPage.data
          .filter((p) => p.local_id === id || p.visitante_id === id)
          .slice(0, 5);
        if (recientes.length > 0) {
          const resultados = recientes.map((p) => {
            const esLocal = p.local_id === id;
            const golesFavor = esLocal ? p.goles_local : p.goles_visitante;
            const golesContra = esLocal ? p.goles_visitante : p.goles_local;
            if (golesFavor === null || golesContra === null) return null;
            const r = golesFavor > golesContra ? "V" : golesFavor < golesContra ? "D" : "E";
            return r;
          }).filter(Boolean);
          if (resultados.length > 0) {
            ultimosResultados = `. Últimos resultados: ${resultados.join(", ")}`;
          }
        }
      }
    } catch {
      // Si falla tabla/partidos, el metadata仍 es útil sin esa data
    }

    const description = `${club.nombre} (${club.apodo}) — ${club.ciudad}, Estadio ${club.estadio}. ${club.titulos_liga} títulos de liga.${posicionInfo}${ultimosResultados} Datos, partidos y estadísticas en ${SITE_NAME}.`;

    return {
      title: `${club.nombre} — ${SITE_NAME}`,
      description,
      openGraph: {
        title: `${club.nombre} | Liga PY`,
        description,
        type: "profile",
        images: club.escudo ? [{ url: club.escudo }] : [],
      },
    };
  } catch {
    return { title: "Club no encontrado" };
  }
}

export default function ClubDetailPage({ params }: Props) {
  return <ClubDetailPageClient />;
}
