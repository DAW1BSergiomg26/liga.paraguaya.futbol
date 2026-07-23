import type { Metadata } from "next";
import LeaderboardPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    `Clasificación de predictores del fútbol paraguayo: ranking de usuarios con más aciertos en predicciones de partidos. ${SITE_NAME}.`,
};

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}
