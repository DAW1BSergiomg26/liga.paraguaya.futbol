import type { Metadata } from "next";
import PartidosPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Partidos",
  description:
    `Calendario y resultados de todos los partidos de la Primera División del fútbol paraguayo: goles, estados, goleadores y estadísticas en tiempo real. ${SITE_NAME}.`,
};

export default function PartidosPage() {
  return <PartidosPageClient />;
}
