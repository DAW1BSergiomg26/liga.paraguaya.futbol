"use client";

import { useQuery } from "@tanstack/react-query";
import { getTabla } from "@/lib/api";
import type { TablaRow } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

function Medalla({ pos }: { pos: number }) {
  if (pos === 1) return <span className="mr-1">🥇</span>;
  if (pos === 2) return <span className="mr-1">🥈</span>;
  if (pos === 3) return <span className="mr-1">🥉</span>;
  return null;
}

export default function TablaPage() {
  const { data: filas, isLoading, error } = useQuery<TablaRow[]>({
    queryKey: ["tabla"],
    queryFn: () => getTabla(),
  });

  if (isLoading) return <LoadingSpinner text="Cargando tabla de posiciones..." />;

  if (error) return <ErrorMessage message="Error al cargar la tabla de posiciones" />;

  if (!filas || filas.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Tabla de Posiciones - Apertura 2026</h1>
        <div className="text-center py-16 text-gray-400">
          <p>No hay datos disponibles para la tabla de posiciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Tabla de Posiciones - Apertura 2026</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0a1628] border-b border-white/10">
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Pos</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Club</th>
              <th className="text-center py-3 px-3 font-semibold text-gray-300">PJ</th>
              <th className="text-center py-3 px-3 font-semibold text-gray-300">PG</th>
              <th className="text-center py-3 px-3 font-semibold text-gray-300">PE</th>
              <th className="text-center py-3 px-3 font-semibold text-gray-300">PP</th>
              <th className="text-center py-3 px-3 font-semibold text-gray-300">GF</th>
              <th className="text-center py-3 px-3 font-semibold text-gray-300">GC</th>
              <th className="text-center py-3 px-3 font-semibold text-gray-300">DG</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-300">Pts</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((row, i) => {
              const esCopa = row.posicion <= 4;
              const bg = i % 2 === 0 ? "bg-[#0d1e30]/40" : "bg-[#0a1628]/60";
              return (
                <tr
                  key={row.club_id}
                  className={`${bg} ${esCopa ? "bg-opacity-80" : ""} border-b border-white/5 transition hover:bg-[#112240]/50`}
                >
                  <td className={`py-3 px-4 font-bold ${esCopa ? "text-[#76e4f7]" : "text-gray-300"}`}>
                    <Medalla pos={row.posicion} />
                    {row.posicion}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">
                    <div className="flex items-center gap-3">
                      {row.escudo && (
                        <img src={row.escudo} alt="" className="w-6 h-6 object-contain shrink-0" />
                      )}
                      {row.club}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-300">{row.pj}</td>
                  <td className="py-3 px-3 text-center text-green-400">{row.pg}</td>
                  <td className="py-3 px-3 text-center text-yellow-400">{row.pe}</td>
                  <td className="py-3 px-3 text-center text-red-400">{row.pp}</td>
                  <td className="py-3 px-3 text-center text-gray-300">{row.gf}</td>
                  <td className="py-3 px-3 text-center text-gray-300">{row.gc}</td>
                  <td className={`py-3 px-3 text-center font-semibold ${row.dg > 0 ? "text-green-400" : row.dg < 0 ? "text-red-400" : "text-gray-300"}`}>
                    {row.dg > 0 ? `+${row.dg}` : row.dg}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-white">{row.puntos}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
