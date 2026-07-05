"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { misPredicciones, getLeaderboard, getSavedToken, setAuthToken } from "@/lib/api";
import type { PredictionDetail, LeaderboardEntry } from "@/types";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function PrediccionesPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = getSavedToken();
    if (token) {
      setAuthToken(token);
      setLoggedIn(true);
    }
  }, []);

  const { data: predicciones, isLoading, error } = useQuery<PredictionDetail[]>({
    queryKey: ["predicciones"],
    queryFn: () => misPredicciones(),
    enabled: loggedIn,
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
  });

  if (!loggedIn) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Mis Predicciones</h1>
        <div className="p-8 rounded-xl border border-white/10 bg-[#0a1628]/60">
          <p className="text-gray-400 mb-4">Iniciá sesión para ver tus predicciones</p>
          <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-[#76e4f7] text-black font-semibold">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner text="Cargando predicciones..." />;
  if (error) return <ErrorMessage message="Error al cargar predicciones" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mis Predicciones</h1>

      {(!predicciones || predicciones.length === 0) ? (
        <div className="p-8 rounded-xl border border-white/10 bg-[#0a1628]/60 text-center mb-8">
          <p className="text-gray-400">Todavía no hiciste predicciones.</p>
          <Link href="/partidos" className="text-[#76e4f7] hover:underline mt-2 inline-block">
            Ir a partidos →
          </Link>
        </div>
      ) : (
        <div className="space-y-3 mb-12">
          {predicciones.map((p) => (
            <Link key={p.id} href={`/partidos/${p.partido_id}`}
              className="block p-4 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{p.torneo} · J{p.jornada}</p>
                  <p className="text-white font-medium mt-1">
                    {p.local_nombre} {p.goles_local}-{p.goles_visitante} {p.visitante_nombre}
                  </p>
                </div>
                <div className="text-right">
                  {p.estado === "finalizado" ? (
                    <span className={`text-sm font-bold ${p.puntos === 3 ? "text-green-400" : p.puntos === 2 ? "text-yellow-400" : "text-gray-500"}`}>
                      +{p.puntos} pts
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Pendiente</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <h2 className="text-2xl font-bold mb-4">🏆 Leaderboard</h2>
      {leaderboard && leaderboard.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a1628]/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
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
                        <img src={entry.image} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <span className="text-white font-medium">{entry.name}</span>
                      <span className="text-gray-500 text-xs">@{entry.username}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-[#76e4f7]">{entry.puntos}</td>
                  <td className="p-4 text-center text-green-400">{entry.aciertos}</td>
                  <td className="p-4 text-center text-gray-400">{entry.predicciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-white/10 bg-[#0a1628]/60 text-center">
          <p className="text-gray-500">Todavía no hay participantes.</p>
        </div>
      )}
    </div>
  );
}
