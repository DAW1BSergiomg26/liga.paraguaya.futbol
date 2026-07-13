"use client";

import StatCard from "./StatCard";
import type { EstadisticasEquipo } from "@/types";

interface StatsPanelProps {
  stats: EstadisticasEquipo;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <StatCard label="xG" value={stats.xg.toFixed(2)} color="text-py-rojo" />
      <StatCard label="Posesion" value={`${stats.posesion}%`} showBar maxValue={100} />
      <StatCard label="Tiros a puerta" value={stats.tiros_puerta} color="text-py-azul" />
      <StatCard label="Pases completados" value={`${stats.pases_completados}%`} showBar maxValue={100} />
      <StatCard label="Duelos ganados" value={`${stats.duelos_ganados}%`} showBar maxValue={100} />
      <StatCard label="Corners" value={stats.corners} color="text-empate" />
    </div>
  );
}
