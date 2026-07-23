import type { Metadata } from "next";
import HistorialTransferenciasPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Historial de Transferencias",
  description:
    `Historial completo de transferencias por club de la Primera División del fútbol paraguayo. ${SITE_NAME}.`,
};

export default function HistorialTransferenciasPage() {
  return <HistorialTransferenciasPageClient />;
}
