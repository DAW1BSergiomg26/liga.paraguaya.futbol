"use client";

import { useEffect } from "react";
import { CircleDot } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 space-y-6">
        <div className="text-6xl flex justify-center"><CircleDot className="w-16 h-16 text-apf-rojo" /></div>
        <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-barlow-condensed)]">
          Ups, algo salió mal
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          No pudimos cargar esta sección. Puede ser un problema temporal de
          conexión con el servidor.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-500 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-[#CC001C] hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#0a0f1a]"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
          Reintentar
        </button>
        <a
          href="/"
          className="block text-sm text-gray-400 hover:text-white transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </section>
  );
}
