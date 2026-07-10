"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

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
      <h1 className="text-3xl font-bold mb-8">🏆 Leaderboard</h1>

      {!leaderboard || leaderboard.length === 0 ? (
        <div className="p-8 rounded-xl border border-borde-sutil bg-bg-secundario/60 text-center">
          <p className="text-texto-apagado">Todavía no hay participantes.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-borde-sutil bg-bg-secundario/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borde-sutil text-texto-secundario uppercase text-xs">
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Usuario</th>
                <th className="p-4 text-center">Pts</th>
                <th className="p-4 text-center">Aciertos</th>
                <th className="p-4 text-center">Predicciones</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr key={entry.username} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 font-bold">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {entry.image && (
                        <img src={entry.image} alt="" loading="lazy" className="w-8 h-8 rounded-full" />
                      )}
                      <span className="text-white font-medium">{entry.name}</span>
                      <span className="text-texto-apagado text-xs">@{entry.username}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-py-rojo">{entry.puntos}</td>
                  <td className="p-4 text-center text-green-400">{entry.aciertos}</td>
                  <td className="p-4 text-center text-texto-secundario">{entry.predicciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
