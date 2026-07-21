import type { Metadata } from "next";
import NoticiasPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Noticias",
  description:
    `Últimas noticias del fútbol paraguayo: transferencias, resultados, análisis táctico y novedades de la Primera División. ${SITE_NAME}.`,
};

export default function NoticiasPage() {
  return <NoticiasPageClient />;
}
