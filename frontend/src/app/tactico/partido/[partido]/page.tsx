import type { Metadata } from "next";
import PartidoTacticoPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Análisis Táctico del Partido",
  description:
    "Análisis táctico comparativo de un partido de la Primera División del fútbol paraguayo: formaciones, estadísticas y predicción IA.",
};

export default function PartidoTacticoPage() {
  return <PartidoTacticoPageClient />;
}
