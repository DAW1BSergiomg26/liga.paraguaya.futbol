import type { Metadata } from "next";
import TransferenciasPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Transferencias",
  description:
    "Todas las transferencias del fútbol paraguayo: fichajes confirmados, rumores, cesiones y movimientos de la Primera División.",
};

export default function TransferenciasPage() {
  return <TransferenciasPageClient />;
}
