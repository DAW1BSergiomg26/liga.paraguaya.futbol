"use client";

import { useEffect, useRef, useState } from "react";

const EASE_DURATION = 1500;

function AnimatedNumber({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / EASE_DURATION, 1);
      setVal(Math.floor((1 - (1 - t) * (1 - t)) * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target]);

  return <span>{val.toLocaleString()}</span>;
}

export default function HeroStats({
  clubesCount,
  partidosTotal,
  equiposCount,
  torneoLabel,
  hasErrors,
  errClubes,
  errPartidos,
  errTorneos,
  errTabla,
}: {
  clubesCount: number;
  partidosTotal: number;
  equiposCount: number;
  torneoLabel: string | null;
  hasErrors: boolean;
  errClubes: string | null;
  errPartidos: string | null;
  errTorneos: string | null;
  errTabla: string | null;
}) {
  return (
    <>
      <section className="mb-12 p-8 rounded-2xl border border-borde-marca bg-bg-secundario/80 shadow-xl">
        <p className="text-py-rojo text-sm font-bold uppercase tracking-widest mb-3">
          Proyecto DAW · Next.js + FastAPI
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-4 titulo-modulo text-gradient-shine animate-shine">
          Liga Paraguaya de Fútbol
        </h1>
        <p className="text-texto-secundario max-w-xl text-lg">
          Plataforma de datos, clubes, partidos y tabla de posiciones del fútbol paraguayo.
        </p>
        {torneoLabel && (
          <p className="text-texto-apagado text-sm mt-2">
            Temporada actual: <span className="text-texto-principal font-medium">{torneoLabel}</span>
          </p>
        )}
        {hasErrors ? (
          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-derrota/20 text-derrota border border-derrota/30 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-derrota shadow-lg shadow-derrota/50" />
            Error de conexión con el backend
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-victoria/20 text-victoria border border-victoria/30 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-victoria shadow-lg shadow-victoria/50" />
            Backend activo correctamente
          </div>
        )}
      </section>

      {errClubes && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar clubes: {errClubes}
        </div>
      )}
      {errPartidos && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar partidos: {errPartidos}
        </div>
      )}
      {errTorneos && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar torneos: {errTorneos}
        </div>
      )}
      {errTabla && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar tabla: {errTabla}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <p className="text-3xl font-bold text-py-rojo">
            <AnimatedNumber target={clubesCount} />
          </p>
          <p className="text-texto-secundario mt-1">Clubes</p>
        </div>
        <div className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <p className="text-3xl font-bold text-py-rojo">
            <AnimatedNumber target={partidosTotal} />
          </p>
          <p className="text-texto-secundario mt-1">Partidos</p>
        </div>
        <div className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <p className="text-3xl font-bold text-py-rojo">
            <AnimatedNumber target={equiposCount} />
          </p>
          <p className="text-texto-secundario mt-1">Equipos en tabla</p>
        </div>
      </div>
    </>
  );
}
