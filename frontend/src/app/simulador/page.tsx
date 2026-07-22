import type { Metadata } from "next";
import SimuladorPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Simulador",
  description:
    `Simulá el resultado de un partido de la Primera División del fútbol paraguayo con nuestro simulador basado en estadísticas históricas. ${SITE_NAME}.`,
};

export default function SimuladorPage() {
  return <SimuladorPageClient />;
}
