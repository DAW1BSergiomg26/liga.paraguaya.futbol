import type { Metadata } from "next";
import HistorialPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Historial",
  description:
    `Historial completo del fútbol paraguayo: campeones por temporada, ranking histórico de clubes y rendimiento por año. ${SITE_NAME}.`,
};

export default function HistorialPage() {
  return <HistorialPageClient />;
}
