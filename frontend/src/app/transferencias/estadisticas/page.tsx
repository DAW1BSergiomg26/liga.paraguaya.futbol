import type { Metadata } from "next";
import EstadisticasPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Estadísticas del Mercado",
  description:
    `Análisis estadístico del mercado de transferencias de la Primera División del fútbol paraguayo: montos, duración y tipos de fichajes. ${SITE_NAME}.`,
};

export default function EstadisticasPage() {
  return <EstadisticasPageClient />;
}
