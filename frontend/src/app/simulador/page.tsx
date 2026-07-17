"use client";

import Image from "next/image";
import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClubes, predecirPartido } from "@/lib/api";
import { escudoUrl } from "@/lib/escudos";
import type { Club, SimulationResultOut } from "@/types";
import PageHeader from "@/components/ui/PageHeader";

type ModalSide = "home" | "away";

export default function SimuladorPage() {
  const [homeClub, setHomeClub] = useState<Club | null>(null);
  const [awayClub, setAwayClub] = useState<Club | null>(null);
  const [modalSide, setModalSide] = useState<ModalSide | null>(null);
  const [result, setResult] = useState<SimulationResultOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: clubes } = useQuery<Club[]>({
    queryKey: ["clubes"],
    queryFn: () => getClubes(),
  });

  const openModal = useCallback((side: ModalSide) => {
    setModalSide(side);
    setSearch("");
  }, []);

  const closeModal = useCallback(() => {
    setModalSide(null);
    setSearch("");
  }, []);

  const selectClub = useCallback(
    (club: Club) => {
      if (modalSide === "home") {
        setHomeClub(club);
      } else {
        setAwayClub(club);
      }
      setResult(null);
      closeModal();
    },
    [modalSide, closeModal]
  );

  // Cerrar modal con Escape y focus trap
  useEffect(() => {
    if (!modalSide) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);
    // Focus search input after modal opens
    const timer = setTimeout(() => searchInputRef.current?.focus(), 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [modalSide, closeModal]);

  const canSimulate =
    homeClub !== null &&
    awayClub !== null &&
    homeClub.id !== awayClub.id &&
    !loading;

  const handleSimulate = async () => {
    if (!homeClub || !awayClub) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await predecirPartido({
        home_club_id: homeClub.id,
        away_club_id: awayClub.id,
      });
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al simular el partido";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredClubes = (clubes || []).filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  function renderEscudo(club: Club, size: number) {
    const localSrc = escudoUrl(club.id);
    const src = localSrc || club.escudo || undefined;
    if (!src) return null;
    return (
      <Image
        src={src}
        alt={`Escudo de ${club.nombre}`}
        width={size}
        height={size}
        loading="lazy"
        className="object-contain"
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        titulo="Simulador de Partidos"
        subtitulo="Elegí dos clubes y conocé la probabilidad de cada resultado"
      />

      {/* === VS Layout === */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch mb-10">
        {/* Panel Local */}
        <button
          type="button"
          onClick={() => openModal("home")}
          aria-label={
            homeClub
              ? `Cambiar club local: ${homeClub.nombre}`
              : "Seleccionar club local"
          }
          className={`group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border transition-all duration-300 min-h-[260px] cursor-pointer ${
            homeClub
              ? "border-borde-marca bg-gradient-to-b from-bg-secundario/80 to-bg-primario/60 hover:shadow-lg hover:shadow-apf-rojo/10"
              : "border-dashed border-borde-sutil bg-bg-secundario/30 hover:border-apf-rojo/40 hover:bg-bg-secundario/50"
          }`}
          style={
            homeClub && homeClub.colores?.length
              ? {
                  borderColor: `${homeClub.colores[0]}40`,
                  background: `linear-gradient(180deg, ${homeClub.colores[0]}15 0%, transparent 100%)`,
                }
              : undefined
          }
        >
          {homeClub ? (
            <>
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                {renderEscudo(homeClub, 128)}
              </div>
              <div className="text-center">
                <p className="text-xs text-texto-secundario uppercase tracking-widest mb-1">
                  Local
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide">
                  {homeClub.nombre}
                </h2>
                {homeClub.estadio && (
                  <p className="text-xs text-texto-apagado mt-1">
                    {homeClub.estadio}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-borde-sutil flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-texto-apagado"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
              <p className="text-texto-secundario text-sm font-medium">
                Seleccionar Club Local
              </p>
            </>
          )}
        </button>

        {/* VS Badge */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-apf-rojo to-apf-dorado flex items-center justify-center shadow-lg shadow-apf-rojo/30">
            <span className="text-black font-black text-lg tracking-tight">
              VS
            </span>
          </div>
        </div>

        {/* Panel Visitante */}
        <button
          type="button"
          onClick={() => openModal("away")}
          aria-label={
            awayClub
              ? `Cambiar club visitante: ${awayClub.nombre}`
              : "Seleccionar club visitante"
          }
          className={`group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border transition-all duration-300 min-h-[260px] cursor-pointer ${
            awayClub
              ? "border-borde-marca bg-gradient-to-b from-bg-secundario/80 to-bg-primario/60 hover:shadow-lg hover:shadow-apf-rojo/10"
              : "border-dashed border-borde-sutil bg-bg-secundario/30 hover:border-apf-rojo/40 hover:bg-bg-secundario/50"
          }`}
          style={
            awayClub && awayClub.colores?.length
              ? {
                  borderColor: `${awayClub.colores[0]}40`,
                  background: `linear-gradient(180deg, ${awayClub.colores[0]}15 0%, transparent 100%)`,
                }
              : undefined
          }
        >
          {awayClub ? (
            <>
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                {renderEscudo(awayClub, 128)}
              </div>
              <div className="text-center">
                <p className="text-xs text-texto-secundario uppercase tracking-widest mb-1">
                  Visitante
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide">
                  {awayClub.nombre}
                </h2>
                {awayClub.estadio && (
                  <p className="text-xs text-texto-apagado mt-1">
                    {awayClub.estadio}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-borde-sutil flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-texto-apagado"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
              <p className="text-texto-secundario text-sm font-medium">
                Seleccionar Club Visitante
              </p>
            </>
          )}
        </button>
      </div>

      {/* Botón Simular */}
      <div className="flex justify-center mb-10">
        <button
          type="button"
          onClick={handleSimulate}
          disabled={!canSimulate}
          aria-disabled={!canSimulate}
          aria-label="Simular partido"
          className={`px-10 py-4 rounded-xl font-bold text-lg uppercase tracking-wider transition-all duration-300 ${
            canSimulate
              ? "bg-gradient-to-r from-apf-rojo to-apf-dorado text-black hover:shadow-lg hover:shadow-apf-rojo/30 hover:scale-105 active:scale-95"
              : "bg-bg-terciario text-texto-apagado cursor-not-allowed border border-borde-sutil"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Simulando...
            </span>
          ) : (
            "Simular Partido"
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="max-w-xl mx-auto mb-8 p-4 rounded-xl border border-derrota/30 bg-derrota/10 text-derrota text-center text-sm"
        >
          {error}
        </div>
      )}

      {/* === Resultados === */}
      {result && (
        <div className="space-y-8">
          {/* Barras de probabilidad */}
          <section aria-labelledby="probabilidades-heading">
            <h2
              id="probabilidades-heading"
              className="text-2xl font-bold titulo-modulo text-center mb-6"
            >
              Probabilidades
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Local */}
              <div className="rounded-xl border border-borde-sutil bg-bg-secundario/60 p-5 text-center">
                <p className="text-xs text-texto-secundario uppercase tracking-widest mb-2">
                  Victoria Local
                </p>
                <p className="text-3xl font-bold text-victoria">
                  {result.probabilidad_local.toFixed(1)}%
                </p>
                <div className="mt-3 h-2 rounded-full bg-bg-terciario overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-victoria to-emerald-400 transition-all duration-700 ease-out"
                    style={{ width: `${result.probabilidad_local}%` }}
                  />
                </div>
                <p className="text-xs text-texto-apagado mt-2">
                  λ = {result.lambda_local.toFixed(2)} goles
                </p>
              </div>

              {/* Empate */}
              <div className="rounded-xl border border-borde-sutil bg-bg-secundario/60 p-5 text-center">
                <p className="text-xs text-texto-secundario uppercase tracking-widest mb-2">
                  Empate
                </p>
                <p className="text-3xl font-bold text-empate">
                  {result.probabilidad_empate.toFixed(1)}%
                </p>
                <div className="mt-3 h-2 rounded-full bg-bg-terciario overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-empate to-amber-400 transition-all duration-700 ease-out"
                    style={{ width: `${result.probabilidad_empate}%` }}
                  />
                </div>
              </div>

              {/* Visitante */}
              <div className="rounded-xl border border-borde-sutil bg-bg-secundario/60 p-5 text-center">
                <p className="text-xs text-texto-secundario uppercase tracking-widest mb-2">
                  Victoria Visitante
                </p>
                <p className="text-3xl font-bold text-derrota">
                  {result.probabilidad_visitante.toFixed(1)}%
                </p>
                <div className="mt-3 h-2 rounded-full bg-bg-terciario overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-derrota to-rose-400 transition-all duration-700 ease-out"
                    style={{ width: `${result.probabilidad_visitante}%` }}
                  />
                </div>
                <p className="text-xs text-texto-apagado mt-2">
                  λ = {result.lambda_visitante.toFixed(2)} goles
                </p>
              </div>
            </div>

            {/* Barra combinada */}
            <div className="rounded-xl border border-borde-sutil bg-bg-secundario/40 p-4">
              <div className="flex h-4 rounded-full overflow-hidden">
                <div
                  className="bg-victoria transition-all duration-700 ease-out"
                  style={{ width: `${result.probabilidad_local}%` }}
                  aria-label={`Victoria local: ${result.probabilidad_local}%`}
                />
                <div
                  className="bg-empate transition-all duration-700 ease-out"
                  style={{ width: `${result.probabilidad_empate}%` }}
                  aria-label={`Empate: ${result.probabilidad_empate}%`}
                />
                <div
                  className="bg-derrota transition-all duration-700 ease-out"
                  style={{ width: `${result.probabilidad_visitante}%` }}
                  aria-label={`Victoria visitante: ${result.probabilidad_visitante}%`}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-texto-secundario">
                <span>
                  {result.home_club_name}{" "}
                  <span className="text-victoria font-semibold">
                    {result.probabilidad_local.toFixed(1)}%
                  </span>
                </span>
                <span>
                  Empate{" "}
                  <span className="text-empate font-semibold">
                    {result.probabilidad_empate.toFixed(1)}%
                  </span>
                </span>
                <span>
                  {result.away_club_name}{" "}
                  <span className="text-derrota font-semibold">
                    {result.probabilidad_visitante.toFixed(1)}%
                  </span>
                </span>
              </div>
            </div>
          </section>

          {/* Top 3 Resultados Exactos */}
          <section aria-labelledby="marcadores-heading">
            <h2
              id="marcadores-heading"
              className="text-2xl font-bold titulo-modulo text-center mb-6"
            >
              Resultados Más Probables
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {result.resultados_mas_probables.map((score, idx) => {
                const medal =
                  idx === 0
                    ? "from-apf-rojo to-apf-dorado"
                    : idx === 1
                      ? "from-bg-terciario to-bg-secundario"
                      : "from-bg-terciario/60 to-bg-secundario/60";
                const border =
                  idx === 0
                    ? "border-apf-rojo/40"
                    : "border-borde-sutil";
                const scorePct = (score.probabilidad * 100).toFixed(1);

                return (
                  <div
                    key={`${score.goles_local}-${score.goles_visitante}`}
                    className={`rounded-xl border ${border} bg-bg-secundario/60 p-6 text-center relative overflow-hidden`}
                  >
                    {/* Decoración de posición */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${medal}`}
                    />
                    <p className="text-xs text-texto-secundario uppercase tracking-widest mb-3">
                      {idx === 0
                        ? "Más probable"
                        : idx === 1
                          ? "Segundo"
                          : "Tercero"}
                    </p>

                    {/* Marcador */}
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <span className="text-4xl font-black text-white">
                        {score.goles_local}
                      </span>
                      <span className="text-xl text-texto-apagado">-</span>
                      <span className="text-4xl font-black text-white">
                        {score.goles_visitante}
                      </span>
                    </div>

                    {/* Etiquetas */}
                    <div className="flex justify-between text-xs text-texto-secundario mb-3 px-2">
                      <span>{result.home_club_name.split(" ")[0]}</span>
                      <span>{result.away_club_name.split(" ")[0]}</span>
                    </div>

                    {/* Porcentaje */}
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-apf-rojo">
                        {scorePct}%
                      </span>
                      <div className="mt-2 h-1.5 rounded-full bg-bg-terciario overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-apf-rojo to-apf-dorado transition-all duration-700 ease-out"
                          style={{ width: `${score.probabilidad * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* === Modal de Selección de Clubes === */}
      {modalSide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            modalSide === "home"
              ? "Seleccionar club local"
              : "Seleccionar club visitante"
          }
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Panel del modal */}
          <div
            ref={modalRef}
            className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-borde-sutil bg-bg-primario/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between p-5 border-b border-borde-sutil">
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                {modalSide === "home" ? "Club Local" : "Club Visitante"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg bg-bg-terciario flex items-center justify-center text-texto-secundario hover:text-white transition"
                aria-label="Cerrar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Buscador */}
            <div className="p-4 border-b border-borde-sutil">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar club..."
                className="w-full px-4 py-2.5 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm placeholder:text-texto-apagado focus:outline-none focus:border-apf-rojo transition"
                aria-label="Buscar club"
              />
            </div>

            {/* Grilla de clubes */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {filteredClubes.map((club) => {
                  const isSelected =
                    (modalSide === "home" && club.id === homeClub?.id) ||
                    (modalSide === "away" && club.id === awayClub?.id);
                  const isOpponent =
                    (modalSide === "home" && club.id === awayClub?.id) ||
                    (modalSide === "away" && club.id === homeClub?.id);

                  return (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => selectClub(club)}
                      disabled={isOpponent}
                      aria-disabled={isOpponent}
                      aria-label={
                        isOpponent
                          ? `${club.nombre} (ya seleccionado como rival)`
                          : club.nombre
                      }
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        isOpponent
                          ? "opacity-30 cursor-not-allowed border-borde-sutil bg-bg-terciario/30"
                          : isSelected
                            ? "border-apf-rojo bg-apf-rojo/10 shadow-md shadow-apf-rojo/10"
                            : "border-borde-sutil bg-bg-secundario/40 hover:border-apf-rojo/40 hover:bg-bg-secundario/80 cursor-pointer"
                      }`}
                    >
                      <div className="w-12 h-12 relative">
                        {escudoUrl(club.id) || club.escudo ? (
                          <Image
                            src={escudoUrl(club.id) || club.escudo}
                            alt=""
                            width={48}
                            height={48}
                            loading="lazy"
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-bg-terciario flex items-center justify-center text-texto-apagado text-lg font-bold">
                            {club.nombre.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-center text-texto-principal leading-tight font-medium">
                        {club.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredClubes.length === 0 && (
                <div className="text-center py-8 text-texto-secundario text-sm">
                  No se encontraron clubes
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
