// frontend/src/app/historial/page.tsx
"use client";

import { useState } from "react";
import HistorialTabs from "@/components/historial/HistorialTabs";
import TablaPorAnio from "@/components/historial/TablaPorAnio";
import RankingAgregado from "@/components/historial/RankingAgregado";
import RendimientoClub from "@/components/historial/RendimientoClub";
import CompararClubes from "@/components/historial/CompararClubes";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function HistorialPage() {
  const [tab, setTab] = useState("tablas");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ScrollReveal variant="from-bottom">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-texto-principal">Estadísticas Históricas</h1>
          <p className="text-texto-secundario mt-1">Temporadas 2020–2026 de la Primera División paraguaya</p>
        </div>

        <HistorialTabs active={tab} onChange={setTab} />
      </ScrollReveal>

      <ScrollReveal variant="from-bottom" delay={0.15}>
        {tab === "tablas" && <TablaPorAnio />}
        {tab === "ranking" && <RankingAgregado />}
        {tab === "club" && <RendimientoClub />}
        {tab === "comparar" && <CompararClubes />}
      </ScrollReveal>
    </div>
  );
}
