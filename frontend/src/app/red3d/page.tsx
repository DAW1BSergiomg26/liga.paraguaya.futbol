import type { Metadata } from "next";
import Red3dPageClient from "./PageClient";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Red 3D",
  description:
    `Visualización interactiva en 3D de la red de enfrentamientos entre clubes de la Primera División del fútbol paraguayo. ${SITE_NAME}.`,
};

export default function Red3dPage() {
  return <Red3dPageClient />;
}
