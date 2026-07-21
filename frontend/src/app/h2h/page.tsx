import type { Metadata } from "next";
import H2HPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Historial Head-to-Head",
  description:
    `Compará el historial de enfrentamientos entre dos clubes de la Primera División del fútbol paraguayo: goles, victorias y empates. ${SITE_NAME}.`,
};

export default function H2HPage() {
  return <H2HPageClient />;
}
