import type { Metadata } from "next";
import GoleadoresPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Goleadores",
  description:
    `Máximos goleadores de la Primera División del fútbol paraguayo: ranking por torneo y clasificación histórica. Datos actualizados de ${SITE_NAME}.`,
};

export default function GoleadoresPage() {
  return <GoleadoresPageClient />;
}
