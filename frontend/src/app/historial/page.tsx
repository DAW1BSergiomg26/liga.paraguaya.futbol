import type { Metadata } from "next";
import HistorialPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Historial",
  description:
    "Historial completo del fútbol paraguayo: campeones por temporada, ranking histórico de clubes y rendimiento por año.",
};

export default function HistorialPage() {
  return <HistorialPageClient />;
}
