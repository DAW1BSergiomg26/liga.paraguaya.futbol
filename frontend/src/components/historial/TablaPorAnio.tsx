// frontend/src/components/historial/TablaPorAnio.tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTabla, getTorneos } from "@/lib/api";
import type { TablaRow } from "@/types";
import ScrollReveal from "@/components/ui/ScrollReveal";

function anoDeTorneo(t: string): number {
  const m = t.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : 0;
}

export default function TablaPorAnio() {
  const { data: torneos } = useQuery<string[]>({
    queryKey: ["torneos-historial"],
    queryFn: () => getTorneos(),
    staleTime: 300_000,
  });

  const anos = useMemo(() => {
    if (!torneos) return [];
    return Array.from(new Set(torneos.map(anoDeTorneo))).sort((a, b) => b - a);
  }, [torneos]);

  const [ano, setAno] = useState<number | "">("");
  const [torneo, setTorneo] = useState("");

  const torneosDelAno = useMemo(() => {
    if (ano === "") return [];
    return (torneos || []).filter((t) => anoDeTorneo(t) === ano);
  }, [torneos, ano]);

  // Al cambiar de año, resetear torneo
  function seleccionarAno(a: number) {
    setAno(a);
    setTorneo("");
  }

  const { data: filas, isLoading } = useQuery<TablaRow[]>({
    queryKey: ["tabla-historial", torneo],
    queryFn: () => getTabla(torneo),
    enabled: torneo !== "",
    staleTime: 300_000,
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm"
          value={ano}
          onChange={(e) => seleccionarAno(Number(e.target.value))}
        >
          <option value="">Seleccioná un año</option>
          {anos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm disabled:opacity-50"
          value={torneo}
          disabled={ano === ""}
          onChange={(e) => setTorneo(e.target.value)}
        >
          <option value="">Seleccioná un torneo</option>
          {torneosDelAno.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {torneo === "" ? (
        <p className="text-texto-secundario text-center py-12">Elegí un año y torneo para ver la tabla final.</p>
      ) : isLoading ? (
        <div className="h-64 bg-bg-secundario rounded-xl animate-pulse" />
      ) : !filas || filas.length === 0 ? (
        <p className="text-texto-secundario text-center py-12">Sin datos para este torneo.</p>
      ) : (
        <ScrollReveal variant="from-bottom" stagger={0.03}>
          <div className="overflow-x-auto bg-bg-secundario border border-borde-sutil rounded-xl">
            <table className="w-full text-sm text-texto-principal">
              <thead className="text-texto-secundario">
                <tr className="border-b border-borde-sutil">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Club</th>
                  <th className="px-2 py-2">PJ</th>
                  <th className="px-2 py-2">PG</th>
                  <th className="px-2 py-2">PE</th>
                  <th className="px-2 py-2">PP</th>
                  <th className="px-2 py-2">GF</th>
                  <th className="px-2 py-2">GC</th>
                  <th className="px-2 py-2">DG</th>
                  <th className="px-2 py-2">PTS</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.club_id} className="border-b border-borde-sutil/50">
                    <td className="px-3 py-2">{f.posicion}</td>
                    <td className="px-3 py-2 font-medium flex items-center gap-2">
                      {f.escudo ? (
                        <img src={f.escudo} alt="" className="w-5 h-5 object-contain" />
                      ) : null}
                      {f.club}
                    </td>
                    <td className="px-2 py-2 text-center">{f.pj}</td>
                    <td className="px-2 py-2 text-center">{f.pg}</td>
                    <td className="px-2 py-2 text-center">{f.pe}</td>
                    <td className="px-2 py-2 text-center">{f.pp}</td>
                    <td className="px-2 py-2 text-center">{f.gf}</td>
                    <td className="px-2 py-2 text-center">{f.gc}</td>
                    <td className="px-2 py-2 text-center">{f.dg}</td>
                    <td className="px-2 py-2 text-center font-bold text-apf-dorado">{f.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
