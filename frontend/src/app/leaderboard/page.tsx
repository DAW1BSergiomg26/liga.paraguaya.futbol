"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import PageHeader from "@/components/ui/PageHeader";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading, error } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingSpinner text="Cargando leaderboard..." />;
  if (error) return <ErrorMessage message="Error al cargar leaderboard" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        titulo="Leaderboard"
        subtitulo="Ranking de pronosticadores"
      />

      {!leaderboard || leaderboard.length === 0 ? (
        <div className="p-8 rounded-xl border border-borde-sutil bg-bg-secundario/60 text-center">
          <p className="text-texto-apagado">Todavía no hay participantes.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-borde-sutil bg-bg-secundario/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borde-sutil text-texto-secundario uppercase text-xs">
                <th className="p-3 sm:p-4 text-left">#</th>
                <th className="p-3 sm:p-4 text-left">Usuario</th>
                <th className="p-3 sm:p-4 text-center">Pts</th>
                <th className="p-3 sm:p-4 text-center">Aciertos</th>
                <th className="p-3 sm:p-4 text-center hidden sm:table-cell">Predicciones</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr
                  key={entry.username}
                  className="border-b border-white/5 hover:bg-bg-terciario transition"
                >
                  <td className="p-3 sm:p-4 font-bold">
                    {i === 0 ? (
                      <span className="text-apf-amarillo">🥇 1</span>
                    ) : i === 1 ? (
                      <span className="text-texto-secundario">🥈 2</span>
                    ) : i === 2 ? (
                      <span className="text-apf-rojo">🥉 3</span>
                    ) : (
                      <span className="text-texto-apagado">{i + 1}</span>
                    )}
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      {entry.image && (
                        <img
                          src={entry.image}
                          alt=""
                          loading="lazy"
                          className="w-8 h-8 rounded-full ring-1 ring-borde-sutil"
                        />
                      )}
                      <span className="text-white font-medium">{entry.name}</span>
                      <span className="text-texto-apagado text-xs hidden sm:inline">
                        @{entry.username}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-apf-rojo">
                    {entry.puntos}
                  </td>
                  <td className="p-3 sm:p-4 text-center text-victoria">
                    {entry.aciertos}
                  </td>
                  <td className="p-3 sm:p-4 text-center text-texto-secundario hidden sm:table-cell">
                    {entry.predicciones}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
