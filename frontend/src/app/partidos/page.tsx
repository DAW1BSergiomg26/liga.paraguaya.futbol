import type { Metadata } from "next";
import PartidosPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Partidos",
  description:
    "Calendario y resultados de todos los partidos de la Primera División del fútbol paraguayo: goles, estados y estadísticas en tiempo real.",
};

export default function PartidosPage() {
  return <PartidosPageClient />;
}
