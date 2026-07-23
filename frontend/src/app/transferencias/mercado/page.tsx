import type { Metadata } from "next";
import MercadoPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Mercado de Pases",
  description:
    `Fichajes de los últimos 30 días del fútbol paraguayo: transferencias recientes de la Primera División. ${SITE_NAME}.`,
};

export default function MercadoPage() {
  return <MercadoPageClient />;
}
