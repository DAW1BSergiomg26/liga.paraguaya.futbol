import type { Metadata } from "next";
import StatusPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Estado del Sistema",
  description:
    `Monitoreo en tiempo real del estado del backend, base de datos, asistente Cerezo y API de ${SITE_NAME}.`,
};

export default function StatusPage() {
  return <StatusPageClient />;
}
