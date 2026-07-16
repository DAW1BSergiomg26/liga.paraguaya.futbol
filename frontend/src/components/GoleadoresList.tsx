"use client";

import { useQuery } from "@tanstack/react-query";
import { getGoleadores } from "@/lib/api";
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

const PODIUM_STYLES = [
  { ring: "ring-amber-300/60", glow: "shadow-[0_0_30px_-6px_rgba(252,211,77,0.5)]", badge: "🥇", label: "text-amber-300" },
  { ring: "ring-slate-300/50", glow: "shadow-[0_0_24px_-8px_rgba(203,213,225,0.4)]", badge: "🥈", label: "text-slate-300" },
  { ring: "ring-orange-400/50", glow: "shadow-[0_0_24px_-8px_rgba(251,146,60,0.4)]", badge: "🥉", label: "text-orange-400" },
];

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
  const top3 = goleadores.slice(0, 3);
  const resto = goleadores.slice(3);

  return (
    <div className="space-y-6">
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3.map((g, i) => {
            const s = PODIUM_STYLES[i];
            return (
              <div
                key={g.id}
                className={`relative flex flex-col items-center text-center p-5 rounded-2xl bg-bg-secundario/50 border border-borde-sutil ${s.ring} ${s.glow}`}
              >
                <span className="text-3xl mb-1">{s.badge}</span>
                <p className="font-bold text-texto-principal leading-tight">{g.nombre}</p>
                <p className="text-xs text-texto-terciario mt-1">{g.club_nombre || g.club_id}</p>
                <p className={`text-4xl font-black mt-2 tabular-nums ${s.label}`}>
                  <CountUp end={g.goles} />
                </p>
                <p className="text-xs text-texto-terciario">{g.goles === 1 ? "gol" : "goles"}</p>
                <p className="text-[11px] text-texto-apagado mt-1">{g.asistencias} asist.</p>
              </div>
            );
          })}
        </div>
      )}

      {resto.length > 0 && (
        <ScrollReveal variant="from-bottom" stagger={0.05} duration={0.45}>
          <div className="space-y-2">
            {resto.map((g, i) => (
              <div
                key={g.id}
                className="relative flex items-center justify-between p-3 bg-bg-secundario/40 rounded-lg border border-borde-sutil hover:bg-bg-terciario transition-colors overflow-hidden"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-victoria/10"
                  style={{ width: `${(g.goles / maxGoles) * 100}%` }}
                />
                <div className="relative flex items-center gap-3">
                  <span className="text-lg font-bold w-8 text-center tabular-nums text-texto-terciario">
                    {i + 4}
                  </span>
                  <div>
                    <p className="font-medium text-texto-principal">{g.nombre}</p>
                    <p className="text-sm text-texto-terciario">{g.club_nombre || g.club_id}</p>
                  </div>
                </div>
                <div className="relative text-right">
                  <p className="text-2xl font-bold text-victoria tabular-nums">
                    <CountUp end={g.goles} />
                  </p>
                  <p className="text-xs text-texto-terciario">{g.asistencias} asist.</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
