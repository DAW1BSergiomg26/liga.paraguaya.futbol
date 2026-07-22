"use client";

import { useEffect } from "react";

export default function TacticoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TacticoError]", error);
  }, [error]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-center">
      <div className="max-w-md mx-auto bg-bg-secundario/60 rounded-2xl border border-borde-sutil p-8 space-y-5">
        <div className="text-5xl">⚽</div>
        <h2 className="text-xl font-bold text-white">
          Error en Análisis Táctico
        </h2>
        <p className="text-texto-secundario text-sm leading-relaxed">
          No pudimos cargar el análisis táctico. El backend puede estar
          temporalmente no disponible.
        </p>
        {error.digest && (
          <p className="text-xs text-texto-apagado font-mono">
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-apf-rojo hover:bg-apf-rojo-oscuro text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Reintentar
        </button>
        <a
          href="/"
          className="block text-sm text-texto-secundario hover:text-white transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
