"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { misPredicciones, getLeaderboard, getSavedToken, setAuthToken } from "@/lib/api";
import type { PredictionDetail, LeaderboardEntry } from "@/types";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

export default function PrediccionesPage() {
  const [loggedIn] = useState(() => {
    try { return !!getSavedToken(); } catch { return false; }
  });

  useEffect(() => {
    const token = getSavedToken();
    if (token) setAuthToken(token);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        titulo="Predicciones"
        subtitulo="Anotá tu resultado y competí en el leaderboard"
      />

      {/* Mis predicciones (requiere sesión) */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Mis Predicciones</h2>
        {!loggedIn ? (
          <div className="p-8 rounded-xl border border-borde-sutil bg-bg-secundario/60 text-center">
            <p className="text-texto-secundario mb-4">Iniciá sesión para ver y crear tus predicciones</p>
            <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-apf-rojo text-black font-semibold">
              Iniciar sesión
            </Link>
          </div>
        ) : error ? (
          <div className="p-8 rounded-xl border border-borde-sutil bg-bg-secundario/60 text-center">
            <p className="text-texto-secundario mb-4">Sesión expirada. Iniciá sesión de nuevo</p>
            <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-apf-rojo text-black font-semibold">
              Iniciar sesión
            </Link>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (!predicciones || predicciones.length === 0) ? (
          <div className="p-8 rounded-xl border border-borde-sutil bg-bg-secundario/60 text-center">
            <p className="text-texto-secundario">Todavía no hiciste predicciones.</p>
            <Link href="/partidos" className="text-apf-rojo hover:underline mt-2 inline-block">
              Ir a partidos →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {predicciones.map((p) => (
              <Link key={p.id} href={`/partidos/${p.partido_id}`}
                className="block p-4 rounded-xl border border-borde-sutil bg-bg-secundario/60 hover:bg-bg-secundario transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-texto-secundario">{p.torneo} · J{p.jornada}</p>
                    <p className="text-white font-medium mt-1">
                      {p.local_nombre} {p.goles_local}-{p.goles_visitante} {p.visitante_nombre}
                    </p>
                  </div>
                  <div className="text-right">
                    {p.estado === "finalizado" ? (
                      <span className={`text-sm font-bold ${p.puntos === 3 ? "text-green-400" : p.puntos === 2 ? "text-yellow-400" : "text-texto-apagado"}`}>
                        +{p.puntos} pts
                      </span>
                    ) : (
                      <span className="text-xs text-texto-apagado">Pendiente</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Leaderboard público (siempre visible) */}
      <section>
        <h2 className="text-2xl font-bold mb-4">🏆 Leaderboard</h2>
        {leaderboard && leaderboard.length > 0 ? (
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
                    <td className="p-4 text-center font-bold text-apf-rojo">{entry.puntos}</td>
                    <td className="p-4 text-center text-green-400">{entry.aciertos}</td>
                    <td className="p-4 text-center text-texto-secundario">{entry.predicciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-borde-sutil bg-bg-secundario/60 text-center">
            <p className="text-texto-apagado">Todavía no hay participantes. ¡Hacé tu primera predicción!</p>
            <Link href="/partidos" className="text-apf-rojo hover:underline mt-2 inline-block">
              Ver partidos →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
