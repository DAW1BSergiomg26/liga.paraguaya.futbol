import type { Metadata } from "next";
import GoleadoresPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Goleadores",
  description:
    "Máximos goleadores del fútbol paraguayo: ranking por torneo y ranking histórico de la Primera División.",
};

export default function GoleadoresPage() {
  return <GoleadoresPageClient />;
}
