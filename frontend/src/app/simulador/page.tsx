import type { Metadata } from "next";
import SimuladorPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Simulador",
  description:
    "Simulá el resultado de un partido de la Primera División del fútbol paraguayo con nuestro simulador basado en estadísticas.",
};

export default function SimuladorPage() {
  return <SimuladorPageClient />;
}
