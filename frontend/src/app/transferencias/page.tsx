import type { Metadata } from "next";
import TransferenciasPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Transferencias",
  description:
    `Todas las transferencias del fútbol paraguayo: fichajes confirmados, rumores, cesiones y movimientos de la Primera División. ${SITE_NAME}.`,
};

export default function TransferenciasPage() {
  return <TransferenciasPageClient />;
}
