import type { Metadata } from "next";
import TacticoPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Análisis Táctico",
  description:
    `Análisis táctico de los equipos de la Primera División del fútbol paraguayo: formaciones, estadísticas, tendencias y radar de rendimiento. ${SITE_NAME}.`,
};

export default function TacticoPage() {
  return <TacticoPageClient />;
}
