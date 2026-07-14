"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Transferencia } from "@/types";
import TransferCard from "@/components/transferencia/TransferCard";

const CLUBES = [
  { id: "olimpia", nombre: "Olimpia" },
  { id: "cerro-porteno", nombre: "Cerro Porteño" },
  { id: "libertad", nombre: "Libertad" },
  { id: "nacional", nombre: "Nacional" },
  { id: "guarani", nombre: "Guaraní" },
  { id: "sol-de-america", nombre: "Sol de América" },
  { id: "sportivo-luqueno", nombre: "Sportivo Luqueño" },
];

export default function HistorialPage() {
  const [clubId, setClubId] = useState("olimpia");
  const { data, isLoading } = useQuery<Transferencia[]>({
    queryKey: ["historial", clubId],
    queryFn: () => apiFetch(`/api/v1/transferencias/historial/${clubId}`),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-texto-principal mb-2">Historial de Transferencias</h1>

      <select
        value={clubId}
        onChange={(e) => setClubId(e.target.value)}
        className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm mb-8"
      >
        {CLUBES.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-bg-secundario rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="text-texto-secundario text-center py-12">Sin transferencias registradas</p>
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
