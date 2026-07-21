import type { Metadata } from "next";
import NoticiasPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Noticias",
  description:
    "Últimas noticias del fútbol paraguayo: transferencias, resultados, análisis táctico y novedades de la Primera División.",
};

export default function NoticiasPage() {
  return <NoticiasPageClient />;
}
