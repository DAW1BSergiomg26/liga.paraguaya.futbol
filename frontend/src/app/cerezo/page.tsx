import type { Metadata } from "next";
import CerezoPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Cerezo Digital",
  description:
    `Asistente inteligente del fútbol paraguayo: preguntá sobre clubes, partidos, la tabla de posiciones, goleadores y pedí predicciones. ${SITE_NAME}.`,
};

export default function CerezoPage() {
  return <CerezoPageClient />;
}
