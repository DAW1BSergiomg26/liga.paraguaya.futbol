"use client";

import { useQuery } from "@tanstack/react-query";
import { getPartidos, getClubes } from "@/lib/api";
import type { Partido, PartidoPage, Club } from "@/types";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useState, useEffect, useMemo } from "react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import PageHeader from "@/components/ui/PageHeader";
import { getSavedToken, setAuthToken } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import PredictionModal from "@/components/PredictionModal";
import { useLiveScores } from "@/hooks/useLiveScores";

function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    finalizado: "bg-green-900/30 text-green-300",
    programado: "bg-blue-900/30 text-blue-300",
    en_vivo: "bg-red-900/30 text-red-300 animate-pulse",
  };
  const labels: Record<string, string> = {
    finalizado: "Finalizado",
    programado: "Programado",
    en_vivo: "En vivo",
  };
  const cls = styles[estado] || "bg-gray-800 text-texto-secundario";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {labels[estado] || estado}
    </span>
  );
}

function PartidosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const torneo = searchParams.get("torneo") || "";
  const estado = searchParams.get("estado") || "";

  const { data: partidosPage, isLoading, error } = useQuery<PartidoPage>({
    queryKey: ["partidos", torneo, estado],
    queryFn: () => getPartidos(torneo || undefined, estado || undefined),
    refetchInterval: 30000,
  });
  const partidos = partidosPage?.data;

  const sorted = useMemo(() => {
    if (!partidos) return [];
    const order: Record<string, number> = { en_vivo: 0, programado: 1, finalizado: 2 };
    return [...partidos].sort(
      (a, b) => (order[a.estado] ?? 9) - (order[b.estado] ?? 9)
    );
  }, [partidos]);

  const { data: clubes } = useQuery<Club[]>({
    queryKey: ["clubes"],
    queryFn: () => getClubes(),
  });

  const clubMap = new Map<string, string>();
  if (clubes) {
    clubes.forEach((c) => clubMap.set(c.id, c.nombre));
  }

  const queryClient = useQueryClient();
  const [userToken] = useState<string | null>(() => {
    try { return getSavedToken(); } catch { return null; }
  });
  const [predictionPartido, setPredictionPartido] = useState<Partido | null>(null);

  useEffect(() => {
    const token = getSavedToken();
    if (token) setAuthToken(token);
  }, []);

  const liveScores = useLiveScores();

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/partidos${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [searchParams, router]
  );

  if (isLoading) return <TableSkeleton rows={8} cols={7} />;

  if (error) return <ErrorMessage message="Error al cargar los partidos" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        titulo="Partidos"
        subtitulo={partidos ? `${partidos.length} partidos` : "Calendario"}
      />

      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="text-sm text-texto-secundario block mb-1">Torneo</label>
          <input
            type="text"
            value={torneo}
            onChange={(e) => setFilter("torneo", e.target.value)}
            placeholder="Filtrar por torneo..."
            className="px-3 py-2 rounded-lg border border-borde-sutil bg-bg-secundario/60 text-white text-sm focus:outline-none focus:border-apf-rojo"
          />
        </div>
        <div>
          <label className="text-sm text-texto-secundario block mb-1">Estado</label>
          <select
            value={estado}
            onChange={(e) => setFilter("estado", e.target.value)}
            className="px-3 py-2 rounded-lg border border-borde-sutil bg-bg-secundario/60 text-white text-sm focus:outline-none focus:border-apf-rojo"
          >
            <option value="">Todos</option>
            <option value="programado">Programado</option>
            <option value="en_vivo">En vivo</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>
      </div>

      {!partidos || partidos.length === 0 ? (
        <div className="text-center py-16 text-texto-secundario">
          <p>No hay partidos registrados actualmente.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borde-sutil text-texto-secundario uppercase tracking-wide text-xs">
                <th className="text-left py-3 px-2">Fecha</th>
                <th className="text-left py-3 px-2">Local</th>
                <th className="text-center py-3 px-2">Resultado</th>
                <th className="text-left py-3 px-2">Visitante</th>
                <th className="text-center py-3 px-2">Estado</th>
                <th className="text-center py-3 px-2 hidden sm:table-cell">Pronóstico</th>
                <th className="text-center py-3 px-2 hidden md:table-cell">Jornada</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const localNombre = clubMap.get(p.local_id) || p.local_id;
                const visitanteNombre = clubMap.get(p.visitante_id) || p.visitante_id;
                const tieneResultado =
                  p.goles_local !== null && p.goles_visitante !== null;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="py-3 px-2 text-texto-secundario">
                      {new Date(p.fecha).toLocaleDateString("es-PY")}
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        href={`/partidos/${p.id}`}
                        className="text-white font-medium hover:text-apf-rojo transition"
                      >
                        {localNombre}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Link
                        href={`/partidos/${p.id}`}
                        className="text-white font-bold hover:text-apf-rojo transition"
                      >
                        {p.estado === "en_vivo" && liveScores[p.id]
                          ? `${liveScores[p.id].goles_local ?? p.goles_local ?? "?"} - ${liveScores[p.id].goles_visitante ?? p.goles_visitante ?? "?"}`
                          : tieneResultado
                            ? `${p.goles_local} - ${p.goles_visitante}`
                            : "vs"}
                      </Link>
                      {p.estado === "en_vivo" && liveScores[p.id] && liveScores[p.id].minuto > 0 && (
                        <div className="text-xs text-red-400 mt-0.5">
                          {liveScores[p.id].minuto}'
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        href={`/partidos/${p.id}`}
                        className="text-white font-medium hover:text-apf-rojo transition"
                      >
                        {visitanteNombre}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <EstadoBadge estado={p.estado} />
                    </td>
                    <td className="py-3 px-2 text-center hidden sm:table-cell">
                      {userToken && p.estado === "programado" && (
                        <button
                          onClick={() => setPredictionPartido(p)}
                          className="text-xs px-2 py-1 rounded-lg bg-bg-terciario border border-borde-sutil text-apf-rojo hover:bg-apf-rojo hover:text-black transition"
                        >
                          🔮 Predecir
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center text-texto-secundario hidden md:table-cell">
                      {p.jornada}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {predictionPartido && (
        <PredictionModal
          partido={predictionPartido}
          clubLocal={clubMap.get(predictionPartido.local_id) || predictionPartido.local_id}
          clubVisitante={clubMap.get(predictionPartido.visitante_id) || predictionPartido.visitante_id}
          onClose={() => setPredictionPartido(null)}
          onSuccess={() => {
            setPredictionPartido(null);
            queryClient.invalidateQueries({ queryKey: ["predicciones"] });
          }}
        />
      )}
    </div>
  );
}

export default function PartidosPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={7} />}>
      <PartidosContent />
    </Suspense>
  );
}
