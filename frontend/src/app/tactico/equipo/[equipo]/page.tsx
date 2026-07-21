import type { Metadata } from "next";
import EquipoTacticoPageClient from "./PageClient";
import { getTacticoEquipo } from "@/lib/api";

type Props = { params: Promise<{ equipo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { equipo } = await params;
  try {
    const data = await getTacticoEquipo(equipo);
    return {
      title: `Análisis Táctico: ${data.nombre}`,
      description: `Análisis táctico de ${data.nombre}: formación principal ${data.formacion_principal}, estadísticas y tendencias.`,
      openGraph: {
        title: `${data.nombre} — Análisis Táctico | Liga PY`,
        description: `Formación ${data.formacion_principal}. Estadísticas y tendencias del equipo.`,
        type: "article",
      },
    };
  } catch {
    return { title: "Equipo no encontrado" };
  }
}

export default function EquipoTacticoPage({ params }: Props) {
  return <EquipoTacticoPageClient />;
}
