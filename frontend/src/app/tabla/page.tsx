"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTabla, getTorneos } from "@/lib/api";
import type { TablaRow } from "@/types";
import { TableSkeleton } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Sidebar from "@/components/sidebar/Sidebar";

function Medalla({ pos }: { pos: number }) {
  if (pos === 1) return <span className="mr-1">🥇</span>;
  if (pos === 2) return <span className="mr-1">🥈</span>;
  if (pos === 3) return <span className="mr-1">🥉</span>;
  return null;
}

export default function TablaPage() {
  const [torneo, setTorneo] = useState("Torneo Apertura 2026");

  const { data: torneos } = useQuery<string[]>({
    queryKey: ["torneos"],
    queryFn: () => getTorneos(),
    staleTime: 300_000,
  });

  const { data: filas, isLoading, error } = useQuery<TablaRow[]>({
    queryKey: ["tabla", torneo],
    queryFn: () => getTabla(torneo),
    staleTime: 60_000,
  });

  if (isLoading) return <TableSkeleton rows={12} cols={10} />;

  if (error) return <ErrorMessage message="Error al cargar la tabla de posiciones" />;

  const totalEquipos = filas?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secundario/80 to-bg-primario border border-borde-sutil mb-8 p-8">
        <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
          <path d="M 15.5 190 L 63.8 190 L 83.5 190 L 92.3 181.2 L 103.3 176.8 L 114.3 174.6 L 120.9 170.2 L 125.2 163.7 L 129.6 157.1 L 136.2 148.3 L 142.8 141.7 L 151.6 135.1 L 158.2 130.7 L 164.8 124.1 L 169.1 119.8 L 173.5 113.2 L 180.1 104.4 L 184.5 97.8 L 184.5 91.2 L 180.1 82.4 L 180.1 75.9 L 180.1 69.3 L 180.1 64.9 L 175.7 58.3 L 173.5 53.9 L 169.1 47.3 L 164.8 42.9 L 158.2 36.3 L 151.6 32 L 147.2 25.4 L 142.8 21 L 136.2 16.6 L 129.6 12.2 L 125.2 10 L 120.9 12.2 L 114.3 16.6 L 107.7 18.8 L 103.3 21 L 98.9 25.4 L 92.3 32 L 92.3 38.5 L 85.7 47.3 L 81.3 53.9 L 74.8 60.5 L 70.4 64.9 L 63.8 69.3 L 59.4 75.9 L 55 82.4 L 48.4 86.8 L 48.4 91.2 L 41.8 97.8 L 37.4 104.4 L 33 108.8 L 26.5 113.2 L 26.5 119.8 L 19.9 126.3 L 19.9 135.1 L 19.9 141.7 L 15.5 152.7 L 15.5 163.7 L 15.5 174.6 L 15.5 185.6 L 15.5 190 Z" fill="currentColor" className="text-py-rojo/5" />
        </svg>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold titulo-modulo">Tabla de Posiciones</h1>
          <select
            value={torneo}
            onChange={(e) => setTorneo(e.target.value)}
            className="px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm focus:outline-none focus:border-py-rojo transition-colors duration-200"
          >
            {torneos?.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          {!filas || filas.length === 0 ? (
            <div className="text-center py-16 text-texto-secundario">
              <p>No hay datos disponibles para {torneo}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-borde-sutil">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-terciario border-b border-borde-sutil">
                    <th className="text-left py-3 px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Pos</th>
                    <th className="text-left py-3 px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Club</th>
                    <th className="text-center py-3 px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">PJ</th>
                    <th className="text-center py-3 px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">PG</th>
                    <th className="text-center py-3 px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">PE</th>
                    <th className="text-center py-3 px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">PP</th>
                    <th className="text-center py-3 px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">GF</th>
                    <th className="text-center py-3 px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">GC</th>
                    <th className="text-center py-3 px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">DG</th>
                    <th className="text-center py-3 px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((row, i) => {
                    const esPodio = row.posicion <= 3;
                    const esDescenso = row.posicion > totalEquipos - 2;
                    const bg = i % 2 === 0 ? "bg-bg-secundario/40" : "bg-transparent";

                    let leftBorder = "";
                    let rowBg = bg;
                    if (esPodio) {
                      leftBorder = "border-l-[3px] border-dorado-medalla";
                    } else if (esDescenso) {
                      leftBorder = "border-l-[3px] border-py-rojo-oscuro";
                      rowBg = `${bg} bg-py-rojo/5`;
                    }

                    return (
                      <tr
                        key={row.club_id}
                        className={`${rowBg} ${leftBorder} border-b border-borde-sutil transition-all duration-150 hover:bg-bg-terciario hover:translate-x-0.5`}
                      >
                        <td className={`py-3 px-4 font-bold ${esPodio ? "text-dorado-medalla" : "text-texto-principal"}`}>
                          <Medalla pos={row.posicion} />
                          {row.posicion}
                        </td>
                        <td className="py-3 px-4 font-medium text-texto-principal">
                          <div className="flex items-center gap-3">
                            {row.escudo && (
                              <img
                                src={row.escudo}
                                alt=""
                                className="w-6 h-6 object-contain shrink-0 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                              />
                            )}
                            {row.club}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-texto-principal">{row.pj}</td>
                        <td className="py-3 px-3 text-center text-victoria">{row.pg}</td>
                        <td className="py-3 px-3 text-center text-empate">{row.pe}</td>
                        <td className="py-3 px-3 text-center text-derrota">{row.pp}</td>
                        <td className="py-3 px-3 text-center text-texto-principal">{row.gf}</td>
                        <td className="py-3 px-3 text-center text-texto-principal">{row.gc}</td>
                        <td className={`py-3 px-3 text-center font-semibold ${row.dg > 0 ? "text-victoria" : row.dg < 0 ? "text-derrota" : "text-texto-principal"}`}>
                          {row.dg > 0 ? `+${row.dg}` : row.dg}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-texto-principal text-sm">{row.puntos}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 lg:mt-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
