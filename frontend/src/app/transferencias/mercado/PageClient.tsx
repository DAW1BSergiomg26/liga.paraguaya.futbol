"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Transferencia } from "@/types";
import TransferCard from "@/components/transferencia/TransferCard";

export default function MercadoPage() {
  const { data, isLoading } = useQuery<Transferencia[]>({
    queryKey: ["mercado"],
    queryFn: () => apiFetch("/api/v1/transferencias/mercado?dias=30"),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-texto-principal mb-2">Mercado de Pases</h1>
      <p className="text-texto-secundario mb-8">Fichajes de los últimos 30 días</p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-bg-secundario rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="text-texto-secundario text-center py-12">No hay fichajes recientes</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((t) => (
            <TransferCard key={t.id} transferencia={t} />
          ))}
        </div>
      )}
    </div>
  );
}
