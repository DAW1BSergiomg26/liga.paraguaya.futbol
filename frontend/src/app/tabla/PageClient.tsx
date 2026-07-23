"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTabla, getTorneos } from "@/lib/api";
import type { TablaRow } from "@/types";
import { TableSkeleton } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import PageHeader from "@/components/ui/PageHeader";
import Sidebar from "@/components/sidebar/Sidebar";
import { Medal } from "lucide-react";

function Medalla({ pos }: { pos: number }) {
  if (pos === 1) return <span className="mr-1"><Medal className="w-4 h-4 text-apf-amarillo inline" /></span>;
  if (pos === 2) return <span className="mr-1"><Medal className="w-4 h-4 text-gray-300 inline" /></span>;
  if (pos === 3) return <span className="mr-1"><Medal className="w-4 h-4 text-orange-400 inline" /></span>;
  return null;
}

export default function TablaPage() {
  const [torneo, setTorneo] = useState("");

  const { data: torneos } = useQuery<string[]>({
    queryKey: ["torneos"],
    queryFn: () => getTorneos(),
    staleTime: 300_000,
  });

  // Si cambia la lista de torneos del backend, inicializamos con el primero disponible
  useEffect(() => {
    if (torneos && torneos.length > 0 && !torneo) {
      setTorneo(torneos[0]);
    }
  }, [torneos, torneo]);

  const {
    data: filas,
    isLoading,
    error,
  } = useQuery<TablaRow[]>({
    queryKey: ["tabla", torneo],
    queryFn: () => getTabla(torneo),
    enabled: torneo !== "", // Espera a tener el nombre del torneo válido
    staleTime: 60_000,
  });

  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tiltRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const tiltEnabled = useRef(false);

  useEffect(() => {
    tiltEnabled.current = window.matchMedia("(hover: hover)").matches;
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function handleTilt(e: React.MouseEvent, index: number) {
    if (!tiltEnabled.current) return;
    const row = tiltRefs.current[index];
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    row.style.transform = `perspective(600px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
  }

  function handleUntilt(index: number) {
    const row = tiltRefs.current[index];
    if (!row) return;
    row.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg)";
  }

  if (isLoading) return <TableSkeleton rows={12} cols={10} />;

  if (error)
    return <ErrorMessage message="Error al cargar la tabla de posiciones" />;

  const totalEquipos = filas?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        titulo="Tabla de Posiciones"
        subtitulo={`${filas?.length ?? 0} equipos · ${torneo || "Cargando..."}`}
        accion={
          <select
            value={torneo}
            onChange={(e) => setTorneo(e.target.value)}
            className="px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm focus:outline-none focus:border-apf-rojo transition"
          >
            {torneos?.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        }
      />

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div ref={wrapperRef}>
          {!filas || filas.length === 0 ? (
            <div className="text-center py-16 text-texto-secundario">
              <p>No hay datos disponibles para {torneo || "este torneo"}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-borde-sutil">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-terciario border-b border-borde-sutil">
                    <th className="text-left py-3 px-3 sm:px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">
                      Pos
                    </th>
                    <th className="text-left py-3 px-3 sm:px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">
                      Club
                    </th>
                    <th className="text-center py-3 px-2 sm:px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">
                      PJ
                    </th>
                    <th className="text-center py-3 px-2 sm:px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs hidden sm:table-cell">
                      PG
                    </th>
                    <th className="text-center py-3 px-2 sm:px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs hidden sm:table-cell">
                      PE
                    </th>
                    <th className="text-center py-3 px-2 sm:px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs hidden sm:table-cell">
                      PP
                    </th>
                    <th className="text-center py-3 px-2 sm:px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs hidden md:table-cell">
                      GF
                    </th>
                    <th className="text-center py-3 px-2 sm:px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs hidden md:table-cell">
                      GC
                    </th>
                    <th className="text-center py-3 px-2 sm:px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">
                      DG
                    </th>
                    <th className="text-center py-3 px-3 sm:px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">
                      Pts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((row, i) => {
                    const esPodio = row.posicion <= 3;
                    const esDescenso = row.posicion > totalEquipos - 2;
                    const bg =
                      i % 2 === 0 ? "bg-bg-secundario/40" : "bg-transparent";

                    let leftBorder = "";
                    let rowBg = bg;
                    if (esPodio) {
                      leftBorder = "border-l-[3px] border-apf-amarillo";
                    } else if (esDescenso) {
                      leftBorder = "border-l-[3px] border-apf-rojo-oscuro";
                      rowBg = `${bg} bg-apf-rojo/5`;
                    }

                    return (
                      <tr
                        key={`${row.club_id}-${row.posicion}`}
                        ref={(el) => {
                          tiltRefs.current[i] = el;
                        }}
                        className={`${rowBg} ${leftBorder} border-b border-borde-sutil transition-all duration-150 hover:bg-bg-terciario hover:translate-x-0.5 ${visible ? "animate-row-enter" : "opacity-0"} ${row.posicion === 1 ? "animate-pulse-lider shadow-[inset_0_0_18px_-4px_rgba(255,204,0,0.55)] ring-1 ring-apf-amarillo/40" : ""}`}
                        style={{
                          animationDelay: visible ? `${i * 40}ms` : "0ms",
                        }}
                        onMouseMove={(e) => handleTilt(e, i)}
                        onMouseLeave={() => handleUntilt(i)}
                      >
                        <td
                          className={`py-3 px-3 sm:px-4 font-bold ${esPodio ? "text-apf-amarillo" : "text-texto-principal"}`}
                        >
                          <Medalla pos={row.posicion} />
                          {row.posicion}
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-medium text-texto-principal">
                          <div className="flex items-center gap-3">
                            {row.escudo && (
                              <Image
                                src={row.escudo}
                                alt=""
                                width={24}
                                height={24}
                                loading="lazy"
                                className="w-6 h-6 object-contain shrink-0 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-out hover:scale-110 hover:-rotate-3"
                              />
                            )}
                            {row.club}
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-center text-texto-principal">
                          {row.pj}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-center text-victoria hidden sm:table-cell">
                          {row.pg}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-center text-empate hidden sm:table-cell">
                          {row.pe}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-center text-derrota hidden sm:table-cell">
                          {row.pp}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-center text-texto-principal hidden md:table-cell">
                          {row.gf}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-center text-texto-principal hidden md:table-cell">
                          {row.gc}
                        </td>
                        <td
                          className={`py-3 px-2 sm:px-3 text-center font-semibold ${row.dg > 0 ? "text-victoria" : row.dg < 0 ? "text-derrota" : "text-texto-principal"}`}
                        >
                          {row.dg > 0 ? `+${row.dg}` : row.dg}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-center font-bold text-texto-principal text-sm">
                          {row.puntos}
                        </td>
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
