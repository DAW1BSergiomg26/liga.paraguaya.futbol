"use client";

import { useQuery } from "@tanstack/react-query";
import { getPartido } from "@/lib/api";
import type { PartidoDetail } from "@/types";
import { useParams } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useEffect, useState } from "react";
import { getSavedToken, setAuthToken, misPredicciones } from "@/lib/api";
import type { PredictionDetail } from "@/types";
import ChatWidget from "@/components/ChatWidget";

export default function PartidoDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);

  useEffect(() => {
    const token = getSavedToken();
    if (token) {
      setAuthToken(token);
      misPredicciones().then((preds) => {
        const found = preds.find((p) => p.partido_id === id);
        if (found) setPrediction(found);
      }).catch(() => {});
    }
  }, [id]);

  const { data: partido, isLoading, error } = useQuery<PartidoDetail>({
    queryKey: ["partido", id],
    queryFn: () => getPartido(id),
  });

  if (isLoading) return <LoadingSpinner text="Cargando partido..." />;

  if (error) return <ErrorMessage message="Error al cargar el partido" />;

  if (!partido) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/partidos" className="text-sm text-[#76e4f7] hover:underline mb-6 inline-block">
          ← Volver a partidos
        </Link>
        <div className="text-center py-16 text-gray-400">
          <p>Partido no encontrado.</p>
        </div>
      </div>
    );
  }

  const tieneResultado =
    partido.goles_local !== null && partido.goles_visitante !== null;

  const estadoLabels: Record<string, string> = {
    finalizado: "Finalizado",
    programado: "Programado",
    en_vivo: "En vivo",
  };
  const estadoStyles: Record<string, string> = {
    finalizado: "bg-green-900/30 text-green-300 border-green-800",
    programado: "bg-blue-900/30 text-blue-300 border-blue-800",
    en_vivo: "bg-red-900/30 text-red-300 border-red-800 animate-pulse",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/partidos" className="text-sm text-[#76e4f7] hover:underline mb-8 inline-block">
        ← Volver a partidos
      </Link>

      <div className="p-8 rounded-2xl border border-white/10 bg-[#0a1628]/80 shadow-xl">
        <div className="text-center mb-6">
          <span className={`inline-block text-sm px-3 py-1 rounded-full border ${estadoStyles[partido.estado] || "bg-gray-800 text-gray-300 border-gray-700"}`}>
            {estadoLabels[partido.estado] || partido.estado}
          </span>
        </div>

        <div className="grid grid-cols-7 items-center gap-4 mb-8">
          <div className="col-span-3 text-right">
            <div className="w-16 h-16 rounded-full bg-white/10 mx-auto mb-3 flex items-center justify-center text-2xl">
              🏟️
            </div>
            <h2 className="text-2xl font-bold text-white">{partido.local_nombre}</h2>
          </div>

          <div className="col-span-1 text-center">
            <div className={`text-4xl font-bold ${tieneResultado ? "text-white" : "text-gray-500"}`}>
              {tieneResultado
                ? `${partido.goles_local} - ${partido.goles_visitante}`
                : "vs"}
            </div>
          </div>

          <div className="col-span-3 text-left">
            <div className="w-16 h-16 rounded-full bg-white/10 mx-auto mb-3 flex items-center justify-center text-2xl">
              🏟️
            </div>
            <h2 className="text-2xl font-bold text-white">{partido.visitante_nombre}</h2>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <span className="text-gray-500 text-sm block">Torneo</span>
              <span className="text-white font-medium">{partido.torneo}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block">Jornada</span>
              <span className="text-white font-medium">{partido.jornada}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block">Fecha</span>
              <span className="text-white font-medium">
                {new Date(partido.fecha).toLocaleDateString("es-PY", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

      {prediction && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-4">🔮 Tu predicción</h2>
          <div className={`p-4 rounded-xl border ${
            prediction.puntos === 3 ? "border-green-500/50 bg-green-900/20" :
            prediction.puntos === 2 ? "border-yellow-500/50 bg-yellow-900/20" :
            prediction.puntos === 0 && prediction.estado === "finalizado" ? "border-red-500/50 bg-red-900/20" :
            "border-white/10 bg-[#0a1628]/60"
          }`}>
            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
              <span>{partido.local_nombre}</span>
              <span className="text-[#76e4f7]">{prediction.goles_local} - {prediction.goles_visitante}</span>
              <span>{prediction.visitante_nombre}</span>
            </div>
            {prediction.puntos > 0 && (
              <p className="text-center mt-2 font-semibold text-green-400">+{prediction.puntos} pts</p>
            )}
          </div>
        </section>
      )}

      {partido && <ChatWidget partidoId={partido.id} />}
      </div>
    </div>
  );
}
