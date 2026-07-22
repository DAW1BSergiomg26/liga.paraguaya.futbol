import type { Metadata } from "next";
import PrediccionesPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Predicciones",
  description:
    `Hacé tus predicciones para los partidos de la Primera División del fútbol paraguayo y competí en el leaderboard. ${SITE_NAME}.`,
};

export default function PrediccionesPage() {
  return <PrediccionesPageClient />;
}
