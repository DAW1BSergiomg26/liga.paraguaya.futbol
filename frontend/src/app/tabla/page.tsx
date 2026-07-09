"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTabla, getTorneos } from "@/lib/api";
import type { TablaRow } from "@/types";
import { TableSkeleton } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
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
  );
}
