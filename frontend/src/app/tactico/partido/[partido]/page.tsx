import type { Metadata } from "next";
import PartidoTacticoPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Análisis Táctico del Partido",
  description:
    `Análisis táctico comparativo de un partido de la Primera División del fútbol paraguayo: formaciones, estadísticas, radar de rendimiento y predicción IA. ${SITE_NAME}.`,
};

export default function PartidoTacticoPage() {
  return <PartidoTacticoPageClient />;
}
