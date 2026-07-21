import type { Metadata } from "next";
import ClubesPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Clubes",
  description:
    "Todos los clubes de la Primera División del fútbol paraguayo: escudo, ciudad, estadio, capacidad, títulos de liga y datos históricos.",
};

export default function ClubesPage() {
  return <ClubesPageClient />;
}
