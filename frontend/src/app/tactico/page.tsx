import type { Metadata } from "next";
import TacticoPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Análisis Táctico",
  description:
    "Análisis táctico de los equipos de la Primera División del fútbol paraguayo: formaciones, estadísticas e insights.",
};

export default function TacticoPage() {
  return <TacticoPageClient />;
}
