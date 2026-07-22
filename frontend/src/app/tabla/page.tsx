import type { Metadata } from "next";
import TablaPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Tabla de Posiciones",
  description:
    `Tabla de posiciones actualizada de la Primera División del fútbol paraguayo: puntos, goles a favor y en contra, diferencia de goles y estadísticas de todos los clubes. ${SITE_NAME}.`,
};

export default function TablaPage() {
  return <TablaPageClient />;
}
