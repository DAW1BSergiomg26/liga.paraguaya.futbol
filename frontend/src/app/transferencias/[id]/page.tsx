import type { Metadata } from "next";
import TransferenciaDetailPageClient from "./PageClient";
import { apiFetch } from "@/lib/api";
import type { Transferencia } from "@/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const t = await apiFetch<Transferencia>(`/api/v1/transferencias/${id}`);
    const origen = t.club_origen_nombre || "Libre";
    const destino = t.club_destino_nombre || "Libre";
    return {
      title: `${t.jugador_nombre}: ${origen} → ${destino}`,
      description: `${t.jugador_nombre} (${t.jugador_posicion || "Jugador"}) — ${origen} a ${destino}. Estado: ${t.estado}.`,
      openGraph: {
        title: `${t.jugador_nombre}: ${origen} → ${destino} | Liga PY`,
        description: `Transferencia: ${origen} → ${destino}. ${t.estado}.`,
        type: "article",
      },
    };
  } catch {
    return { title: "Transferencia no encontrada" };
  }
}

export default function TransferenciaDetailPage({ params }: Props) {
  return <TransferenciaDetailPageClient />;
}
