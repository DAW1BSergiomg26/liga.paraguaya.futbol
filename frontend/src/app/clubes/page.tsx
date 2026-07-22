import type { Metadata } from "next";
import ClubesPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Clubes",
  description:
    `Todos los clubes de la Primera División del fútbol paraguayo: escudo, ciudad, estadio, capacidad, títulos de liga y datos históricos. ${SITE_NAME}.`,
};

export default function ClubesPage() {
  return <ClubesPageClient />;
}
