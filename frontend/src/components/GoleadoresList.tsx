"use client";

import { useQuery } from "@tanstack/react-query";
import { getGoleadores } from "@/lib/api";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface Goleador {
  id: string;
  nombre: string;
  club_id: string;
  club_nombre: string;
  goles: number;
  asistencias: number;
}

export default function GoleadoresList({ torneo }: { torneo?: string }) {
  const { data, isLoading, error } = useQuery<{
    goleadores: Goleador[];
  }>({
    queryKey: ["goleadores", torneo],
    queryFn: () => getGoleadores(torneo),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-bg-secundario/60 rounded-lg border border-borde-sutil">
            <div className="flex items-center gap-3">
              <div className="w-8 h-4 bg-white/10 rounded animate-pulse" />
              <div>
                <div className="h-4 bg-white/10 rounded animate-pulse w-32 mb-1" />
                <div className="h-3 bg-white/5 rounded animate-pulse w-24" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-7 w-8 bg-white/10 rounded animate-pulse ml-auto mb-1" />
              <div className="h-3 w-12 bg-white/5 rounded animate-pulse ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-derrota">
        Error al cargar los goleadores
      </div>
    );
  }

  const goleadores = data?.goleadores ?? [];

  if (goleadores.length === 0) {
    return (
      <div className="text-center py-16 text-texto-secundario">
        No hay datos de goleadores disponibles.
      </div>
    );
  }

  const maxGoles = Math.max(...goleadores.map((g) => g.goles), 1);
  const podium = ["text-amber-300", "text-slate-300", "text-orange-400"];

  return (
    <ScrollReveal variant="from-bottom" stagger={0.06} duration={0.5}>
      {goleadores.map((g, i) => (
        <div
          key={g.id}
          className="relative flex items-center justify-between p-3 bg-bg-secundario/40 rounded-lg border border-borde-sutil hover:bg-bg-terciario transition-colors overflow-hidden"
        >
          <div
            className="absolute inset-y-0 left-0 bg-victoria/10"
            style={{ width: `${(g.goles / maxGoles) * 100}%` }}
          />
          <div className="relative flex items-center gap-3">
            <span
              className={`text-lg font-bold w-8 text-center tabular-nums ${
                i < 3 ? podium[i] : "text-texto-terciario"
              }`}
            >
              {i + 1}
            </span>
            <div>
              <p className="font-medium text-texto-principal">{g.nombre}</p>
              <p className="text-sm text-texto-terciario">{g.club_nombre || g.club_id}</p>
            </div>
          </div>
          <div className="relative text-right">
            <p className="text-2xl font-bold text-victoria tabular-nums">{g.goles}</p>
            <p className="text-xs text-texto-terciario">{g.asistencias} asist.</p>
          </div>
        </div>
      ))}
    </ScrollReveal>
  );
}
