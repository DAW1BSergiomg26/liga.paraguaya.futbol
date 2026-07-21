import type { Metadata } from "next";
import TablaPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Tabla de Posiciones",
  description:
    "Tabla de posiciones actualizada de la Primera División del fútbol paraguayo: puntos, goles, diferencia de goles y estadísticas de todos los clubes.",
};

export default function TablaPage() {
  return <TablaPageClient />;
}
