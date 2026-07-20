"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClubes, getComparacionClubes } from "@/lib/api";
import RadarComparativo from "./RadarComparativo";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function CompararClubes() {
  const [clubA, setClubA] = useState("");
  const [clubB, setClubB] = useState("");

  const { data: clubes, isLoading: clubesLoading } = useQuery({
    queryKey: ["clubes-historial"],
    queryFn: () => getClubes(),
  });

  const {
    data: comparacion,
    isLoading: comparacionLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["comparar", clubA, clubB],
    queryFn: () => getComparacionClubes(clubA, clubB),
    enabled: !!clubA && !!clubB && clubA !== clubB,
    retry: false,
  });

  const clubesSorted = clubes
    ? [...clubes].sort((a, b) => a.nombre.localeCompare(b.nombre))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-sm font-medium text-texto-secundario mb-1">
            Club A
          </label>
          <select
            value={clubA}
            onChange={(e) => setClubA(e.target.value)}
            disabled={clubesLoading}
            className="w-full bg-bg-secundario text-texto-principal border border-borde-sutil rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-apf-rojo"
          >
            <option value="">
              {clubesLoading ? "Cargando clubes..." : "Seleccionar club"}
            </option>
            {clubesSorted.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-sm font-medium text-texto-secundario mb-1">
            Club B
          </label>
          <select
            value={clubB}
            onChange={(e) => setClubB(e.target.value)}
            disabled={clubesLoading}
            className="w-full bg-bg-secundario text-texto-principal border border-borde-sutil rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-apf-azul"
          >
            <option value="">
              {clubesLoading ? "Cargando clubes..." : "Seleccionar club"}
            </option>
            {clubesSorted.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {clubA && clubB && clubA === clubB && (
          <p className="text-sm text-yellow-500">
            Seleccioná dos clubes diferentes para comparar.
          </p>
        )}
      </div>

      {comparacionLoading && <LoadingSpinner />}

      {error && (
        <ErrorMessage
          message="Error al cargar la comparación. Verificá que ambos clubes tengan datos históricos."
          onRetry={() => refetch()}
        />
      )}

      {comparacion && (
        <RadarComparativo clubA={comparacion.club_a} clubB={comparacion.club_b} />
      )}
    </div>
  );
}
