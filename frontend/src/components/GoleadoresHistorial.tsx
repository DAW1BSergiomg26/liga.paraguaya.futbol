"use client";

import { useQuery } from "@tanstack/react-query";
import { getGoleadoresHistorial } from "@/lib/api";
import ScrollReveal from "@/components/ui/ScrollReveal";
import CountUp from "@/components/ui/CountUp";

interface Goleador {
  id: string;
  nombre: string;
  club_id: string;
  club_nombre: string;
  goles: number;
  asistencias: number;
  torneo?: string;
  temporada?: string;
}

export default function GoleadoresHistorial() {
  const { data, isLoading, error } = useQuery<{
    goleadores: Goleador[];
  }>({
    queryKey: ["goleadores-historial"],
    queryFn: () => getGoleadoresHistorial(),
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-derrota">
        Error al cargar el ranking histórico
      </div>
    );
  }

  const goleadores = data?.goleadores ?? [];

  if (goleadores.length === 0) {
    return (
      <div className="text-center py-16 text-texto-secundario">
        Aún no hay datos históricos acumulados.
      </div>
    );
  }

  const maxGoles = Math.max(...goleadores.map((g) => g.goles), 1);

  return (
    <ScrollReveal variant="from-bottom" stagger={0.06} duration={0.5}>
      <div className="space-y-2">
        {goleadores.map((g, i) => (
          <div
            key={g.id}
            className="relative flex items-center justify-between p-3 bg-bg-secundario/40 rounded-lg border border-borde-sutil hover:bg-bg-terciario transition-colors overflow-hidden"
          >
            <div
              className="absolute inset-y-0 left-0 bg-apf-dorado/10"
              style={{ width: `${(g.goles / maxGoles) * 100}%` }}
            />
            <div className="relative flex items-center gap-3">
              <span
                className={`text-lg font-bold w-8 text-center tabular-nums ${
                  i === 0 ? "text-apf-amarillo" : "text-texto-terciario"
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
              <p className="text-2xl font-bold text-apf-amarillo tabular-nums">
                <CountUp end={g.goles} />
              </p>
              <p className="text-[11px] text-texto-apagado">{g.torneo}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollReveal>
  );
}
