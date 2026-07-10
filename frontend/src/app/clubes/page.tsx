"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClubes } from "@/lib/api";
import type { Club } from "@/types";
import { CardSkeleton } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import PageHeader from "@/components/ui/PageHeader";
import ClubCard from "@/components/ui/ClubCard";

export default function ClubesPage() {
  const [ciudad, setCiudad] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const { data: clubes, isLoading, error } = useQuery<Club[]>({
    queryKey: ["clubes", ciudad],
    queryFn: () => getClubes(ciudad || undefined),
    staleTime: 60_000,
  });

  const ciudades = useMemo(() => {
    if (!clubes) return [];
    const set = new Set(clubes.map((c) => c.ciudad));
    return Array.from(set).sort();
  }, [clubes]);

  const filtrados = useMemo(() => {
    if (!clubes) return [];
    if (!busqueda) return clubes;
    const q = busqueda.toLowerCase();
    return clubes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.apodo.toLowerCase().includes(q) ||
        c.ciudad.toLowerCase().includes(q)
    );
  }, [clubes, busqueda]);

  if (isLoading) return <CardSkeleton count={6} />;

  if (error) return <ErrorMessage message="Error al cargar los clubes" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        titulo="Clubes"
        subtitulo={
          clubes
            ? `${clubes.length} clubes afiliados a la APF`
            : "Cargando..."
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar club..."
          className="flex-1 px-4 py-2 rounded-lg border border-borde-sutil bg-bg-secundario/60 text-white text-sm focus:outline-none focus:border-apf-rojo transition"
        />
        <select
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          className="px-4 py-2 rounded-lg border border-borde-sutil bg-bg-secundario/60 text-white text-sm focus:outline-none focus:border-apf-rojo transition"
        >
          <option value="">Todas las ciudades</option>
          {ciudades.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {!filtrados || filtrados.length === 0 ? (
        <div className="text-center py-16 text-texto-secundario">
          <p>No se encontraron clubes con ese filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 justify-items-center">
          {filtrados.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
}
