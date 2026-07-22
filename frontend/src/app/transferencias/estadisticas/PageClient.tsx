"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { EstadisticasTransferencias } from "@/types";
import EstadisticasDashboard from "@/components/transferencia/EstadisticasDashboard";

export default function EstadisticasPage() {
  const { data: stats, isLoading } = useQuery<EstadisticasTransferencias>({
    queryKey: ["estadisticas-transferencias"],
    queryFn: () => apiFetch("/api/v1/transferencias/estadisticas"),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-texto-principal mb-2">Estadísticas del Mercado</h1>
      <p className="text-texto-secundario mb-8">Análisis de transferencias de la temporada</p>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-bg-secundario rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <EstadisticasDashboard stats={stats} />
      ) : (
        <p className="text-texto-secundario text-center py-12">Sin datos disponibles</p>
      )}
    </div>
  );
}
