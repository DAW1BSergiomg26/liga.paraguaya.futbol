import type { Metadata } from "next";
import LeaderboardPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Clasificación de predictores del fútbol paraguayo: ranking de usuarios con más aciertos en predicciones de partidos.",
};

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}
