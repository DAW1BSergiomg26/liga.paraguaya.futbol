import type { Metadata } from "next";
import ClubDetailPageClient from "./PageClient";
import { getClub } from "@/lib/api";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const club = await getClub(id);
    return {
      title: club.nombre,
      description: `${club.nombre} (${club.apodo}) — ${club.ciudad}, Estadio ${club.estadio}. ${club.titulos_liga} títulos de liga. Datos, partidos y estadísticas.`,
      openGraph: {
        title: `${club.nombre} | Liga PY`,
        description: `${club.nombre} — ${club.ciudad}. Estadio ${club.estadio}. ${club.titulos_liga} títulos de liga.`,
        type: "profile",
      },
    };
  } catch {
    return { title: "Club no encontrado" };
  }
}

export default function ClubDetailPage({ params }: Props) {
  return <ClubDetailPageClient />;
}
