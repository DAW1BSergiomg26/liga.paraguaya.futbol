import type { Metadata } from "next";
import PrediccionesPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Predicciones",
  description:
    "Hacé tus predicciones para los partidos de la Primera División del fútbol paraguayo y competí en el leaderboard.",
};

export default function PrediccionesPage() {
  return <PrediccionesPageClient />;
}
