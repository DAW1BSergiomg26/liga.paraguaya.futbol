"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClubes, getH2H } from "@/lib/api";
import type { Club, H2HResponse } from "@/types";
import { TableSkeleton } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import PageHeader from "@/components/ui/PageHeader";

export default function H2HPage() {
  const [clubA, setClubA] = useState("");
  const [clubB, setClubB] = useState("");

  const { data: clubes } = useQuery<Club[]>({
    queryKey: ["clubes"],
    queryFn: () => getClubes(),
  });

  const { data: h2h, isLoading, error } = useQuery<H2HResponse>({
    queryKey: ["h2h", clubA, clubB],
    queryFn: () => getH2H(clubA, clubB),
    enabled: !!clubA && !!clubB,
  });

  function selectOptions() {
    return (clubes || []).map((c) => (
      <option key={c.id} value={c.id}>{c.nombre}</option>
    ));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        titulo="Head-to-Head"
        subtitulo="Compará el historial entre dos clubes"
      />

      <div className="flex flex-col sm:flex-row items-end gap-4 mb-8">
        <div className="flex-1 w-full">
          <label className="block text-sm text-texto-secundario mb-1">Club A</label>
          <select
            value={clubA}
            onChange={(e) => setClubA(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm"
          >
            <option value="">Seleccionar...</option>
            {selectOptions()}
          </select>
        </div>
        <span className="text-2xl text-texto-apagado pb-1 hidden sm:block">vs</span>
        <div className="flex-1 w-full">
          <label className="block text-sm text-texto-secundario mb-1">Club B</label>
          <select
            value={clubB}
            onChange={(e) => setClubB(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm"
          >
            <option value="">Seleccionar...</option>
            {selectOptions()}
          </select>
        </div>
      </div>

      {!clubA || !clubB ? (
        <div className="text-center py-16 text-texto-secundario border border-dashed border-borde-sutil rounded-xl">
          <p className="text-lg">Seleccioná dos clubes para ver su historial.</p>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : error ? (
        <ErrorMessage message="Error al cargar el historial" />
      ) : h2h ? (
        <>
          {/* Header con escudos */}
          <div className="flex items-center justify-center gap-6 mb-8 p-6 rounded-2xl border border-borde-sutil bg-bg-secundario/60">
            <div className="flex flex-col items-center gap-2">
              {h2h.club_a.escudo && (
                <Image src={h2h.club_a.escudo} alt={h2h.club_a.nombre} width={64} height={64} loading="lazy" className="w-16 h-16 object-contain" />
              )}
              <span className="font-bold text-lg text-center">{h2h.club_a.nombre}</span>
            </div>
            <span className="text-2xl font-bold text-texto-apagado">VS</span>
            <div className="flex flex-col items-center gap-2">
              {h2h.club_b.escudo && (
                <Image src={h2h.club_b.escudo} alt={h2h.club_b.nombre} width={64} height={64} loading="lazy" className="w-16 h-16 object-contain" />
              )}
              <span className="font-bold text-lg text-center">{h2h.club_b.nombre}</span>
            </div>
          </div>

          {/* Tarjeta de resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
            <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
              <p className="text-2xl font-bold text-white">{h2h.resumen.pj}</p>
              <p className="text-xs text-texto-secundario uppercase tracking-wider">Partidos</p>
            </div>
            <div className="p-4 rounded-xl bg-victoria/10 border border-victoria/20 text-center">
              <p className="text-2xl font-bold text-victoria">{h2h.resumen.victorias_a}</p>
              <p className="text-xs text-victoria/80 uppercase tracking-wider">{h2h.club_a.nombre.split(" ")[0]}</p>
            </div>
            <div className="p-4 rounded-xl bg-empate/10 border border-empate/20 text-center">
              <p className="text-2xl font-bold text-empate">{h2h.resumen.empates}</p>
              <p className="text-xs text-empate/80 uppercase tracking-wider">Empates</p>
            </div>
            <div className="p-4 rounded-xl bg-derrota/10 border border-derrota/20 text-center">
              <p className="text-2xl font-bold text-derrota">{h2h.resumen.victorias_b}</p>
              <p className="text-xs text-derrota/80 uppercase tracking-wider">{h2h.club_b.nombre.split(" ")[0]}</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
              <p className="text-2xl font-bold text-apf-rojo">{h2h.resumen.goles_a}</p>
              <p className="text-xs text-texto-secundario uppercase tracking-wider">Goles {h2h.club_a.nombre.split(" ")[0]}</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
              <p className="text-2xl font-bold text-apf-azul">{h2h.resumen.goles_b}</p>
              <p className="text-xs text-texto-secundario uppercase tracking-wider">Goles {h2h.club_b.nombre.split(" ")[0]}</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center col-span-2 lg:col-span-1">
              <p className="text-2xl font-bold text-apf-amarillo">{h2h.resumen.goles_a - h2h.resumen.goles_b > 0 ? "+" : ""}{h2h.resumen.goles_a - h2h.resumen.goles_b}</p>
              <p className="text-xs text-texto-secundario uppercase tracking-wider">Diferencia</p>
            </div>
          </div>

          {/* Mayor goleada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {h2h.resumen.mayor_goleada_a && (
              <div className="p-4 rounded-xl border border-victoria/20 bg-victoria/5">
                <p className="text-xs text-victoria/70 uppercase tracking-wider mb-1">Mayor goleada de {h2h.club_a.nombre.split(" ")[0]}</p>
                <p className="text-3xl font-bold text-white">{h2h.resumen.mayor_goleada_a.goles} - {h2h.resumen.mayor_goleada_a.goles_recibidos}</p>
                <p className="text-sm text-texto-secundario">{h2h.resumen.mayor_goleada_a.fecha}</p>
              </div>
            )}
            {h2h.resumen.mayor_goleada_b && (
              <div className="p-4 rounded-xl border border-derrota/20 bg-derrota/5">
                <p className="text-xs text-derrota/70 uppercase tracking-wider mb-1">Mayor goleada de {h2h.club_b.nombre.split(" ")[0]}</p>
                <p className="text-3xl font-bold text-white">{h2h.resumen.mayor_goleada_b.goles} - {h2h.resumen.mayor_goleada_b.goles_recibidos}</p>
                <p className="text-sm text-texto-secundario">{h2h.resumen.mayor_goleada_b.fecha}</p>
              </div>
            )}
          </div>

          {/* Tabla de enfrentamientos */}
          <h2 className="text-2xl font-bold titulo-modulo mb-4">Todos los enfrentamientos</h2>
          {h2h.partidos.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-borde-sutil rounded-xl text-texto-secundario">
              No hay enfrentamientos registrados entre estos clubes.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-borde-sutil">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-terciario border-b border-borde-sutil">
                    <th className="text-left py-3 px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Torneo</th>
                    <th className="text-center py-3 px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Resultado</th>
                    <th className="text-center py-3 px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {h2h.partidos.map((p, i) => {
                    const gA = p.local_id === clubA ? p.goles_local : p.goles_visitante;
                    const gB = p.local_id === clubB ? p.goles_local : p.goles_visitante;
                    const ganóA = gA !== null && gB !== null && gA > gB;
                    const ganóB = gA !== null && gB !== null && gB > gA;
                    const bg = i % 2 === 0 ? "bg-bg-secundario/40" : "bg-transparent";

                    return (
                      <tr key={p.id} className={`${bg} border-b border-borde-sutil transition-all duration-150 hover:bg-bg-terciario`}>
                        <td className="py-3 px-4 text-texto-principal">{p.fecha}</td>
                        <td className="py-3 px-4 text-texto-secundario">{p.torneo} <span className="text-texto-apagado">· J{p.jornada}</span></td>
                        <td className={`py-3 px-4 text-center font-bold text-lg ${ganóA ? "text-victoria" : ganóB ? "text-derrota" : "text-empate"}`}>
                          {gA !== null && gB !== null ? `${gA} - ${gB}` : "—"}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.estado === "finalizado" ? "bg-green-900/30 text-green-300" :
                            p.estado === "en_vivo" ? "bg-red-900/30 text-red-300" :
                            "bg-blue-900/30 text-blue-300"
                          }`}>{p.estado}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
